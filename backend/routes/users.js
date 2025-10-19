const express = require('express');
const router = express.Router();
const db = require('../config/database');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// Get user profile (public - bisa dilihat siapa saja)
router.get('/:id', async (req, res) => {
  try {
    // PASTIKAN SELECT ADA no_telp
    const [userRows] = await db.query(
      `SELECT 
        id_pengguna, 
        nama, 
        email, 
        nim, 
        no_telp,      
        alamat, 
        bio, 
        foto_profil, 
        peran 
      FROM pengguna 
      WHERE id_pengguna = ?`,
      [req.params.id]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    // Get statistik
    const [statsRows] = await db.query(
      `SELECT 
        COUNT(DISTINCT p.id_produk) as total_produk,
        COUNT(DISTINCT CASE WHEN p.status = 'terjual' THEN p.id_produk END) as produk_terjual
       FROM pengguna u
       LEFT JOIN produk p ON u.id_pengguna = p.id_pengguna
       WHERE u.id_pengguna = ?`,
      [req.params.id]
    );
    
    const user = userRows[0];
    const stats = statsRows[0] || { total_produk: 0, produk_terjual: 0 };
    
    // DEBUG: Log data
    console.log('User data:', user);
    console.log('no_telp:', user.no_telp);
    
    res.json({
      ...user,
      ...stats,
      rating: 5.0
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { nama, no_telp, alamat, bio } = req.body;
    
    await db.query(
      'UPDATE pengguna SET nama = ?, no_telp = ?, alamat = ?, bio = ? WHERE id_pengguna = ?',
      [nama, no_telp, alamat, bio, req.params.id]
    );
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update password
router.put('/:id/password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const bcrypt = require('bcrypt');
    
    // Get current password
    const [user] = await db.query(
      'SELECT kata_sandi FROM pengguna WHERE id_pengguna = ?',
      [req.params.id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    // Verify old password
    const validPassword = await bcrypt.compare(oldPassword, user[0].kata_sandi);
    if (!validPassword) {
      return res.status(401).json({ message: 'Password lama salah' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.query(
      'UPDATE pengguna SET kata_sandi = ? WHERE id_pengguna = ?',
      [hashedPassword, req.params.id]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 📸 UPLOAD FOTO PROFIL
// ============================================
router.post('/:id/upload-photo', upload.single('foto_profil'), async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diupload' });
    }

    console.log('📸 Uploading photo for user:', userId);
    console.log('📁 File info:', req.file);

    // Path foto yang diupload (relatif untuk disimpan di database)
    const fotoPath = `/uploads/profiles/${req.file.filename}`;

    // Ambil foto lama dari database
    const [rows] = await db.query(
      'SELECT foto_profil FROM pengguna WHERE id_pengguna = ?',
      [userId]
    );

    // Hapus foto lama jika bukan default
    if (rows.length > 0 && rows[0].foto_profil && rows[0].foto_profil !== 'default-avatar.jpg') {
      // Foto lama bisa berupa path relatif seperti /uploads/profiles/...
      // Kita perlu convert ke path absolut
      const oldPhotoRelativePath = rows[0].foto_profil.replace(/^\//, ''); // Hapus / di awal
      const oldPhotoPath = path.join(__dirname, '..', oldPhotoRelativePath);
      
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
        console.log('✅ Foto lama berhasil dihapus:', oldPhotoPath);
      }
    }

    // Update database dengan path foto baru
    await db.query(
      'UPDATE pengguna SET foto_profil = ? WHERE id_pengguna = ?',
      [fotoPath, userId]
    );

    console.log('✅ Foto profil berhasil diupload:', fotoPath);

    res.json({
      success: true,
      message: 'Foto profil berhasil diupload',
      foto_profil: fotoPath
    });

  } catch (error) {
    console.error('❌ Error uploading photo:', error);
    
    // Hapus file yang sudah diupload jika ada error
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ File dihapus karena error:', filePath);
      }
    }
    
    res.status(500).json({ error: 'Gagal mengupload foto profil' });
  }
});

// ============================================
// 🗑️ HAPUS FOTO PROFIL (Kembali ke default)
// ============================================
router.delete('/:id/photo', async (req, res) => {
  try {
    const userId = req.params.id;

    console.log('🗑️ Deleting photo for user:', userId);

    // Ambil foto dari database
    const [rows] = await db.query(
      'SELECT foto_profil FROM pengguna WHERE id_pengguna = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Hapus file foto jika bukan default
    if (rows[0].foto_profil && rows[0].foto_profil !== 'default-avatar.jpg') {
      const photoRelativePath = rows[0].foto_profil.replace(/^\//, '');
      const photoPath = path.join(__dirname, '..', photoRelativePath);
      
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
        console.log('✅ Foto berhasil dihapus:', photoPath);
      }
    }

    // Set kembali ke default
    await db.query(
      'UPDATE pengguna SET foto_profil = ? WHERE id_pengguna = ?',
      ['default-avatar.jpg', userId]
    );

    res.json({
      success: true,
      message: 'Foto profil berhasil dihapus',
      foto_profil: 'default-avatar.jpg'
    });

  } catch (error) {
    console.error('❌ Error deleting photo:', error);
    res.status(500).json({ error: 'Gagal menghapus foto profil' });
  }
});

module.exports = router;