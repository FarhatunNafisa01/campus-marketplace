// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const setupSocketHandlers = require('./socket/socketHandler');

const app = express();
const httpServer = createServer(app);

// ============================================
// SOCKET.IO SETUP
// ============================================
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Setup socket handlers
setupSocketHandlers(io);

// Make io accessible to routes
app.set('io', io);

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files untuk uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// ROUTES
// ============================================
// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Campus Marketplace API Running',
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount 
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/users', require('./routes/users'));
app.use('/api/transactions', require('./routes/transactions'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    socketConnections: io.engine.clientsCount 
  });
});

// ============================================
// ERROR HANDLING
// ============================================
// 404 handler (sebelum error handler)
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'Endpoint tidak ditemukan',
    path: req.originalUrl
  });
});

// Error handling middleware (harus di akhir)
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error('Stack:', err.stack);
  
  // Handle Multer errors
  if (err.message && err.message.includes('Hanya file')) {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Ukuran file maksimal 5MB!' });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token tidak valid' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token sudah kadaluarsa' });
  }
  
  // Default error
  res.status(err.status || 500).json({ 
    error: err.message || 'Terjadi kesalahan server',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log('\n🚀 ===================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.io ready for connections`);
  console.log(`📁 Uploads: ${path.join(__dirname, 'uploads')}`);
  console.log(`📡 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('===================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received, closing server...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, httpServer, io };