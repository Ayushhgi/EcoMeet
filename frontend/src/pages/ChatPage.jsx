import { ImageIcon, SendHorizonalIcon, VideoIcon } from 'lucide-react'

import { useThemeStore } from '../store/useThemeStore'

import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useEffect, useRef, useState } from 'react'

import { io } from 'socket.io-client'

import { getConversation, getMessages, sendMessage } from '../lib/api'

import useAuthUser from '../hooks/useAuthUser'

const socket = io('http://localhost:9002')

const ChatPage = () => {
  const { theme } = useThemeStore()

  const { id } = useParams()

  const navigate = useNavigate()

  const queryClient = useQueryClient()

  const messagesEndRef = useRef(null)

  const [message, setMessage] = useState('')

  const { authUser } = useAuthUser()

  // ================= CONVERSATION =================

  const {
    data: conversation,
    isPending,
    isError
  } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => getConversation(id)
  })
  //   useEffect(() => {
  //   console.log("Conversation Data:", conversation);
  // }, [conversation]);
  // ================= MESSAGES =================

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => getMessages(id),
    enabled: !!id
  })

  // ================= SEND MESSAGE =================

  const { mutate: sendMessageMutation } = useMutation({
    mutationFn: sendMessage,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['messages', id]
      })

      setMessage('')
    }
  })

  // ================= SOCKET =================

  useEffect(() => {
    if (!conversation?._id) return

    socket.emit('join-room', conversation._id)

    socket.on('receive-message', () => {
      queryClient.invalidateQueries({
        queryKey: ['messages', id]
      })
    })

    return () => {
      socket.emit('leave-room', conversation._id)

      socket.off('receive-message')
    }
  }, [conversation?._id, id, queryClient])

  // ================= AUTO SCROLL =================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages])

  // ================= SEND HANDLER =================

  const handleSendMessage = () => {
    if (!message.trim()) return

    const data = {
      conversationId: id,
      text: message
    }

    sendMessageMutation(data)

    socket.emit('send-message', {
      roomId: conversation._id,
      text: message
    })
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
    member => member._id !== authUser._id
  )

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
          ) : messages.length === 0 ? (
            <p className='text-center opacity-70'>No messages yet</p>
          ) : (
            messages.map(msg => {
              const isSender =
                msg.senderId === authUser._id ||
                msg.senderId?._id === authUser._id

              return (
                <div
                  key={msg._id}
                  className={`chat ${isSender ? 'chat-end' : 'chat-start'}`}
                >
                  {/* Avatar */}
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

                  {/* Name */}
                  <div className='chat-header mb-1'>
                    {isSender ? 'You' : otherMember?.fullName}
                  </div>

                  {/* Bubble */}
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

                  {/* Time */}
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
            {/* Upload */}
            <button className='btn btn-circle btn-ghost'>
              <ImageIcon className='size-5' />
            </button>

            {/* Input */}
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

            {/* Send */}
            <button
              onClick={handleSendMessage}
              disabled={!message.trim()}
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
