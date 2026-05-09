import React, { useRef, useState, useEffect } from 'react'
import styles from '../styles/VideoMeeting.module.css'
import { Badge, TextField, Button, IconButton, colors } from '@mui/material'
import { io } from 'socket.io-client'
import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare'
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../../environment'

const server_url = server

var connections = {}

const peerConfigConnections = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
}

const VideoMeeting = () => {
  const socketRef = useRef()
  const socketIdRef = useRef()
  const localVideoref = useRef()

  const [videoAvailable, SetVideoAvailable] = useState(true)
  const [audioAvailable, SetAudioAvailable] = useState(true)

  const [video, setVideo] = useState() 
  const [audio, setAudio] = useState()

  const [screen, setScreen] = useState()
  const [showModal, setModal] = useState(true)

  const [screenAvailable, setScreenAvailable] = useState(false)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState([])
  const [newMessages, setNewMessages] = useState(0)
  const [askForUsername, setAskForUsername] = useState(true)
  const [username, setUsername] = useState('')

  const videoRef = useRef([])

  const [videos, setVideos] = useState([])

  let getUserMediaSuccess = stream => {
    try {
      window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) {
      console.log(e)
    }

    window.localStream = stream
    localVideoref.current.srcObject = stream

    for (let id in connections) {
      if (id === socketIdRef.current) continue

      connections[id].addStream(window.localStream)

      connections[id].createOffer().then(description => {
        // console.log(description)
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              'signal',
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            )
          })
          .catch(e => console.log(e))
      })
    }

    stream.getTracks().forEach(
      track =>
        ( track.onended = () => {
          setVideo(false)
          setAudio(false)

          try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
          } catch (e) {
            console.log(e)
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()])
          window.localStream = blackSilence()
          localVideoref.current.srcObject = window.localStream

          for (let id in connections) {

            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then(description => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    'signal',
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  )
                })
                .catch(e => console.log(e))
            })
          }
        })
    )
  }

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .catch(e => console.log(e))
    } else {
      try {
        let tracks = localVideoref.current?.srcObject?.getTracks()
        tracks?.forEach(track => track.stop())
      } catch (e) {
        console.log(e)
      }
    }
  }

  useEffect(() => {
    getPermissions()
  }, [])

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia()
    }
  }, [audio, video])

  const getMedia = () => {
    setVideo(videoAvailable)
    setAudio(audioAvailable)
    connectToSocketServer()
  }

  const getPermissions = async () => { 
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true
      })
      if (videoPermission) {
        SetVideoAvailable(true)
        console.log('Video permission granted')
      } else {
        SetVideoAvailable(false)
        console.log('Video permission denied')
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true
      })
      if (audioPermission) {
        SetAudioAvailable(true)
        console.log('Audio permission granted')
      } else {
        SetAudioAvailable(false)
        console.log('Audio permission denied')
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true)
      } else {
        setScreenAvailable(false)
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable
        })
        if (userMediaStream) {
          window.localStream = userMediaStream
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream
          }
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleConnect = () => {
    setAskForUsername(false)
    getMedia()
  }

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message)

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === 'offer') {
              connections[fromId]
                .createAnswer()
                .then(description => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        'signal',
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription
                        })
                      )
                    })
                    .catch(e => console.log(e))
                })
                .catch(e => console.log(e))
            } else if (signal.sdp.type === 'answer') {
              // Caller receiving answer
              console.log('Received SDP Answer from', fromId)
            }
          })
          .catch(e => console.log(e))
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch(e => console.log(e))
      }
    }
  }


  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false })

    socketRef.current.on('signal', gotMessageFromServer)

    socketRef.current.on('connect', () => {

      socketRef.current.emit('join-call', window.location.href)

      socketIdRef.current = socketRef.current.id

      socketRef.current.on('chat-message', addMessage)

      socketRef.current.on('user-left', id => {
        setVideos(videos => videos.filter(video => video.socketId !== id))
      })

      socketRef.current.on('user-joined', (id, clients) => {
        clients.forEach(socketListId => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          )
          // Wait for their ice candidate
          connections[socketListId].onicecandidate = event => {
            if (event.candidate != null) {
              socketRef.current.emit(
                'signal',
                socketListId,
                JSON.stringify({ ice: event.candidate })
              )
            }
          }

          // Wait for their video stream
          connections[socketListId].onaddstream = event => {
            console.log('BEFORE:', videoRef.current)
            console.log('FINDING ID: ', socketListId)

            let videoExists = videoRef.current.find(
              video => video.socketId === socketListId
            )

            if (videoExists) {
              console.log('FOUND EXISTING')

              // Update the stream of the existing video
              setVideos(prevVideos => {
                const updatedVideos = prevVideos.map(video =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video
                )
                videoRef.current = updatedVideos
                return updatedVideos
              })
            } else {
              // Create a new video
              console.log('CREATING NEW')
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true
              }

              setVideos(videos => {
                const updatedVideos = [...videos, newVideo]
                videoRef.current = updatedVideos
                return updatedVideos
              })
            }
          }

          // Add the local video stream APNA STREAMS DUSRE PEER KO BHEJNA
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream)
            console.log(window)
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            connections[socketListId].addStream(window.localStream)
          }
        })

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue

            try {
              connections[id2].addStream(window.localStream)
            } catch (e) {}

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
  };
  let silence = () => {
    let ctx = new AudioContext()
    let oscillator = ctx.createOscillator()
    let dst = oscillator.connect(ctx.createMediaStreamDestination())
    oscillator.start()
    ctx.resume()
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
  }
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement('canvas'), {
      width,
      height
    })
    canvas.getContext('2d').fillRect(0, 0, width, height)
    let stream = canvas.captureStream()
    return Object.assign(stream.getVideoTracks()[0], { enabled: false })
  }
  let handleVideo = () => {
    setVideo(!video)
    // getUserMedia();
  }
  let handleAudio = () => {
    setAudio(!audio)
    // getUserMedia();
  }
  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia()
    }
  }, [screen])

  let getDislayMedia = () => {
    if (navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then(getDislayMediaSuccess)
        .then(stream => {})
        .catch(e => {
          console.log(e)
        })
    }
  }
  let getDislayMediaSuccess = stream => {
    console.log('HERE')
    try {
      window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) {
      console.log(e)
    }

    window.localStream = stream
    localVideoref.current.srcObject = stream

    for (let id in connections) {
      if (id === socketIdRef.current) continue

      connections[id].addStream(window.localStream)

      connections[id].createOffer().then(description => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              'signal',
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            )
          })
          .catch(e => console.log(e))
      })
    }

    stream.getTracks().forEach(
      track =>
        (track.onended = () => {
          setScreen(false)

          try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
          } catch (e) {
            console.log(e)
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()])
          window.localStream = blackSilence()
          localVideoref.current.srcObject = window.localStream

          getUserMedia()
        })
    )
  }
  let handleScreen = () => {
    setScreen(!screen)
  }

  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    } catch (e) {}
    window.location.href = '/'
  }
  let openChat = () => {
    setModal(true)
    setNewMessages(0)
  }
  let closeChat = () => {
    setModal(false)
  }
  let handleMessage = e => {
    setMessage(e.target.value)
  }

  const addMessage = (data, sender, socketIdSender) => {
    setMessages(prevMessages => [
      ...prevMessages,
      { sender: sender, data: data }
    ])
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages(prevNewMessages => prevNewMessages + 1)
    }
  }

  let sendMessage = () => {
    console.log(socketRef.current)
    socketRef.current.emit('chat-message', message, username)
    setMessage('')

    // this.setState({ message: "", sender: username })
  }

  let connect = () => {
    setAskForUsername(false)
    getMedia()
    setIsConnecting(true)
  }
  
  const handleKeyPress = e => {
    if (e.key === 'Enter' && username.trim()) {
      connect()
    }
  }
  const [isConnecting, setIsConnecting] = useState(false)

  return (
    <div>
      {askForUsername === true ? (
        <div className='max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200'>
          {/* Header */}
          <div className='text-center mb-8'>
            <h2 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-2'>
              Enter into Lobby
            </h2>
            <p className='text-gray-600'>
              Set up your details before joining the call
            </p>
          </div>

          {/* Form Section */}
          <div className='space-y-6'>
            {/* Username Input */}
            <div>
              <label
                htmlFor='username'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Username
              </label>
              <input
                id='username'
                type='text'
                value={username}
                onChange={e => setUsername(e.target.value)}
                // onKeyPress={handleKeyPress}
                placeholder='Enter your username'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 text-base'
                disabled={isConnecting}
              />
              {!username.trim() && (
                <p className='mt-1 text-sm text-gray-500'>
                  Username is required to join the lobby
                </p>
              )}
            </div>

            {/* Connect Button */}
            <button
              onClick={connect}
              disabled={!username.trim() || isConnecting}
              className='w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center'
            >
              {isConnecting ? (
                <>
                  <svg
                    className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  Connect
                  <svg
                    className='ml-2 h-5 w-5'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </>
              )}
            </button>

            {/* Video Preview Section */}
            <div className='mt-8'>
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <h3 className='text-lg font-medium text-gray-900 mb-4 text-center'>
                  Camera Preview
                </h3>

                <div className='relative bg-gray-900 rounded-lg overflow-hidden aspect-video'>
                  <video
                    ref={localVideoref}
                    style={{ backgroundColor: '#1f2937' }}
                    autoPlay
                    muted
                  ></video>

                  {/* Video overlay for when camera is off */}
                  <div className='absolute inset-0 flex items-center justify-center bg-opacity-75'>
                    <div className='text-center text-white'>
                      <svg
                        className='w-12 h-12 mx-auto mb-2 opacity-60'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                        />
                      </svg>
                      <p className='text-sm opacity-60'>Camera Preview</p>
                    </div>
                  </div>
                </div>

                {/* Camera Controls */}
                <div className='flex justify-center mt-4 space-x-3'>
                  <button className='p-3 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200'>
                    <svg
                      className='w-5 h-5 text-gray-600'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                      />
                    </svg>
                  </button>

                  <button className='p-3 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200'>
                    <svg
                      className='w-5 h-5 text-gray-600'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          <video
            className={styles.meetUserVideo}
            ref={localVideoref}
            autoPlay
            muted
            style={{ width: '50%', marginTop: '10px' }}
          />
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1 style={{ fontWeight: 'bold' }}>Chat</h1>
                <div style={{ height: '86%' }} className='chatting_space'>
                  <div
                    style={{
                      height: '100%',

                      overflowY: 'auto',
                      padding: '10px',
                      border: '1px solid #ccc',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '8px'
                    }}
                    className={styles.chattingDisplay}
                  >
                    {messages.length !== 0 ? (
                      messages.map((item, index) => {
                        console.log(messages)
                        return (
                          <div key={index}>
                            <div style={{ marginBottom: '20px', display: 'flex' }}>
                              <link
                                rel='stylesheet'
                                href='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined'
                              />
                              <span className='material-symbols-outlined'>
                                account_circle
                              </span>
                              <p style={{ fontWeight: 'bold' }}>
                                {item.sender}
                              </p>
                            </div>

                            <p>{item.data}</p>
                          </div>
                        )
                      })
                    ) : (
                      <p>No Messages Yet</p>
                    )}
                  </div>
                </div>

                <div className={styles.chattingArea}>
                  <TextField
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    id='outlined-basic'
                    label='Enter Your chat'
                    variant='outlined'
                  />
                  <Button variant='contained' onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: 'white' }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: 'red' }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: 'white' }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: 'white' }}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}

            <Badge badgeContent={newMessages} max={999} color='orange'>
              <IconButton
                onClick={() => setModal(!showModal)}
                style={{ color: 'white' }}
              >
                <ChatIcon />{' '}
              </IconButton>
            </Badge>
          </div>

          <div className={styles.conferenceView}>
            {videos.map(video => (
              <div key={video.socketId}>
                <h1>{video.socketId}</h1>

                <video
                  id={video.socketId}
                  autoPlay
                  // playsInline
                  style={{ width: '20%', marginTop: '10px' }}
                  ref={ref => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoMeeting
