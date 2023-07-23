// app.js
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const redis = require('redis');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Serve 'socket.io.js' from 'node_modules' directory
app.use('/socket.io', express.static(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist')));

// Serve 'tailwind.css' from 'node_modules' directory
app.use('/tailwind', express.static(path.join(__dirname, 'node_modules', 'tailwindcss')));

// Connect to Redis
const redisClient = redis.createClient();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  // Listen for new messages
  socket.on('chatMessage', (data) => {
    const { username, message } = data;
    const timestamp = new Date().toISOString();

    // Store the message in Redis
    redisClient.lpush('chat_messages', JSON.stringify({ username, message, timestamp }), (err) => {
      if (err) {
        console.error('Error storing message in Redis:', err);
      }
    });

    // Broadcast the message to all connected clients
    io.emit('message', { username, message, timestamp });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3008;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
