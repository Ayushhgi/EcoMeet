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
import { socketUrl } from '../../environment.js'

// ✅ Fix - add free TURN servers + more STUN
const peerConfigConnections = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    // Free TURN servers from open-relay
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
}

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

const addStreamToPeer = (pc, stream) => {
  stream.getTracks().forEach(track => pc.addTrack(track, stream))
}

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
  if (senders.length === 0) {
    addStreamToPeer(pc, newStream)
  }
}

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

const VideoMeeting = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { authUser } = useAuthUser()

  const socketRef = useRef()
  const socketIdRef = useRef()
  const localVideoref = useRef()
  const videoRef = useRef([])
  const connectionsRef = useRef({})
  const iceCandidateBuffer = useRef({})
  const isConnectedRef = useRef(false)
  const socketReady = useRef(false)
  const negotiatingRef = useRef({})
  const signalQueueRef = useRef({})

  const [videoAvailable, setVideoAvailable] = useState(true)
  const [audioAvailable, setAudioAvailable] = useState(true)
  const [screenAvailable, setScreenAvailable] = useState(false)
  const [video, setVideo] = useState()
  const [audio, setAudio] = useState()
  const [screen, setScreen] = useState()
  const [status, setStatus] = useState('validating')
  const [videos, setVideos] = useState([])

  // ── Safe offer creator with negotiation lock ──────────────────────────────
  const safeCreateOffer = async (pc, peerId) => {
    if (pc.signalingState !== 'stable') {
      console.warn(
        `⚠️ Skipping offer to ${peerId} — state is ${pc.signalingState}`
      )
      return
    }
    if (negotiatingRef.current[peerId]) {
      console.warn(`⚠️ Skipping offer to ${peerId} — already negotiating`)
      return
    }

    negotiatingRef.current[peerId] = true
    console.log(`📤 Creating offer for peer: ${peerId}`)

    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      console.log(`✅ Local description set (offer) for peer: ${peerId}`)
      socketRef.current.emit(
        'signal',
        peerId,
        JSON.stringify({ sdp: pc.localDescription })
      )
      console.log(`📡 Offer sent to peer: ${peerId}`)
    } catch (e) {
      console.log('❌ safeCreateOffer error:', e)
    } finally {
      negotiatingRef.current[peerId] = false
    }
  }

  // ── Process a single signal ───────────────────────────────────────────────
  const processSignal = async (fromId, signal) => {
    const connections = connectionsRef.current
    const pc = connections[fromId]
    if (!pc) return

    if (signal.sdp) {
      console.log(
        `📩 Received SDP (${signal.sdp.type}) from: ${fromId}, current state: ${pc.signalingState}`
      )

      if (
        (signal.sdp.type === 'offer' && pc.signalingState !== 'stable') ||
        (signal.sdp.type === 'answer' &&
          pc.signalingState !== 'have-local-offer')
      ) {
        console.warn(
          `⚠️ Ignoring ${signal.sdp.type} — wrong state: ${pc.signalingState}`
        )
        return
      }

      if (signal.sdp.type === 'offer' && negotiatingRef.current[fromId]) {
        console.warn(`⚠️ Ignoring offer from ${fromId} — already negotiating`)
        return
      }

      try {
        if (signal.sdp.type === 'offer') negotiatingRef.current[fromId] = true

        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
        console.log(
          `✅ Remote description set (${signal.sdp.type}) from: ${fromId}`
        )

        const buffered = iceCandidateBuffer.current[fromId] || []
        if (buffered.length > 0) {
          console.log(
            `🧊 Flushing ${buffered.length} buffered ICE candidates for: ${fromId}`
          )
        }
        for (const candidate of buffered) {
          await pc
            .addIceCandidate(new RTCIceCandidate(candidate))
            .catch(e => console.log('❌ ICE flush error:', e))
        }
        iceCandidateBuffer.current[fromId] = []

        if (signal.sdp.type === 'offer') {
          console.log(`📤 Creating answer for: ${fromId}`)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          console.log(`✅ Local description set (answer) for: ${fromId}`)
          socketRef.current.emit(
            'signal',
            fromId,
            JSON.stringify({ sdp: pc.localDescription })
          )
          console.log(`📡 Answer sent to: ${fromId}`)
          negotiatingRef.current[fromId] = false
        }
      } catch (e) {
        console.log('❌ processSignal error:', e)
        negotiatingRef.current[fromId] = false
      }
    }

    if (signal.ice) {
      if (!pc.remoteDescription) {
        console.log(`🧊 Buffering ICE candidate from: ${fromId}`)
        iceCandidateBuffer.current[fromId] =
          iceCandidateBuffer.current[fromId] || []
        iceCandidateBuffer.current[fromId].push(signal.ice)
      } else {
        pc.addIceCandidate(new RTCIceCandidate(signal.ice))
          .then(() => console.log(`🧊 ICE candidate added from: ${fromId}`))
          .catch(e => console.log('❌ addIceCandidate error:', e))
      }
    }
  }

  // ── gotMessageFromServer ──────────────────────────────────────────────────
  const gotMessageFromServer = (fromId, message) => {
    if (fromId === socketIdRef.current) return

    const signal = JSON.parse(message)
    const connections = connectionsRef.current

    if (!connections[fromId]) {
      console.warn(`⚠️ Queuing signal from unknown peer: ${fromId}`)
      signalQueueRef.current[fromId] = signalQueueRef.current[fromId] || []
      signalQueueRef.current[fromId].push(message)
      return
    }

    processSignal(fromId, signal)
  }

  // ── 1. Validate room → get permissions → connect ──────────────────────────
  useEffect(() => {
    if (!id || !authUser) return

    connectionsRef.current = {}
    iceCandidateBuffer.current = {}
    negotiatingRef.current = {}
    signalQueueRef.current = {}
    isConnectedRef.current = false
    socketReady.current = false

    const init = async () => {
      try {
        console.log('🔍 Validating room access...')
        const conversation = await getConversation(id)
        const memberIds = conversation.members?.map(m => m._id || m)
        const allowed = memberIds?.includes(authUser._id)
        if (!allowed) {
          console.log('🚫 Unauthorized access attempt')
          setStatus('unauthorized')
          return
        }
        console.log('✅ Room access granted')
        setStatus('ready')
        await getPermissions()
        connectToSocketServer()
      } catch (e) {
        console.log('❌ Room validation error:', e)
        setStatus('error')
      }
    }

    init()

    return () => {
      console.log('🧹 Cleaning up VideoMeeting...')
      isConnectedRef.current = false
      try {
        localVideoref.current?.srcObject?.getTracks().forEach(t => t.stop())
      } catch (e) {}
      if (socketRef.current) socketRef.current.disconnect()
      Object.values(connectionsRef.current).forEach(pc => pc.close())
      connectionsRef.current = {}
      negotiatingRef.current = {}
      signalQueueRef.current = {}
    }
  }, [id, authUser])

  // ── 2. Get media permissions ───────────────────────────────────────────────
  const getPermissions = async () => {
    try {
      console.log('🎥 Checking media devices...')
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasVideo = devices.some(d => d.kind === 'videoinput')
      const hasAudio = devices.some(d => d.kind === 'audioinput')
      console.log(
        `📷 Video available: ${hasVideo}, 🎤 Audio available: ${hasAudio}`
      )

      setVideoAvailable(hasVideo)
      setAudioAvailable(hasAudio)
      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia)

      if (!hasVideo && !hasAudio) return

      const stream = await navigator.mediaDevices
        .getUserMedia({ video: hasVideo, audio: hasAudio })
        .catch(() => null)

      if (!stream) {
        console.log('⚠️ Could not get media stream')
        return
      }

      console.log('✅ Local media stream acquired')
      window.localStream = stream
      if (localVideoref.current) localVideoref.current.srcObject = stream

      setVideo(hasVideo)
      setAudio(hasAudio)
    } catch (e) {
      console.log('❌ getPermissions error:', e)
    }
  }

  // ── 3. Re-acquire media when toggles change ───────────────────────────────
  useEffect(() => {
    if (video === undefined || audio === undefined) return
    if (!socketReady.current) return
    console.log(`🔄 Media toggle changed — video: ${video}, audio: ${audio}`)
    getUserMedia()
  }, [audio, video])

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video, audio })
        .then(getUserMediaSuccess)
        .catch(e => console.log('❌ getUserMedia error:', e))
    } else {
      try {
        localVideoref.current?.srcObject?.getTracks().forEach(t => t.stop())
      } catch (e) {}
    }
  }

  const getUserMediaSuccess = async stream => {
    console.log('✅ New media stream acquired after toggle')
    try {
      window.localStream.getTracks().forEach(t => t.stop())
    } catch (e) {}
    window.localStream = stream
    localVideoref.current.srcObject = stream

    const connections = connectionsRef.current
    for (const peerId in connections) {
      if (peerId === socketIdRef.current) continue
      console.log(`🔁 Replacing stream for peer: ${peerId}`)
      await replaceStreamOnPeer(connections[peerId], stream)
      await safeCreateOffer(connections[peerId], peerId)
    }

    stream.getTracks().forEach(track => {
      track.onended = async () => {
        console.log('⚠️ Local track ended — switching to black silence')
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
          await safeCreateOffer(connections[peerId], peerId)
        }
      }
    })
  }

  // ── connectToSocketServer ─────────────────────────────────────────────────
  const connectToSocketServer = () => {
    if (isConnectedRef.current) {
      console.log('⏭️ Already connected, skipping duplicate socket init')
      return
    }
    isConnectedRef.current = true

    console.log('🔌 Connecting to socket server...')

    socketRef.current = io(`${socketUrl}/video`, {
      withCredentials: true,
      transports: ['polling', 'websocket']
    })

    socketRef.current.on('signal', gotMessageFromServer)

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected:', socketRef.current.id)
      socketRef.current.emit('join-call', window.location.href)
      socketIdRef.current = socketRef.current.id
      socketReady.current = true

      socketRef.current.on('user-left', leftId => {
        console.log('👋 User left:', leftId)
        if (connectionsRef.current[leftId]) {
          connectionsRef.current[leftId].close()
          delete connectionsRef.current[leftId]
          delete iceCandidateBuffer.current[leftId]
          delete negotiatingRef.current[leftId]
          delete signalQueueRef.current[leftId]
        }
        setVideos(vs => {
          const updated = vs.filter(v => v.socketId !== leftId)
          videoRef.current = updated
          return updated
        })
      })

      socketRef.current.on('user-joined', async (joinedId, clients) => {
        console.log(
          `👤 user-joined event — joinedId: ${joinedId}, all clients:`,
          clients
        )
        const connections = connectionsRef.current

        clients.forEach(socketListId => {
          if (connections[socketListId]) {
            console.log(
              `⏭️ Skipping — connection already exists for: ${socketListId}`
            )
            return
          }

          console.log(`🤝 Creating peer connection for: ${socketListId}`)
          const pc = new RTCPeerConnection(peerConfigConnections)
          connections[socketListId] = pc

          pc.onicecandidate = event => {
            if (event.candidate) {
              console.log(`🧊 Sending ICE candidate to: ${socketListId}`)
              socketRef.current.emit(
                'signal',
                socketListId,
                JSON.stringify({ ice: event.candidate })
              )
            }
          }

          pc.onconnectionstatechange = () => {
            console.log(
              `🔗 Connection state with ${socketListId}: ${pc.connectionState}`
            )

            // ✅ Auto restart ICE on failure
            if (pc.connectionState === 'failed') {
              console.log(
                `🔄 ICE failed with ${socketListId}, attempting restart...`
              )
              pc.restartIce()
            }

            // ✅ Clean up disconnected peers
            if (pc.connectionState === 'disconnected') {
              console.log(`⚠️ Peer ${socketListId} disconnected`)
            }
          }

          pc.onsignalingstatechange = () => {
            console.log(
              `📶 Signaling state with ${socketListId}: ${pc.signalingState}`
            )
          }

          pc.ontrack = event => {
            const stream = event.streams[0]
            if (!stream) return
            console.log(`🎞️ Received remote track from: ${socketListId}`)

            const alreadyExists = videoRef.current.find(
              v => v.socketId === socketListId
            )
            if (alreadyExists) {
              console.log(`🔄 Updating existing stream for: ${socketListId}`)
              setVideos(prev => {
                const updated = prev.map(v =>
                  v.socketId === socketListId ? { ...v, stream } : v
                )
                videoRef.current = updated
                return updated
              })
            } else {
              console.log(`➕ Adding new video tile for: ${socketListId}`)
              setVideos(vs => {
                if (vs.find(v => v.socketId === socketListId)) return vs
                const updated = [...vs, { socketId: socketListId, stream }]
                videoRef.current = updated
                return updated
              })
            }
          }

          const localStream = window.localStream || blackSilenceStream()
          if (!window.localStream) window.localStream = localStream
          addStreamToPeer(pc, localStream)
          console.log(`📹 Local stream added to peer: ${socketListId}`)

          // ✅ Flush any queued signals for this peer
          const queued = signalQueueRef.current[socketListId] || []
          if (queued.length > 0) {
            console.log(
              `📬 Flushing ${queued.length} queued signals for: ${socketListId}`
            )
            queued.forEach(msg => processSignal(socketListId, JSON.parse(msg)))
            signalQueueRef.current[socketListId] = []
          }
        })

        // Only the newly joined user creates offers to everyone else
        if (joinedId === socketIdRef.current) {
          console.log(
            '🆕 I am the new joiner — creating offers to all existing peers'
          )
          for (const id2 in connections) {
            if (id2 === socketIdRef.current) continue
            await safeCreateOffer(connections[id2], id2)
          }
        }
      })
    })

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket disconnected')
    })

    socketRef.current.on('connect_error', err => {
      console.log('❌ Socket connection error:', err.message)
    })
  }

  // ── Screen share ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen === undefined) return
    if (screen) getDisplayMedia()
  }, [screen])

  const getDisplayMedia = () => {
    if (!navigator.mediaDevices.getDisplayMedia) return
    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then(getDisplayMediaSuccess)
      .catch(e => console.log('❌ getDisplayMedia error:', e))
  }

  const getDisplayMediaSuccess = async stream => {
    console.log('🖥️ Screen share stream acquired')
    try {
      window.localStream.getTracks().forEach(t => t.stop())
    } catch (e) {}
    window.localStream = stream
    localVideoref.current.srcObject = stream

    const connections = connectionsRef.current
    for (const peerId in connections) {
      if (peerId === socketIdRef.current) continue
      await replaceStreamOnPeer(connections[peerId], stream)
      await safeCreateOffer(connections[peerId], peerId)
    }

    stream.getTracks().forEach(track => {
      track.onended = () => {
        console.log('🖥️ Screen share ended')
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
    console.log('📴 Ending call...')
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
