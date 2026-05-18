import React, { useRef, useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { useParams, useNavigate } from 'react-router-dom'
import { getConversation } from '../lib/api'
import useAuthUser from '../hooks/useAuthUser'
import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare'
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'

// ─── ICE config ───────────────────────────────────────────────────────────────
const peerConfigConnections = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}

// ─── Silent black-frame helpers (used when cam/mic is off) ───────────────────
const silence = () => {
  const ctx = new AudioContext()
  const oscillator = ctx.createOscillator()
  const dst = oscillator.connect(ctx.createMediaStreamDestination())
  oscillator.start()
  ctx.resume()
  return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
}
const black = ({ width = 640, height = 480 } = {}) => {
  const canvas = Object.assign(document.createElement('canvas'), {
    width,
    height
  })
  canvas.getContext('2d').fillRect(0, 0, width, height)
  return Object.assign(canvas.captureStream().getVideoTracks()[0], {
    enabled: false
  })
}
const blackSilenceStream = () => new MediaStream([black(), silence()])

// ─── Add all tracks of a stream to a peer connection (replaces deprecated addStream) ─
const addStreamToPeer = (pc, stream) => {
  stream.getTracks().forEach(track => pc.addTrack(track, stream))
}

// ─── Replace all senders on a peer connection with new stream tracks ──────────
const replaceStreamOnPeer = async (pc, newStream) => {
  const senders = pc.getSenders()
  const newTracks = newStream.getTracks()
  for (const sender of senders) {
    const newTrack = newTracks.find(t => t.kind === sender.track?.kind)
    if (newTrack) {
      await sender
        .replaceTrack(newTrack)
        .catch(e => console.log('replaceTrack error:', e))
    }
  }
  // If there are no senders yet, fall back to addTrack
  if (senders.length === 0) {
    addStreamToPeer(pc, newStream)
  }
}

