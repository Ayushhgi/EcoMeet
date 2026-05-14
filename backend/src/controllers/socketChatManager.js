import { Server } from 'socket.io'

export const connectToSocket = server => {
  const io = new Server(server, {
    cors: {
      origin: 'https://ecomeet-ed87.onrender.com',
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  io.on('connection', socket => {
    console.log('✅ Someone connected:', socket.id)

    socket.on('join-room', roomId => {
      socket.join(roomId)

      console.log(`🚪 Socket ${socket.id} joined room ${roomId}`)

      console.log(
        `👥 Room ${roomId} members:`,
        io.sockets.adapter.rooms.get(roomId)
      )
    })

    socket.on('send-message', ({ roomId, id, text }) => {
      console.log(`📨 Message from ${id} in room ${roomId}:`, text)

      console.log(
        `👥 Room ${roomId} members:`,
        io.sockets.adapter.rooms.get(roomId)
      )

      io.to(roomId).emit('receive-message', {
        senderId: id,
        text,
        createdAt: new Date().toISOString()
      })
    })

    socket.on('leave-room', roomId => {
      socket.leave(roomId)

      console.log(`🚶 Socket ${socket.id} left room ${roomId}`)
    })

    socket.on('disconnect', () => {
      console.log('❌ Someone disconnected:', socket.id)
    })
  })

  return io
}