const path = require("path")
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const formatMessage = require("./utils/messages")
const {
  userJoin,
  getCurrentUser,
  userLeaves,
  getRoomUsers,
} = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketio(server)
// Set static folder
app.use(express.static(path.join(__dirname, "public")))

// Bot name variable
const botName = "ChatCord-bot"

// Run when client connects
io.on("connection", (socket) => {
  // Joinroom
  socket.on("joinRoom", ({ username, room }) => {
    // Create a user
    const user = userJoin(socket.id, username, room)
    socket.join(user.room)
    // To single client - Welcome current user
    socket.emit(
      "message",
      formatMessage(botName, `Welcome, ${username}, to ChatCord`)
    )

    // Broadcast when a user connects - everybody but user connecting
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the discussion`)
      )

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    })
  })
  // Listen for chat message
  socket.on("chatMessage", (msg) => {
    // Get current user
    const user = getCurrentUser(socket.id)
    console.log(socket.id, user)
    // Emit back to the client
    io.to(user.room).emit("message", formatMessage(user.username, msg))
  })
  // Runs when client disconnects
  socket.on("disconnect", () => {
    console.log("disconnect")
    // which user left
    const user = userLeaves(socket.id)
    console.log("server 57", user)
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the discussion`)
      )
      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      })
    }
  })
})

const PORT = 3000 || process.env.PORT

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
