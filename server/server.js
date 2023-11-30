const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const cors = require('cors');

app.use(cors()); // Enable CORS for all routes

const io = socketIo(server, {
  cors: {
    origin: "*", // This will allow all origins. You may want to restrict this in production.
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle WebRTC signaling data
  socket.on('webrtc_signal', (data) => {
    // Broadcast or relay this signal to the relevant peer
    socket.broadcast.emit('webrtc_signal', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
