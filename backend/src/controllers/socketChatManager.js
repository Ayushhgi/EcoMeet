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
    console.log('someone is connected', socket.id)

    socket.on('join-room', roomid => {
      socket.join(roomid)
    })

    socket.on('send-msg', (roomId, msg) => {
      socket.broadcast.to(roomId).emit('msg-read', msg)
    })
    socket.on('leave-room', id => {
      socket.disconnect(true)
    })
  })
}
