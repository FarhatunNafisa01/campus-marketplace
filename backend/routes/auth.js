// @ts-nocheck
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { sendResetPasswordEmail } = require('../config/email');

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

// ============================================
// 📧 FORGOT PASSWORD - Kirim Email Reset
// ============================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔍 Forgot password request for:', email);

    // Validasi input
    if (!email) {
      return res.status(400).json({ message: 'Email harus diisi' });
    }

    // ✅ TAMBAH INI: Validasi email harus @student.pnl.ac.id
    if (!email.endsWith('@student.pnl.ac.id')) {
      return res.status(400).json({
        message: 'Hanya email mahasiswa (@student.pnl.ac.id) yang dapat menggunakan fitur ini'
      });
    }
    
    // Cek apakah user exist
    const [users] = await db.query(
      'SELECT id_pengguna, nama, email FROM pengguna WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Jangan kasih tau kalau email tidak terdaftar (security)
      return res.json({
        message: 'Jika email terdaftar, link reset password akan dikirim'
      });
    }

    const user = users[0];

    // Generate reset token (random 32 bytes)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token untuk disimpan di database (security)
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Token berlaku 1 jam
    const resetExpires = new Date(Date.now() + 3600000);

    // Simpan token ke database
    await db.query(
      'UPDATE pengguna SET reset_token = ?, reset_expires = ? WHERE id_pengguna = ?',
      [hashedToken, resetExpires, user.id_pengguna]
    );

    console.log('✅ Token generated for user:', user.id_pengguna);

    // Kirim email
    try {
      await sendResetPasswordEmail(email, resetToken);
      console.log('✅ Reset email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
      // Hapus token jika gagal kirim email
      await db.query(
        'UPDATE pengguna SET reset_token = NULL, reset_expires = NULL WHERE id_pengguna = ?',
        [user.id_pengguna]
      );
      return res.status(500).json({
        message: 'Gagal mengirim email. Pastikan email valid.'
      });
    }

    res.json({
      message: 'Link reset password telah dikirim ke email Anda',
      success: true
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// ============================================
// 🔐 RESET PASSWORD - Set Password Baru
// ============================================
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    console.log('🔐 Reset password request with token');

    // Validasi input
    if (!token || !password) {
      return res.status(400).json({ message: 'Token dan password harus diisi' });
    }

    // Validasi password
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    // Hash token yang diterima untuk dicocokkan dengan database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Cari user dengan token yang valid dan belum expired
    const [users] = await db.query(
      'SELECT id_pengguna, nama, email FROM pengguna WHERE reset_token = ? AND reset_expires > NOW()',
      [hashedToken]
    );

    if (users.length === 0) {
      return res.status(400).json({
        message: 'Token tidak valid atau sudah kadaluarsa'
      });
    }

    const user = users[0];
    console.log('✅ Valid token for user:', user.id_pengguna);

    // Hash password baru
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password dan hapus token
    await db.query(
      `UPDATE pengguna 
       SET kata_sandi = ?, 
           reset_token = NULL, 
           reset_expires = NULL 
       WHERE id_pengguna = ?`,
      [hashedPassword, user.id_pengguna]
    );

    console.log('✅ Password reset successful for user:', user.id_pengguna);

    res.json({
      message: 'Password berhasil direset. Silakan login dengan password baru.',
      success: true
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// ============================================
// 🔍 VALIDATE TOKEN - Cek apakah token valid
// ============================================
router.get('/validate-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const [users] = await db.query(
      'SELECT id_pengguna FROM pengguna WHERE reset_token = ? AND reset_expires > NOW()',
      [hashedToken]
    );

    if (users.length === 0) {
      return res.status(400).json({
        valid: false,
        message: 'Token tidak valid atau sudah kadaluarsa'
      });
    }

    res.json({
      valid: true,
      message: 'Token valid'
    });

  } catch (error) {
    console.error('❌ Validate token error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});



module.exports = router;