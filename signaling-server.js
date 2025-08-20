const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active rooms and their participants
const rooms = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join a room
  socket.on('join-room', ({ roomId }) => {
    console.log(`👥 User ${socket.id} joining room: ${roomId}`);
    
    // Leave any previous room
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Join the new room
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    const roomParticipants = rooms.get(roomId);
    roomParticipants.add(socket.id);
    
    // Notify others in the room
    socket.to(roomId).emit('user-joined', { 
      userId: socket.id,
      participantCount: roomParticipants.size 
    });
    
    // Send current room info to the new user
    socket.emit('room-joined', { 
      roomId, 
      participantCount: roomParticipants.size,
      isInitiator: roomParticipants.size === 1
    });
    
    console.log(`📊 Room ${roomId} now has ${roomParticipants.size} participants`);
  });

  // Handle WebRTC signaling messages
  socket.on('webrtc-offer', ({ roomId, offer, targetId }) => {
    console.log(`📤 Forwarding offer from ${socket.id} to ${targetId} in room ${roomId}`);
    socket.to(targetId).emit('webrtc-offer', { 
      offer, 
      fromId: socket.id 
    });
  });

  socket.on('webrtc-answer', ({ roomId, answer, targetId }) => {
    console.log(`📤 Forwarding answer from ${socket.id} to ${targetId} in room ${roomId}`);
    socket.to(targetId).emit('webrtc-answer', { 
      answer, 
      fromId: socket.id 
    });
  });

  socket.on('webrtc-ice-candidate', ({ roomId, candidate, targetId }) => {
    console.log(`🧊 Forwarding ICE candidate from ${socket.id} to ${targetId}`);
    socket.to(targetId).emit('webrtc-ice-candidate', { 
      candidate, 
      fromId: socket.id 
    });
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    
    // Remove user from all rooms
    rooms.forEach((participants, roomId) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        
        // Notify others in the room
        socket.to(roomId).emit('user-left', { 
          userId: socket.id,
          participantCount: participants.size 
        });
        
        // Clean up empty rooms
        if (participants.size === 0) {
          rooms.delete(roomId);
          console.log(`🗑️ Room ${roomId} deleted (empty)`);
        } else {
          console.log(`📊 Room ${roomId} now has ${participants.size} participants`);
        }
      }
    });
  });

  // Handle leave room
  socket.on('leave-room', ({ roomId }) => {
    console.log(`👋 User ${socket.id} leaving room: ${roomId}`);
    
    socket.leave(roomId);
    
    if (rooms.has(roomId)) {
      const participants = rooms.get(roomId);
      participants.delete(socket.id);
      
      // Notify others
      socket.to(roomId).emit('user-left', { 
        userId: socket.id,
        participantCount: participants.size 
      });
      
      // Clean up empty rooms
      if (participants.size === 0) {
        rooms.delete(roomId);
        console.log(`🗑️ Room ${roomId} deleted (empty)`);
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'WebRTC Signaling Server is running',
    activeRooms: rooms.size,
    totalParticipants: Array.from(rooms.values()).reduce((total, participants) => total + participants.size, 0)
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WebRTC Signaling Server',
    endpoints: {
      '/health': 'GET - Health check',
      'socket.io': 'WebSocket - Real-time signaling'
    },
    activeRooms: rooms.size
  });
});

const PORT = 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WebRTC Signaling Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.IO endpoint: ws://localhost:${PORT}/socket.io/`);
});
