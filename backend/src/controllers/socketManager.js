import { Server } from 'socket.io'

// ⚠️ These are module-level — reset on server restart
let connections = {}
let timeOnline = {}
let messages = {}

export const connectToVideoMeetSocket = io => {
  io.of('/video').on('connection', socket => {
    console.log('✅ Someone connected to /video:', socket.id)

    // ── join-call ────────────────────────────────────────────────────────────
    socket.on('join-call', path => {
      console.log(`🚪 join-call received from: ${socket.id}, room: ${path}`)

      // Create room if it doesn't exist
      if (!connections[path]) {
        connections[path] = []
      }

      // ✅ Fix duplicate participants — don't add if already in room
      if (connections[path].includes(socket.id)) {
        console.log(`⏭️ Socket ${socket.id} already in room ${path}, skipping`)
        return
      }

      connections[path].push(socket.id)
      timeOnline[socket.id] = new Date()

      console.log(`👥 Room ${path} now has ${connections[path].length} participant(s):`, connections[path])

      // Broadcast user-joined to ALL users in the room (including the new one)
      // Each client receives: who joined + full list of clients
      for (let a = 0; a < connections[path].length; a++) {
        io.of('/video').to(connections[path][a]).emit(
          'user-joined',
          socket.id,           // who just joined
          connections[path]    // full client list
        )
        console.log(`📢 Sent user-joined to: ${connections[path][a]}`)
      }

      // Send old chat messages to the newly joined user
      if (messages[path] !== undefined) {
        console.log(`💬 Sending ${messages[path].length} old messages to: ${socket.id}`)
        for (let a = 0; a < messages[path].length; a++) {
          io.of('/video').to(socket.id).emit(
            'chat-message',
            messages[path][a]['data'],
            messages[path][a]['sender'],
            messages[path][a]['socket-id-sender']
          )
        }
      }
    })

    // ── signal (WebRTC negotiation relay) ────────────────────────────────────
    socket.on('signal', (toId, message) => {
      const signal = JSON.parse(message)
      console.log(`📡 Relaying signal (${signal.sdp?.type || 'ice'}) from: ${socket.id} to: ${toId}`)
      io.of('/video').to(toId).emit('signal', socket.id, message)
    })

    // ── chat-message ─────────────────────────────────────────────────────────
    socket.on('chat-message', (data, sender) => {
      // Find which room this socket belongs to
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true]
          }
          return [room, isFound]
        },
        ['', false]
      )

      if (found) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = []
        }
        messages[matchingRoom].push({
          sender: sender,
          data: data,
          'socket-id-sender': socket.id
        })

        console.log(`💬 Chat message in room ${matchingRoom} from ${sender}:`, data)

        connections[matchingRoom].forEach(element => {
          io.of('/video').to(element).emit('chat-message', data, sender, socket.id)
        })
      }
    })

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`)

      const onlineTime = timeOnline[socket.id]
        ? Math.abs(timeOnline[socket.id] - new Date())
        : 0
      console.log(`⏱️ Was online for: ${Math.floor(onlineTime / 1000)}s`)

      delete timeOnline[socket.id]

      // Find and remove from whichever room this socket was in
      for (const [roomPath, roomClients] of Object.entries(connections)) {
        const index = roomClients.indexOf(socket.id)

        if (index === -1) continue  // not in this room

        console.log(`🚶 Removing ${socket.id} from room: ${roomPath}`)

        // Notify everyone else in the room
        roomClients.forEach(clientId => {
          if (clientId !== socket.id) {
            io.of('/video').to(clientId).emit('user-left', socket.id)
            console.log(`📢 Sent user-left to: ${clientId}`)
          }
        })

        // Remove the disconnected socket
        connections[roomPath].splice(index, 1)
        console.log(`👥 Room ${roomPath} now has ${connections[roomPath].length} participant(s)`)

        // Clean up empty room
        if (connections[roomPath].length === 0) {
          console.log(`🗑️ Room ${roomPath} is empty, deleting`)
          delete connections[roomPath]
          delete messages[roomPath]
        }

        break  // ✅ A socket can only be in one room, stop looking
      }
    })
  })

  return io
}