// ─── Meeting Timer ────────────────────────────────────────────────────────────
const MeetingTimer = () => {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return (
    <span className='font-mono text-sm text-neutral-content/50 tabular-nums'>
      {hh}:{mm}:{ss}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const VideoMeeting = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { authUser } = useAuthUser()

  // ── Refs ──────────────────────────────────────────────────────────────────
  const socketRef = useRef()
  const socketIdRef = useRef()
  const localVideoref = useRef()
  const videoRef = useRef([])

  // FIX 1: connections lives in a ref so it resets on unmount / StrictMode double-mount
  // and is not shared across module-level scope.
  const connectionsRef = useRef({})

  // FIX 2: ICE candidate buffer — holds candidates that arrive before remoteDescription is set
  const iceCandidateBuffer = useRef({})

  // Track whether socket is fully connected and ready for renegotiation
  const socketReady = useRef(false)

  // ── Media capability flags ────────────────────────────────────────────────
  const [videoAvailable, setVideoAvailable] = useState(true)
  const [audioAvailable, setAudioAvailable] = useState(true)
  const [screenAvailable, setScreenAvailable] = useState(false)

  // ── Media toggle state ────────────────────────────────────────────────────
  const [video, setVideo] = useState()
  const [audio, setAudio] = useState()
  const [screen, setScreen] = useState()

  // ── UI state ──────────────────────────────────────────────────────────────
  const [status, setStatus] = useState('validating')
  const [videos, setVideos] = useState([])

  // ── 1. Validate room → get permissions → connect ──────────────────────────
  useEffect(() => {
    if (!id || !authUser) return

    // Reset peer connections on every mount (StrictMode safety)
    connectionsRef.current = {}
    iceCandidateBuffer.current = {}
    socketReady.current = false

    const init = async () => {
      try {
        const conversation = await getConversation(id)
        const memberIds = conversation.members?.map(m => m._id || m)
        const allowed = memberIds?.includes(authUser._id)
        if (!allowed) {
          setStatus('unauthorized')
          return
        }

        setStatus('ready')
        await getPermissions()
        connectToSocketServer()
      } catch {
        setStatus('error')
      }
    }

    init()

    // Cleanup on unmount
    return () => {
      try {
        localVideoref.current?.srcObject?.getTracks().forEach(t => t.stop())
      } catch (e) {}
      if (socketRef.current) socketRef.current.disconnect()
      Object.values(connectionsRef.current).forEach(pc => pc.close())
      connectionsRef.current = {}
    }
  }, [id, authUser])

  // ── 2. Get permissions without leaking streams ────────────────────────────
  // FIX 3: Use enumerateDevices + queryPermissions instead of calling getUserMedia
  // twice just to probe availability. Only one real getUserMedia call is made.
  const getPermissions = async () => {
    try {
      // Check what devices exist first (no stream acquired yet)
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasVideo = devices.some(d => d.kind === 'videoinput')
      const hasAudio = devices.some(d => d.kind === 'audioinput')

      setVideoAvailable(hasVideo)
      setAudioAvailable(hasAudio)
      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia)

      if (!hasVideo && !hasAudio) return

      // Single getUserMedia call — no leaked streams
      const stream = await navigator.mediaDevices
        .getUserMedia({
          video: hasVideo,
          audio: hasAudio
        })
        .catch(() => null)

      if (!stream) return

      window.localStream = stream
      if (localVideoref.current) localVideoref.current.srcObject = stream

      // Set toggle state AFTER stream is ready so the renegotiation effect
      // only fires once the socket is also connected (socketReady guard below)
      setVideo(hasVideo)
      setAudio(hasAudio)
    } catch (e) {
      console.log('getPermissions error:', e)
    }
  }

  // ── 3. Re-acquire media when toggles change ───────────────────────────────
  // FIX 4: Guard with socketReady so this doesn't fire before peers exist
  useEffect(() => {
    if (video === undefined || audio === undefined) return
    if (!socketReady.current) return // don't renegotiate before socket is up
    getUserMedia()
  }, [audio, video])

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video, audio })
        .then(getUserMediaSuccess)
        .catch(e => console.log('getUserMedia error:', e))
    } else {
      try {
        localVideoref.current?.srcObject?.getTracks().forEach(t => t.stop())
      } catch (e) {}
    }
  }

  // ── getUserMediaSuccess ───────────────────────────────────────────────────
  const getUserMediaSuccess = async stream => {
    // Stop old tracks
    try {
      window.localStream.getTracks().forEach(t => t.stop())
    } catch (e) {}
    window.localStream = stream
    localVideoref.current.srcObject = stream

    const connections = connectionsRef.current

    // FIX 5: Use replaceTrack instead of addStream (addStream is deprecated/removed)
    // replaceTrack doesn't require renegotiation for same-kind track swaps,
    // but we still send a new offer so the remote side gets the updated SDP.
    for (const peerId in connections) {
      if (peerId === socketIdRef.current) continue
      await replaceStreamOnPeer(connections[peerId], stream)
      connections[peerId].createOffer().then(description => {
        connections[peerId]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              'signal',
              peerId,
              JSON.stringify({ sdp: connections[peerId].localDescription })
            )
          })
          .catch(e => console.log(e))
      })
    }

    // When a track ends (e.g. user unplugs camera), fall back to black/silence
    stream.getTracks().forEach(track => {
      track.onended = async () => {
        setVideo(false)
        setAudio(false)
        try {
          localVideoref.current.srcObject.getTracks().forEach(t => t.stop())
        } catch (e) {}

        window.localStream = blackSilenceStream()
        localVideoref.current.srcObject = window.localStream

        for (const peerId in connections) {
          if (peerId === socketIdRef.current) continue
          await replaceStreamOnPeer(connections[peerId], window.localStream)
          connections[peerId].createOffer().then(desc => {
            connections[peerId]
              .setLocalDescription(desc)
              .then(() => {
                socketRef.current.emit(
                  'signal',
                  peerId,
                  JSON.stringify({ sdp: connections[peerId].localDescription })
                )
              })
              .catch(e => console.log(e))
          })
        }
      }
    })
  }

  // ── gotMessageFromServer ──────────────────────────────────────────────────
  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message)
    const connections = connectionsRef.current

    if (fromId === socketIdRef.current) return

    // FIX 6: Guard against signals for unknown peers
    if (!connections[fromId]) {
      console.warn('Signal received for unknown peer:', fromId)
      return
    }

    if (signal.sdp) {
      connections[fromId]
        .setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(async () => {
          // FIX 7: Flush buffered ICE candidates now that remoteDescription is set
          const buffered = iceCandidateBuffer.current[fromId] || []
          for (const candidate of buffered) {
            await connections[fromId]
              .addIceCandidate(new RTCIceCandidate(candidate))
              .catch(e => console.log(e))
          }
          iceCandidateBuffer.current[fromId] = []

          if (signal.sdp.type === 'offer') {
            const description = await connections[fromId].createAnswer()
            await connections[fromId].setLocalDescription(description)
            socketRef.current.emit(
              'signal',
              fromId,
              JSON.stringify({ sdp: connections[fromId].localDescription })
            )
          }
        })
        .catch(e => console.log('setRemoteDescription error:', e))
    }

    if (signal.ice) {
      // FIX 8: Buffer ICE candidates if remoteDescription isn't ready yet
      if (!connections[fromId].remoteDescription) {
        iceCandidateBuffer.current[fromId] =
          iceCandidateBuffer.current[fromId] || []
        iceCandidateBuffer.current[fromId].push(signal.ice)
      } else {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch(e => console.log('addIceCandidate error:', e))
      }
    }
  }

  // ── connectToSocketServer ─────────────────────────────────────────────────
  const connectToSocketServer = () => {
    socketRef.current = io('https://backendecomeet.onrender.com/video', {
      withCredentials: true,
      transports: ['polling','websocket']
    })
    socketRef.current.on('signal', gotMessageFromServer)

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-call', window.location.href)
      socketIdRef.current = socketRef.current.id
      socketReady.current = true // socket is up — renegotiation can now fire

      socketRef.current.on('user-left', leftId => {
        // Close and clean up the peer connection
        if (connectionsRef.current[leftId]) {
          connectionsRef.current[leftId].close()
          delete connectionsRef.current[leftId]
        }
        setVideos(vs => vs.filter(v => v.socketId !== leftId))
      })

      socketRef.current.on('user-joined', (id, clients) => {
        const connections = connectionsRef.current

        clients.forEach(socketListId => {
          // Don't recreate an already-existing connection
          if (connections[socketListId]) return

          const pc = new RTCPeerConnection(peerConfigConnections)
          connections[socketListId] = pc

          // ICE candidate handler
          pc.onicecandidate = event => {
            if (event.candidate) {
              socketRef.current.emit(
                'signal',
                socketListId,
                JSON.stringify({ ice: event.candidate })
              )
            }
          }

          // FIX 9: ontrack replaces deprecated onaddstream
          pc.ontrack = event => {
            const stream = event.streams[0]
            if (!stream) return

            const exists = videoRef.current.find(
              v => v.socketId === socketListId
            )
            if (exists) {
              setVideos(prev => {
                const updated = prev.map(v =>
                  v.socketId === socketListId ? { ...v, stream } : v
                )
                videoRef.current = updated
                return updated
              })
            } else {
              const newVideo = { socketId: socketListId, stream }
              setVideos(vs => {
                const updated = [...vs, newVideo]
                videoRef.current = updated
                return updated
              })
            }
          }

          // Add local stream to peer — FIX 10: addTrack instead of addStream
          const localStream = window.localStream || blackSilenceStream()
          if (!window.localStream) window.localStream = localStream
          addStreamToPeer(pc, localStream)
        })

        // Only the newly-joined user creates offers to everyone else
        if (id === socketIdRef.current) {
          for (const id2 in connections) {
            if (id2 === socketIdRef.current) continue
            connections[id2].createOffer().then(offer => {
              connections[id2]
                .setLocalDescription(offer)
                .then(() => {
                  socketRef.current.emit(
                    'signal',
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  )
                })
                .catch(e => console.log(e))
            })
          }
        }
      })
    })
  }

  // ── Screen share ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen === undefined) return
    if (screen) {
      getDisplayMedia()
    }
  }, [screen])

  const getDisplayMedia = () => {
    if (!navigator.mediaDevices.getDisplayMedia) return
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then(getDisplayMediaSuccess)
      .catch(e => console.log('getDisplayMedia error:', e))
  }

  const getDisplayMediaSuccess = async stream => {
    try {
      window.localStream.getTracks().forEach(t => t.stop())
    } catch (e) {}
    window.localStream = stream
    localVideoref.current.srcObject = stream

    const connections = connectionsRef.current
    for (const peerId in connections) {
      if (peerId === socketIdRef.current) continue
      await replaceStreamOnPeer(connections[peerId], stream)
      connections[peerId].createOffer().then(desc => {
        connections[peerId]
          .setLocalDescription(desc)
          .then(() => {
            socketRef.current.emit(
              'signal',
              peerId,
              JSON.stringify({ sdp: connections[peerId].localDescription })
            )
          })
          .catch(e => console.log(e))
      })
    }

    stream.getTracks().forEach(track => {
      track.onended = () => {
        setScreen(false)
        try {
          localVideoref.current.srcObject.getTracks().forEach(t => t.stop())
        } catch (e) {}
        window.localStream = blackSilenceStream()
        localVideoref.current.srcObject = window.localStream
        getUserMedia()
      }
    })
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEndCall = () => {
    try {
      localVideoref.current.srcObject.getTracks().forEach(t => t.stop())
    } catch (e) {}
    if (socketRef.current) socketRef.current.disconnect()
    Object.values(connectionsRef.current).forEach(pc => pc.close())
    navigate('/')
  }

  const handleVideo = () => setVideo(v => !v)
  const handleAudio = () => setAudio(v => !v)
  const handleScreen = () => setScreen(v => !v)

  // ── Status screens ────────────────────────────────────────────────────────
  if (status === 'validating') {
    return (
      <div
        className='min-h-screen bg-neutral flex flex-col items-center justify-center gap-4'
        data-theme='dark'
      >
        <span className='loading loading-ring loading-lg text-primary' />
        <p className='text-neutral-content/40 text-sm tracking-wide'>
          Connecting to meeting…
        </p>
      </div>
    )
  }

  if (status === 'unauthorized') {
    return (
      <div
        className='min-h-screen bg-neutral flex items-center justify-center p-4'
        data-theme='dark'
      >
        <div className='card bg-base-100 shadow-2xl max-w-sm w-full'>
          <div className='card-body items-center text-center gap-5 py-10'>
            <div className='rounded-full bg-error/10 p-5'>
              <svg
                className='w-10 h-10 text-error'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z'
                />
              </svg>
            </div>
            <div>
              <h2 className='card-title justify-center text-xl mb-1'>
                Access Denied
              </h2>
              <p className='text-base-content/50 text-sm'>
                You're not a member of this meeting room.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className='btn btn-error btn-outline w-full'
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        className='min-h-screen bg-neutral flex items-center justify-center p-4'
        data-theme='dark'
      >
        <div className='card bg-base-100 shadow-2xl max-w-sm w-full'>
          <div className='card-body items-center text-center gap-5 py-10'>
            <div className='rounded-full bg-warning/10 p-5'>
              <svg
                className='w-10 h-10 text-warning'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z'
                />
              </svg>
            </div>
            <div>
              <h2 className='card-title justify-center text-xl mb-1'>
                Room Not Found
              </h2>
              <p className='text-base-content/50 text-sm'>
                This room doesn't exist or the link is invalid.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className='btn btn-primary w-full'
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Meeting room ──────────────────────────────────────────────────────────
  const participantCount = videos.length + 1
  const hasRemote = videos.length > 0

  const gridCls = hasRemote
    ? videos.length === 1
      ? 'grid grid-cols-2 gap-3 w-full h-full'
      : 'grid grid-cols-2 md:grid-cols-3 gap-3 w-full h-full'
    : 'flex items-center justify-center w-full h-full gap-3'

  return (
    <div className='min-h-screen bg-neutral flex flex-col' data-theme='dark'>
      {/* ── Top bar ── */}
      <div className='flex items-center justify-between px-5 py-3 bg-neutral-focus/70 border-b border-white/5 backdrop-blur'>
        <span className='badge badge-sm gap-1.5 bg-success/15 text-success border-success/20 py-2.5 px-3'>
          <span className='w-1.5 h-1.5 rounded-full bg-success animate-pulse' />
          Live
        </span>
        <div className='flex items-center gap-1.5 text-neutral-content/50 text-xs'>
          <svg
            className='w-3.5 h-3.5'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
            />
          </svg>
          {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </div>
        <MeetingTimer />
      </div>

      {/* ── Video grid ── */}
      <div className='flex-1 p-3 overflow-hidden'>
        <div className={gridCls}>
          {/* My tile */}
          <div
            className={`relative rounded-2xl overflow-hidden bg-neutral-focus ring-1 ring-white/8 ${
              !hasRemote ? 'w-full max-w-4xl aspect-video' : 'aspect-video'
            }`}
          >
            <video
              ref={localVideoref}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover transition-opacity ${
                video === false ? 'opacity-0' : 'opacity-100'
              }`}
            />
            {video === false && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='avatar placeholder'>
                  <div className='w-20 rounded-full bg-primary/20 text-primary text-2xl font-bold'>
                    <span>{authUser?.fullName?.[0]?.toUpperCase() ?? 'Y'}</span>
                  </div>
                </div>
              </div>
            )}
            <div className='absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/75 to-transparent flex items-center justify-between'>
              <span className='text-white/90 text-xs font-medium flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-success animate-pulse' />
                {authUser?.fullName ?? 'You'}{' '}
                <span className='text-white/40'>(you)</span>
              </span>
              <div className='flex items-center gap-1'>
                {!audio && (
                  <span className='badge badge-xs bg-error/80 border-0 text-white py-2 px-1.5'>
                    <MicOffIcon style={{ fontSize: 11 }} />
                  </span>
                )}
                {!video && (
                  <span className='badge badge-xs bg-base-content/20 border-0 text-white py-2 px-1.5'>
                    <VideocamOffIcon style={{ fontSize: 11 }} />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Remote tiles */}
          {videos.map((v, i) => (
            <div
              key={v.socketId}
              className='relative rounded-2xl overflow-hidden bg-neutral-focus ring-1 ring-white/8 aspect-video'
            >
              <video
                autoPlay
                playsInline
                className='w-full h-full object-cover'
                ref={ref => {
                  if (ref && v.stream) ref.srcObject = v.stream
                }}
              />
              <div className='absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/75 to-transparent'>
                <span className='text-white/90 text-xs font-medium flex items-center gap-1.5'>
                  <span className='w-1.5 h-1.5 rounded-full bg-primary' />
                  Participant {i + 1}
                </span>
              </div>
            </div>
          ))}

          {/* Waiting placeholder */}
          {!hasRemote && (
            <div className='hidden md:flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 w-full max-w-4xl aspect-video gap-3 select-none'>
              <svg
                className='w-9 h-9 text-neutral-content/20'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1}
                  d='M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z'
                />
              </svg>
              <p className='text-neutral-content/25 text-sm'>
                Waiting for others to join…
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Control bar ── */}
      <div className='py-5 px-4 flex justify-center'>
        <div className='inline-flex items-center gap-2 bg-neutral-focus/60 border border-white/8 rounded-2xl px-5 py-3 backdrop-blur-sm shadow-xl'>
          <div
            className='tooltip tooltip-top'
            data-tip={audio ? 'Mute' : 'Unmute'}
          >
            <button
              onClick={handleAudio}
              className={`btn btn-circle ${
                audio
                  ? 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                  : 'btn-error'
              }`}
            >
              {audio ? <MicIcon /> : <MicOffIcon />}
            </button>
          </div>

          <div
            className='tooltip tooltip-top'
            data-tip={video ? 'Camera off' : 'Camera on'}
          >
            <button
              onClick={handleVideo}
              className={`btn btn-circle ${
                video
                  ? 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                  : 'btn-error'
              }`}
            >
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </button>
          </div>

          <div className='w-px h-7 bg-white/10 mx-1' />

          <div className='tooltip tooltip-top' data-tip='Leave meeting'>
            <button
              onClick={handleEndCall}
              className='btn btn-circle btn-lg btn-error shadow-lg shadow-error/30'
            >
              <CallEndIcon />
            </button>
          </div>

          {screenAvailable && (
            <>
              <div className='w-px h-7 bg-white/10 mx-1' />
              <div
                className='tooltip tooltip-top'
                data-tip={screen ? 'Stop sharing' : 'Share screen'}
              >
                <button
                  onClick={handleScreen}
                  className={`btn btn-circle ${
                    screen
                      ? 'btn-primary'
                      : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoMeeting
