import { ImageIcon, SendHorizonalIcon, VideoIcon } from 'lucide-react'
import { useThemeStore } from '../store/useThemeStore'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { getConversation, getMessages, sendMessage } from '../lib/api'
import useAuthUser from '../hooks/useAuthUser'

const SOCKET_URL =
  import.meta.env.MODE === 'production'
    ? 'https://backendecomeet.onrender.com'
    : 'http://localhost:9002'

const ChatPage = () => {
  const { theme } = useThemeStore()

  const { id } = useParams()

  const navigate = useNavigate()

  const messagesEndRef = useRef(null)

  const socketRef = useRef(null)

  const [message, setMessage] = useState('')

  // ONLY LIVE SOCKET MESSAGES
  const [liveMessages, setLiveMessages] = useState([])

  const { authUser } = useAuthUser()

  // ================= CONVERSATION =================

  const {
    data: conversation,
    isPending,
    isError
  } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => getConversation(id),
    enabled: !!id
  })

  // ================= DB MESSAGES =================

  const { data: dbMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => getMessages(id),
    enabled: !!id,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  })

  // ================= SEND MESSAGE =================

  const { mutate: sendMessageMutation, isPending: sendingMessage } =
    useMutation({
      mutationFn: sendMessage,

      onSuccess: () => {
        setMessage('')
      }
    })

  // ================= SOCKET =================

  useEffect(() => {
    if (!conversation?._id || !authUser?._id) return

    // CREATE SOCKET ONLY ONCE
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        withCredentials: true
      })
    }

    const socket = socketRef.current

    // CONNECT
    socket.off('connect')

    socket.on('connect', () => {
      console.log('✅ CONNECTED:', socket.id)

      socket.emit('join-room', conversation._id)

      console.log('🚪 JOINED ROOM:', conversation._id)
    })

    // IF ALREADY CONNECTED
    if (socket.connected) {
      socket.emit('join-room', conversation._id)
    }

    // RECEIVE MESSAGE
    const handleReceiveMessage = data => {
      console.log('📩 RECEIVED:', data)

      const senderId = data.senderId

      // IGNORE OWN MESSAGE
      if (senderId === authUser?._id) return

      setLiveMessages(prev => {
        // DUPLICATE PREVENTION
        const alreadyExists = prev.some(
          msg =>
            msg.text === data.text &&
            msg.senderId === data.senderId &&
            msg.createdAt === data.createdAt
        )

        if (alreadyExists) return prev

        return [
          ...prev,
          {
            _id: `live-${Date.now()}`,
            senderId: data.senderId,
            text: data.text,
            createdAt: data.createdAt,
            isLive: true
          }
        ]
      })
    }

    // REMOVE OLD LISTENER
    socket.off('receive-message', handleReceiveMessage)

    // NEW LISTENER
    socket.on('receive-message', handleReceiveMessage)

    // CLEANUP
    return () => {
      socket.off('receive-message', handleReceiveMessage)
    }
  }, [conversation?._id, authUser?._id])

  // ================= AUTO SCROLL =================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [dbMessages, liveMessages])

  // ================= SEND =================

  const handleSendMessage = () => {
    if (!message.trim()) return

    if (!socketRef.current?.connected) {
      console.log('❌ SOCKET NOT CONNECTED')
      return
    }

    const newMessage = {
      _id: `local-${Date.now()}`,
      senderId: authUser?._id,
      text: message,
      createdAt: new Date().toISOString(),
      isLive: true
    }

    // INSTANT LOCAL UI
    setLiveMessages(prev => [...prev, newMessage])

    console.log('📤 Sending message:', {
      roomId: conversation._id,
      id: authUser?._id,
      text: message
    })

    // SAVE TO DATABASE
    sendMessageMutation({
      conversationId: id,
      text: message
    })

    // SOCKET EMIT
    socketRef.current.emit('send-message', {
      roomId: conversation._id,
      id: authUser?._id,
      text: message
    })

    setMessage('')
  }

  // ================= VIDEO CALL =================

  const handleVideoIcon = () => {
    navigate(`/call/${id}/video`)
  }

  // ================= LOADING =================

  if (isPending) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        Loading...
      </div>
    )
  }

  // ================= ERROR =================

  if (isError || !conversation) {
    return <Navigate to='/' />
  }

  // ================= OTHER USER =================

  const otherMember = conversation.members?.find(
    member => member._id !== authUser?._id
  )

  // ================= MERGE MESSAGES =================

  const allMessages = useMemo(() => {
    const combined = [...dbMessages, ...liveMessages]

    // REMOVE DUPLICATES
    const uniqueMessages = combined.filter((msg, index, self) => {
      return (
        index ===
        self.findIndex(
          m =>
            m.text === msg.text &&
            (m.senderId?._id || m.senderId) ===
              (msg.senderId?._id || msg.senderId) &&
            m.createdAt === msg.createdAt
        )
      )
    })

    return uniqueMessages
  }, [dbMessages, liveMessages])

  return (
    <div
      data-theme={theme}
      className='min-h-screen bg-base-200 flex items-center justify-center p-4'
    >
      <div className='w-full max-w-6xl h-[95vh] bg-base-100 rounded-2xl shadow-2xl border border-base-300 flex flex-col overflow-hidden'>
        {/* ================= HEADER ================= */}

        <div className='navbar bg-base-100 border-b border-base-300 px-4'>
          <div className='flex-1 gap-3'>
            <div className='avatar online'>
              <div className='w-12 rounded-full'>
                <img
                  src={
                    otherMember?.profilePic ||
                    'https://randomuser.me/api/portraits/women/44.jpg'
                  }
                  alt='profile'
                />
              </div>
            </div>

            <div>
              <h2 className='font-bold text-lg'>
                {otherMember?.fullName || 'User'}
              </h2>

              <p className='text-sm opacity-70'>
                Room ID: {conversation._id}
              </p>
            </div>
          </div>

          <div className='flex-none'>
            <button
              onClick={handleVideoIcon}
              className='btn btn-success btn-circle'
            >
              <VideoIcon className='size-5 text-white' />
            </button>
          </div>
        </div>

        {/* ================= MESSAGES ================= */}

        <div className='flex-1 overflow-y-auto p-6 space-y-6 bg-base-100'>
          <div className='divider text-sm opacity-60'>Messages</div>

          {messagesLoading ? (
            <p>Loading Messages...</p>
          ) : allMessages.length === 0 ? (
            <p className='text-center opacity-70'>No messages yet</p>
          ) : (
            allMessages.map(msg => {
              const currentSenderId = msg.senderId?._id || msg.senderId

              const isSender = currentSenderId === authUser?._id

              return (
                <div
                  key={msg._id}
                  className={`chat ${isSender ? 'chat-end' : 'chat-start'}`}
                >
                  {/* AVATAR */}

                  <div className='chat-image avatar'>
                    <div className='w-10 rounded-full'>
                      <img
                        alt='user'
                        src={
                          isSender
                            ? authUser?.profilePic
                            : otherMember?.profilePic
                        }
                      />
                    </div>
                  </div>

                  {/* NAME */}

                  <div className='chat-header mb-1'>
                    {isSender ? 'You' : otherMember?.fullName}
                  </div>

                  {/* MESSAGE */}

                  <div
                    className={`chat-bubble ${
                      isSender ? 'chat-bubble-primary' : ''
                    }`}
                  >
                    {msg.text}

                    {msg.image && (
                      <img
                        src={msg.image}
                        alt='message'
                        className='mt-2 rounded-lg max-w-xs'
                      />
                    )}
                  </div>

                  {/* TIME */}

                  <div className='chat-footer opacity-50 text-xs mt-1'>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              )
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ================= INPUT ================= */}

        <div className='border-t border-base-300 bg-base-100 p-4'>
          <div className='flex items-center gap-3'>
            {/* IMAGE */}

            <button className='btn btn-circle btn-ghost'>
              <ImageIcon className='size-5' />
            </button>

            {/* INPUT */}

            <input
              type='text'
              placeholder='Type your message'
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSendMessage()
                }
              }}
              className='input input-bordered flex-1 rounded-full'
            />

            {/* SEND */}

            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendingMessage}
              className='btn btn-primary btn-circle'
            >
              <SendHorizonalIcon className='size-5' />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatPage