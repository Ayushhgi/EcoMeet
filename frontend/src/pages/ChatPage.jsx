import { ImageIcon, SendHorizonalIcon, VideoIcon } from 'lucide-react'
import { useThemeStore } from '../store/useThemeStore'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { getConversation, getMessages, sendMessage } from '../lib/api'
import useAuthUser from '../hooks/useAuthUser'
// import server from '../../environment'

const ChatPage = () => {
  const { theme } = useThemeStore()
  const { id } = useParams()
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)

  const [message, setMessage] = useState('')
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

  // ================= MESSAGES (DB — only on mount/reload) =================
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

  // ================= SOCKET + ROOM JOIN =================
  useEffect(() => {
    if (!conversation?._id) return

    if (!socketRef.current) {
      socketRef.current = io('https://backendecomeet.onrender.com', {
        withCredentials: true
      })
    }

    const socket = socketRef.current

    // SOCKET CONNECTED
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id)
    })

    // JOIN ROOM
    socket.emit('join-room', conversation._id)

    console.log('🚪 Joining room:', conversation._id)

    // RECEIVE MESSAGE
    const handleReceiveMessage = data => {
      // IGNORE OWN MESSAGE
      if (data.senderId === authUser?._id) return

      console.log('📩 Received message:', data)

      let parsedText = data.text

      // PARSE VIDEO INVITE MESSAGE
      try {
        parsedText = JSON.parse(data.text)
      } catch (error) {}

      setLiveMessages(prev => [
        ...prev,
        {
          _id: `live-${Date.now()}`,
          senderId: data.senderId,
          text: parsedText,
          createdAt: data.createdAt,
          isLive: true
        }
      ])
    }

    // REMOVE OLD LISTENER
    socket.off('receive-message', handleReceiveMessage)

    // NEW LISTENER
    socket.on('receive-message', handleReceiveMessage)

    return () => {
      socket.emit('leave-room', conversation._id)

      socket.off('receive-message', handleReceiveMessage)
    }
  }, [conversation?._id, authUser?._id])

  // ================= AUTO SCROLL =================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [dbMessages, liveMessages])

  // ================= SEND HANDLER =================
  const handleSendMessage = () => {
    if (!message.trim()) return

    // 👇 4. Check what sender is emitting
    console.log('📤 Sending message:', {
      roomId: conversation._id,
      id: authUser?._id,
      text: message
    })

    setLiveMessages(prev => [
      ...prev,
      {
        _id: `live-${Date.now()}`,
        senderId: authUser?._id,
        text: message,
        createdAt: new Date().toISOString(),
        isLive: true
      }
    ])

    sendMessageMutation({ conversationId: id, text: message })

    socketRef.current?.emit('send-message', {
      roomId: conversation._id,
      id: authUser?._id,
      text: message
    })
  }

  // ================= VIDEO CALL =================
  const handleVideoIcon = () => navigate(`/call/${id}/video`)

  // ================= LOADING =================
  if (isPending) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        Loading...
      </div>
    )
  }

  if (isError || !conversation) return <Navigate to='/' />

  const otherMember = conversation.members?.find(
    member => member._id !== authUser?._id
  )

  const allMessages = [...dbMessages, ...liveMessages]

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
              <p className='text-sm opacity-70'>Room ID: {conversation._id}</p>
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
              const isSender =
                msg.senderId === authUser?._id ||
                msg.senderId?._id === authUser?._id

              return (
                <div
                  key={msg._id}
                  className={`chat ${isSender ? 'chat-end' : 'chat-start'}`}
                >
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

                  <div className='chat-header mb-1'>
                    {isSender ? 'You' : otherMember?.fullName}
                  </div>

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
            <button className='btn btn-circle btn-ghost'>
              <ImageIcon className='size-5' />
            </button>

            <input
              type='text'
              placeholder='Type your message'
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSendMessage()
              }}
              className='input input-bordered flex-1 rounded-full'
            />

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
