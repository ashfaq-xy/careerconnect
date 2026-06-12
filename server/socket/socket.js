// server/socket/socket.js
// PRD v2 §6 — Socket.IO real-time communication
// §6.2 — each user joins private room by userId
// §6.3 — server emits new_notification, online-count
// §6.4 — client sends join-room only (typing removed from PRD v2)

const jwt  = require('jsonwebtoken');
const User = require('../models/User.model');

const onlineUsers = new Map(); // userId → socketId

const initSocket = (io) => {
  // ── JWT authentication middleware ──────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user    = await User.findById(decoded.id).select('_id firstName role');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      // PRD v2 T-25 — invalid token → connection refused immediately
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    // PRD v2 §6.2 — join private room identified by userId
    socket.join(userId);

    console.log(`🔌 ${socket.user.firstName} connected (${userId})`);

    // Broadcast updated online count — PRD v2 §6.3
    io.emit('online-count', onlineUsers.size);

    // PRD v2 §6.4 — join-room event (e.g. job-specific room for recruiters)
    socket.on('join-room', ({ roomId }) => {
      if (roomId) socket.join(roomId);
    });

    // Note: 'typing' event removed — not in PRD v2 §6.4

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('online-count', onlineUsers.size);
      console.log(`🔌 ${socket.user.firstName} disconnected`);
    });
  });
};

initSocket.getOnlineUsers = () => onlineUsers;

module.exports = initSocket;
