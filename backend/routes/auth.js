// @ts-nocheck
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validateRegister, validateLogin } = require('../middleware/validation');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id_pengguna, 
      email: user.email,
      peran: user.peran 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { nama, email, password, nim, no_telp } = req.body;
    
    // Validasi format email
    const emailRegex = /^[a-z_]+\d{3}@student\.pnl\.ac\.id$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Format email tidak valid. Contoh: farhatun_nafisa016@student.pnl.ac.id' 
      });
    }
    
    // Cek apakah 3 digit terakhir email cocok dengan NIM
    const last3DigitsNIM = nim.slice(-3);
    const emailMatch = email.match(/(\d{3})@student\.pnl\.ac\.id$/);
    
    if (emailMatch && emailMatch[1] !== last3DigitsNIM) {
      return res.status(400).json({ 
        message: `3 digit terakhir email (${emailMatch[1]}) harus sama dengan 3 digit terakhir NIM (${last3DigitsNIM})` 
      });
    }
    
    // Cek apakah email sudah terdaftar
    const [existingEmail] = await db.query(
      'SELECT id_pengguna FROM pengguna WHERE email = ?',
      [email]
    );
    
    if (existingEmail.length > 0) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }
    
    // Cek apakah NIM sudah terdaftar
    const [existingNim] = await db.query(
      'SELECT id_pengguna FROM pengguna WHERE nim = ?',
      [nim]
    );
    
    if (existingNim.length > 0) {
      return res.status(409).json({ message: 'NIM sudah terdaftar' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user baru
    const [result] = await db.query(
      'INSERT INTO pengguna (nama, email, kata_sandi, nim, no_telp) VALUES (?, ?, ?, ?, ?)',
      [nama, email, hashedPassword, nim, no_telp]
    );
    
    // Generate token untuk user baru
    const token = generateToken({
      id_pengguna: result.insertId,
      email: email,
      peran: 'mahasiswa'
    });
    
    res.status(201).json({ 
      message: 'Registrasi berhasil',
      token,
      user: {
        id: result.insertId,
        nama,
        email,
        nim,
        no_telp, 
        peran: 'mahasiswa'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [rows] = await db.query(
      'SELECT * FROM pengguna WHERE email = ?',
      [email]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }
    
    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.kata_sandi);
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }
    
    const token = generateToken(user);
    
    res.json({ 
      message: 'Login berhasil',
      token,
      user: {
        id: user.id_pengguna,
        nama: user.nama,
        email: user.email,
        nim: user.nim,
        peran: user.peran,
        foto_profil: user.foto_profil
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Verify Token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return res.status(403).json({ message: 'Token tidak ditemukan' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [rows] = await db.query(
      'SELECT id_pengguna, nama, email, nim, peran, foto_profil FROM pengguna WHERE id_pengguna = ?',
      [decoded.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    res.json({ 
      valid: true,
      user: {
        id: rows[0].id_pengguna,
        nama: rows[0].nama,
        email: rows[0].email,
        nim: rows[0].nim,
        peran: rows[0].peran,
        foto_profil: rows[0].foto_profil
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token tidak valid' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Verify token error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;