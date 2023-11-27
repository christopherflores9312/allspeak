const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

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
