import { Server } from 'socket.io'

let connections = {}
let timeOnline = {}
let messages = {}

export const connectToSocket = server => {
  const io = new Server(server, {
    cors: {
      origin: '*', // All client domain
      methods: ['GET', 'POST'],
      allowedHeaders: ['*'],
      credentials: true
    }
  })

  io.on('connection', socket => {
    console.log('someone is connected')
    // console.log(window.location.href);
    // console.log(window.location.href);
    socket.on('join-call', path => {
      // If the room doesn't exist, create it

      if (!connections[path]) {
        connections[path] = []
      }
      connections[path].push(socket.id)

      timeOnline[socket.id] = new Date() // Use socket.id here

      // Broadcast 'user-joined' to all users in the room
      for (let a = 0; a < connections[path].length; a++) {
        io.to(connections[path][a]).emit(
          'user-joined',
          socket.id,
          connections[path]
        )
      }
      // io.to(connections[path]).emit('user-joined', socket.id,connections[path])

      // Send old messages to the newly joined user
      if (messages[path] != undefined) {
        for (let a = 0; a < messages[path].length; a++) {
          io.to(socket.id).emit(
            'chat-message',
            messages[path][a]['data'],
            messages[path][a]['sender'],
            messages[path][a]['socket-id-sender']
          )
        }
      }
    })

    socket.on('signal', (toId, message) => {       // Server acts as a postman for WebRTC negotiation
      io.to(toId).emit('signal', socket.id, message)
    })

    socket.on('chat-message', (data, sender) => {
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true]
          }
          return [room, isFound]
        },
        ['', false]
      )

      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = []
        }
        messages[matchingRoom].push({
          sender: sender,
          data: data,
          'socket-id-sender': socket.id
        })

        console.log('message', matchingRoom, ':', sender, data)

        connections[matchingRoom].forEach(element => {
          io.to(element).emit('chat-message', data, sender, socket.id)
        })
      }
    })

    socket.on('disconnect', () => {
      var diffTime = Math.abs(timeOnline[socket.id] - new Date())
      var key
      for (const [k, v] of JSON.parse(
        JSON.stringify(Object.entries(connections))
      )) {
        for (let a = 0; a < v.length; a++) {
          if (v[a] === socket.id) {
            key = k

            // Notify users in the room that a user left
            for (let a = 0; a < connections[key].length; a++) {
              io.to(connections[key][a]).emit('user-left', socket.id)
            }

            // Remove the user from the room
            var index = connections[key].indexOf(socket.id)
            connections[key].splice(index, 1)

            // Delete the room if no users are left
            if (connections[key].length === 0) {
              delete connections[key]
            }
          }
        }
      }
    })
  })

  return io
}
