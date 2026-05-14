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

// ─── WebRTC globals ────────────────────────────────────────────────────────────
var connections = {}

const peerConfigConnections = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const silence = () => {
  let ctx = new AudioContext()
  let oscillator = ctx.createOscillator()
  let dst = oscillator.connect(ctx.createMediaStreamDestination())
  oscillator.start()
  ctx.resume()
  return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
}

const black = ({ width = 640, height = 480 } = {}) => {
  let canvas = Object.assign(document.createElement('canvas'), { width, height })
  canvas.getContext('2d').fillRect(0, 0, width, height)
  let stream = canvas.captureStream()
  return Object.assign(stream.getVideoTracks()[0], { enabled: false })
}

// ─── Component ─────────────────────────────────────────────────────────────────
const VideoMeeting = () => {
  const { id } = useParams()           // conversation / room id from URL
  const navigate = useNavigate()
  const { authUser } = useAuthUser()

  // refs
  const socketRef      = useRef()
  const socketIdRef    = useRef()
  const localVideoref  = useRef()
  const videoRef       = useRef([])

  // media capability flags
  const [videoAvailable,  setVideoAvailable]  = useState(true)
  const [audioAvailable,  setAudioAvailable]  = useState(true)
  const [screenAvailable, setScreenAvailable] = useState(false)

  // media toggle state
  const [video,  setVideo]  = useState()
  const [audio,  setAudio]  = useState()
  const [screen, setScreen] = useState()

  // UI state
  const [lobbyState, setLobbyState] = useState('idle') // 'idle' | 'validating' | 'ready' | 'unauthorized' | 'error'
  const [inMeeting,  setInMeeting]  = useState(false)
  const [videos,     setVideos]     = useState([])
  const [speakingId, setSpeakingId] = useState(null)  // socket id with loudest audio

  // ─── 1. Validate room on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!id || !authUser) return

    const validate = async () => {
      setLobbyState('validating')
      try {
        const conversation = await getConversation(id)
        const memberIds = conversation.members?.map(m => m._id || m)
        const isAllowed = memberIds?.includes(authUser._id)
        setLobbyState(isAllowed ? 'ready' : 'unauthorized')
      } catch {
        setLobbyState('error')
      }
    }

    validate()
  }, [id, authUser])

  // ─── 2. Request permissions once ─────────────────────────────────────────
  useEffect(() => {
    getPermissions()
  }, [])

  const getPermissions = async () => {
    try {
      const vp = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null)
      setVideoAvailable(!!vp)

      const ap = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null)
      setAudioAvailable(!!ap)

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia)

      if (vp || ap) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: !!vp,
          audio: !!ap,
        })
        window.localStream = stream
        if (localVideoref.current) localVideoref.current.srcObject = stream
      }
    } catch (e) {
      console.log(e)
    }
  }

  // ─── 3. Re-acquire media when toggles change ──────────────────────────────
  useEffect(() => {
    if (video !== undefined && audio !== undefined) getUserMedia()
  }, [audio, video])

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video, audio })
        .then(getUserMediaSuccess)
        .catch(e => console.log(e))
    } else {
      try {
        localVideoref.current?.srcObject?.getTracks().forEach(t => t.stop())
      } catch (e) {}
    }
  }

  // ─── getUserMediaSuccess — unchanged WebRTC logic ─────────────────────────
  const getUserMediaSuccess = stream => {
    try { window.localStream.getTracks().forEach(t => t.stop()) } catch (e) {}

    window.localStream = stream
    localVideoref.current.srcObject = stream

    for (let id in connections) {
      if (id === socketIdRef.current) continue
      connections[id].addStream(window.localStream)
      connections[id].createOffer().then(description => {
        connections[id].setLocalDescription(description).then(() => {
          socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }))
        }).catch(e => console.log(e))
      })
    }

    stream.getTracks().forEach(track => {
      track.onended = () => {
        setVideo(false)
        setAudio(false)
        try { localVideoref.current.srcObject.getTracks().forEach(t => t.stop()) } catch (e) {}
        const bs = (...args) => new MediaStream([black(...args), silence()])
        window.localStream = bs()
        localVideoref.current.srcObject = window.localStream
        for (let id in connections) {
          if (id === socketIdRef.current) continue
          connections[id].addStream(window.localStream)
          connections[id].createOffer().then(desc => {
            connections[id].setLocalDescription(desc).then(() => {
              socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }))
            }).catch(e => console.log(e))
          })
        }
      }
    })
  }

  // ─── gotMessageFromServer — unchanged WebRTC logic ────────────────────────
  const gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message)
    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (signal.sdp.type === 'offer') {
            connections[fromId].createAnswer().then(description => {
              connections[fromId].setLocalDescription(description).then(() => {
                socketRef.current.emit('signal', fromId, JSON.stringify({ sdp: connections[fromId].localDescription }))
              }).catch(e => console.log(e))
            }).catch(e => console.log(e))
          }
        }).catch(e => console.log(e))
      }
      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
      }
    }
  }

  // ─── connectToSocketServer — unchanged WebRTC logic ──────────────────────
  const connectToSocketServer = () => {
    socketRef.current = io.connect('https://backendecomeet.onrender.com', { secure: false })
    socketRef.current.on('signal', gotMessageFromServer)

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-call', window.location.href)
      socketIdRef.current = socketRef.current.id

      socketRef.current.on('user-left', id => {
        setVideos(vs => vs.filter(v => v.socketId !== id))
      })

      socketRef.current.on('user-joined', (id, clients) => {
        clients.forEach(socketListId => {
          connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

          connections[socketListId].onicecandidate = event => {
            if (event.candidate != null) {
              socketRef.current.emit('signal', socketListId, JSON.stringify({ ice: event.candidate }))
            }
          }

          connections[socketListId].onaddstream = event => {
            let videoExists = videoRef.current.find(v => v.socketId === socketListId)
            if (videoExists) {
              setVideos(prevVideos => {
                const updated = prevVideos.map(v =>
                  v.socketId === socketListId ? { ...v, stream: event.stream } : v
                )
                videoRef.current = updated
                return updated
              })
            } else {
              let newVideo = { socketId: socketListId, stream: event.stream, autoplay: true, playsinline: true }
              setVideos(vs => {
                const updated = [...vs, newVideo]
                videoRef.current = updated
                return updated
              })
            }
          }

          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream)
          } else {
            const bs = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = bs()
            connections[socketListId].addStream(window.localStream)
          }
        })

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue
            try { connections[id2].addStream(window.localStream) } catch (e) {}
            connections[id2].createOffer().then(offer => {
              connections[id2].setLocalDescription(offer).then(() => {
                socketRef.current.emit('signal', id2, JSON.stringify({ sdp: connections[id2].localDescription }))
              }).catch(e => console.log(e))
            })
          }
        }
      })
    })
  }

  // ─── Screen share — unchanged WebRTC logic ────────────────────────────────
  useEffect(() => {
    if (screen !== undefined) getDisplayMedia()
  }, [screen])

  const getDisplayMedia = () => {
    if (navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        .then(getDisplayMediaSuccess)
        .catch(e => console.log(e))
    }
  }

  const getDisplayMediaSuccess = stream => {
    try { window.localStream.getTracks().forEach(t => t.stop()) } catch (e) {}
    window.localStream = stream
    localVideoref.current.srcObject = stream

    for (let id in connections) {
      if (id === socketIdRef.current) continue
      connections[id].addStream(window.localStream)
      connections[id].createOffer().then(desc => {
        connections[id].setLocalDescription(desc).then(() => {
          socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }))
        }).catch(e => console.log(e))
      })
    }

    stream.getTracks().forEach(track => {
      track.onended = () => {
        setScreen(false)
        try { localVideoref.current.srcObject.getTracks().forEach(t => t.stop()) } catch (e) {}
        const bs = (...args) => new MediaStream([black(...args), silence()])
        window.localStream = bs()
        localVideoref.current.srcObject = window.localStream
        getUserMedia()
      }
    })
  }

  // ─── Join handler ─────────────────────────────────────────────────────────
  const handleJoin = () => {
    setInMeeting(true)
    setVideo(videoAvailable)
    setAudio(audioAvailable)
    connectToSocketServer()
  }

  // ─── Leave handler ────────────────────────────────────────────────────────
  const handleEndCall = () => {
    try { localVideoref.current.srcObject.getTracks().forEach(t => t.stop()) } catch (e) {}
    // disconnect socket
    if (socketRef.current) socketRef.current.disconnect()
    navigate('/')
  }

  // ─── Toggle handlers ──────────────────────────────────────────────────────
  const handleVideo  = () => setVideo(v => !v)
  const handleAudio  = () => setAudio(v => !v)
  const handleScreen = () => setScreen(v => !v)

  // ─── RENDER: validating ───────────────────────────────────────────────────
  if (lobbyState === 'validating') {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-ring loading-lg text-primary"></span>
          <p className="text-base-content/60 text-sm">Verifying access…</p>
        </div>
      </div>
    )
  }

  // ─── RENDER: unauthorized ─────────────────────────────────────────────────
  if (lobbyState === 'unauthorized') {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl border border-error/20 max-w-md w-full">
          <div className="card-body items-center text-center gap-4">
            <div className="bg-error/10 rounded-full p-4">
              <svg className="w-10 h-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="card-title text-error text-xl">Access Denied</h2>
            <p className="text-base-content/60 text-sm">
              You're not a participant in this meeting room. Only invited members can join.
            </p>
            <button onClick={() => navigate('/')} className="btn btn-error btn-outline w-full mt-2">
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── RENDER: error ────────────────────────────────────────────────────────
  if (lobbyState === 'error') {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body items-center text-center gap-4">
            <div className="bg-warning/10 rounded-full p-4">
              <svg className="w-10 h-10 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="card-title text-xl">Room Not Found</h2>
            <p className="text-base-content/60 text-sm">Couldn't load this meeting room. It may have been deleted or the link is invalid.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary w-full mt-2">Go Back Home</button>
          </div>
        </div>
      </div>
    )
  }

  // ─── RENDER: Lobby ────────────────────────────────────────────────────────
  if (!inMeeting) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-2xl border border-base-300 w-full max-w-2xl">
          <div className="card-body gap-6">

            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center bg-primary/10 rounded-2xl p-3 mb-3">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-base-content">Ready to join?</h2>
              <p className="text-base-content/50 text-sm mt-1">Check your camera and mic before entering</p>
            </div>

            {/* Camera preview */}
            <div className="relative rounded-2xl overflow-hidden bg-base-300 aspect-video">
              <video
                ref={localVideoref}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
              {/* Dim overlay with label */}
              <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <span className="text-white text-xs font-medium">Preview</span>
                </div>
              </div>
            </div>

            {/* Device status badges */}
            <div className="flex flex-wrap gap-2 justify-center">
              <div className={`badge badge-lg gap-2 ${videoAvailable ? 'badge-success' : 'badge-error'} badge-outline`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Camera {videoAvailable ? 'Ready' : 'Unavailable'}
              </div>
              <div className={`badge badge-lg gap-2 ${audioAvailable ? 'badge-success' : 'badge-error'} badge-outline`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Microphone {audioAvailable ? 'Ready' : 'Unavailable'}
              </div>
            </div>

            {/* Join button */}
            <button
              onClick={handleJoin}
              className="btn btn-primary btn-lg w-full rounded-xl"
            >
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Join Meeting
            </button>

            <p className="text-center text-base-content/40 text-xs">
              Only members of this conversation can join
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── RENDER: In Meeting ───────────────────────────────────────────────────
  const participantCount = videos.length + 1   // remote peers + me

  return (
    <div className="min-h-screen bg-neutral flex flex-col">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-3 bg-neutral-focus border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span className="text-neutral-content font-semibold text-sm">Live Meeting</span>
        </div>
        <div className="badge badge-neutral badge-outline text-neutral-content/60 text-xs">
          {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </div>
        {/* Timer placeholder */}
        <MeetingTimer />
      </div>

      {/* ── Video grid ── */}
      <div className="flex-1 p-4 overflow-auto">
        {videos.length === 0 ? (
          /* Solo — my video large */
          <div className="flex items-center justify-center h-full">
            <div className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <video ref={localVideoref} autoPlay muted className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3">
                <span className="badge badge-neutral badge-sm gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  You
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Multi-participant grid */
          <div className={`grid gap-3 h-full ${videos.length === 1 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
            {/* My video tile */}
            <div className="relative rounded-2xl overflow-hidden bg-base-300 border border-white/10 shadow-lg aspect-video">
              <video ref={localVideoref} autoPlay muted className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2">
                <span className="badge badge-sm gap-1 bg-black/50 text-white border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                  You
                </span>
              </div>
              {!video && (
                <div className="absolute inset-0 bg-neutral flex items-center justify-center">
                  <div className="avatar placeholder">
                    <div className="bg-neutral-focus text-neutral-content rounded-full w-16">
                      <span className="text-xl">{authUser?.fullName?.[0] ?? 'Y'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Remote video tiles */}
            {videos.map(v => (
              <div key={v.socketId} className="relative rounded-2xl overflow-hidden bg-base-300 border border-white/10 shadow-lg aspect-video">
                <video
                  autoPlay
                  className="w-full h-full object-cover"
                  ref={ref => { if (ref && v.stream) ref.srcObject = v.stream }}
                />
                <div className="absolute bottom-2 left-2">
                  <span className="badge badge-sm gap-1 bg-black/50 text-white border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    Participant
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Control bar ── */}
      <div className="pb-6 pt-3 px-4 flex items-center justify-center gap-3">
        {/* Mic */}
        <button
          onClick={handleAudio}
          className={`btn btn-circle btn-lg ${audio ? 'btn-ghost bg-white/10 text-white hover:bg-white/20' : 'btn-error'}`}
          title={audio ? 'Mute' : 'Unmute'}
        >
          {audio ? <MicIcon /> : <MicOffIcon />}
        </button>

        {/* End call — centrepiece */}
        <button
          onClick={handleEndCall}
          className="btn btn-circle btn-lg btn-error shadow-lg shadow-error/30 scale-110"
          title="Leave meeting"
        >
          <CallEndIcon />
        </button>

        {/* Camera */}
        <button
          onClick={handleVideo}
          className={`btn btn-circle btn-lg ${video ? 'btn-ghost bg-white/10 text-white hover:bg-white/20' : 'btn-error'}`}
          title={video ? 'Turn off camera' : 'Turn on camera'}
        >
          {video ? <VideocamIcon /> : <VideocamOffIcon />}
        </button>

        {/* Screen share (only if available) */}
        {screenAvailable && (
          <button
            onClick={handleScreen}
            className={`btn btn-circle btn-lg ${screen ? 'btn-primary' : 'btn-ghost bg-white/10 text-white hover:bg-white/20'}`}
            title={screen ? 'Stop sharing' : 'Share screen'}
          >
            {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Small timer sub-component ────────────────────────────────────────────────
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
    <span className="text-neutral-content/50 text-xs font-mono tabular-nums">
      {hh}:{mm}:{ss}
    </span>
  )
}

export default VideoMeeting