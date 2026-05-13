import React from 'react'

const MessageComponent = () => {
  return (
    <div className='chat chat-start'>
      <div className='chat-image avatar'>
        <div className='w-10 rounded-full'>
          <img
            src='https://randomuser.me/api/portraits/women/44.jpg'
            alt='user'
          />
        </div>
      </div>

      <div className='chat-bubble bg-base-200 text-base-content'>
        Doing fine!
      </div>

      <div className='chat-footer text-xs opacity-60 mt-1'>
        Test Acc · 7:33 AM
      </div>
    </div>
  )
}

export default MessageComponent
