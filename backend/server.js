const express = require('express');
const cors = require('cors');
const path = require('path');  // ← TAMBAH INI
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ TAMBAH INI: Serve static files untuk uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('📁 Serving uploads from:', path.join(__dirname, 'uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/transactions', require('./routes/transactions'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Campus Marketplace API Running' });
});

// ✅ TAMBAH INI: Error handling untuk multer
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // Handle Multer errors
  if (err.message === 'Hanya file JPG, JPEG, dan PNG yang diperbolehkan!') {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Ukuran file maksimal 5MB!' });
  }
  
  res.status(500).json({ error: 'Terjadi kesalahan server' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
});