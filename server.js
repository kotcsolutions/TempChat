const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Room storage (in-memory only)
const rooms = new Map();

// Charset for room codes (no ambiguous chars: 0/O, 1/I/L)
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateRoomCode() {
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }
  } while (rooms.has(code));
  return code;
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API: Create room
app.post('/api/room', (req, res) => {
  const code = generateRoomCode();
  rooms.set(code, { users: new Set(), created: Date.now() });
  res.json({ code });
});

// API: Check if room exists
app.get('/api/room/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  if (rooms.has(code)) {
    res.json({ exists: true, userCount: rooms.get(code).users.size });
  } else {
    res.status(404).json({ exists: false });
  }
});

// Socket.io handling
io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('join', (code) => {
    code = code.toUpperCase();

    // Create room if it doesn't exist (allows direct link joining)
    if (!rooms.has(code)) {
      rooms.set(code, { users: new Set(), created: Date.now() });
    }

    currentRoom = code;
    const room = rooms.get(code);
    room.users.add(socket.id);
    socket.join(code);

    // Notify room of new user
    io.to(code).emit('userCount', room.users.size);
    socket.to(code).emit('system', 'Someone joined the chat');
  });

  socket.on('message', (text) => {
    if (!currentRoom || !text || typeof text !== 'string') return;

    // Sanitize and limit message length
    const sanitized = text.trim().slice(0, 1000);
    if (!sanitized) return;

    // Relay message to room (including sender)
    io.to(currentRoom).emit('message', {
      id: socket.id.slice(-4),
      text: sanitized,
      time: Date.now()
    });
  });

  socket.on('disconnect', () => {
    if (!currentRoom) return;

    const room = rooms.get(currentRoom);
    if (!room) return;

    room.users.delete(socket.id);

    if (room.users.size === 0) {
      // Room is empty, delete it
      rooms.delete(currentRoom);
    } else {
      // Notify remaining users
      io.to(currentRoom).emit('userCount', room.users.size);
      io.to(currentRoom).emit('system', 'Someone left the chat');
    }
  });
});

server.listen(PORT, () => {
  console.log(`TempChat running on port ${PORT}`);
});
