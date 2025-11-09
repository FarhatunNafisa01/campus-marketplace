const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup multer untuk upload foto
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/products';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPG, JPEG, PNG) yang diperbolehkan!'));
    }
  }
});

// Middleware untuk verifikasi token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      console.error('JWT Error:', err.message);
      return res.status(403).json({ error: 'Token tidak valid' });
    }
    req.user = user;
    next();
  });
};

// 🔥 TAMBAHAN: Helper function untuk fix path foto
const fixPhotoPath = (photoPath) => {
  if (!photoPath) return null;
  
  // Ganti backslash dengan forward slash
  let fixedPath = photoPath.replace(/\\/g, '/');
  
  // Pastikan dimulai dengan /uploads
  if (!fixedPath.startsWith('/uploads')) {
    if (fixedPath.startsWith('uploads')) {
      fixedPath = '/' + fixedPath;
    } else {
      // Jika hanya nama file, tambahkan prefix lengkap
      const filename = path.basename(fixedPath);
      fixedPath = '/uploads/products/' + filename;
    }
  }
  
  return fixedPath;
};

// ============================================
// GET ALL PRODUCTS - 🔥 DENGAN FIX PATH
// ============================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        k.nama_kategori,
        u.nama as nama_penjual
      FROM produk p
      JOIN kategori k ON p.id_kategori = k.id_kategori
      JOIN pengguna u ON p.id_pengguna = u.id_pengguna
      WHERE p.status = 'tersedia'
      ORDER BY p.dibuat_pada DESC
    `);
    
    // 🔥 FIX: Perbaiki path foto untuk semua produk
    const productsWithFixedPaths = rows.map(product => ({
      ...product,
      url_foto: fixPhotoPath(product.url_foto)
    }));
    
    res.json(productsWithFixedPaths);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

// CREATE NEW PRODUCT (POST) - Sudah benar, tidak perlu diubah
router.post('/', authenticateToken, upload.single('url_foto'), async (req, res) => {
  console.log('📦 POST /api/products - Create product');
  console.log('User:', req.user);
  console.log('Body:', req.body);
  console.log('File:', req.file);
  
  try {
    const { 
      nama_barang, 
      deskripsi, 
      harga, 
      id_kategori, 
      kondisi, 
      lokasi, 
      stok, 
      bisa_nego 
    } = req.body;
    
    const id_pengguna = req.user.id;

    // Validasi input
    if (!nama_barang || !deskripsi || !harga || !id_kategori || !lokasi) {
      return res.status(400).json({ 
        error: 'Field wajib: nama_barang, deskripsi, harga, id_kategori, lokasi' 
      });
    }

    // Validasi harga
    if (isNaN(harga) || parseFloat(harga) <= 0) {
      return res.status(400).json({ error: 'Harga harus berupa angka lebih dari 0' });
    }

    // Handle foto
    let url_foto = null;
    if (req.file) {
      url_foto = `/uploads/products/${req.file.filename}`;
      console.log('✅ Foto akan disimpan dengan path:', url_foto);
    }

    // Insert ke database
    const query = `
      INSERT INTO produk 
      (id_pengguna, id_kategori, nama_barang, deskripsi, harga, url_foto, kondisi, lokasi, stok, bisa_nego, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'tersedia')
    `;

    const [result] = await db.query(query, [
      id_pengguna,
      id_kategori,
      nama_barang,
      deskripsi,
      parseFloat(harga),
      url_foto,
      kondisi || 'bekas',
      lokasi,
      parseInt(stok) || 1,
      bisa_nego === 'true' || bisa_nego === '1' || bisa_nego === true ? 1 : 0
    ]);

    console.log('✅ Product created:', result.insertId);

    res.status(201).json({
      message: 'Produk berhasil ditambahkan',
      id_produk: result.insertId,
      data: {
        id_produk: result.insertId,
        nama_barang,
        harga,
        url_foto
      }
    });

  } catch (error) {
    console.error('❌ Error creating product:', error);
    
    // Hapus file jika ada error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      error: 'Gagal menambahkan produk',
      message: error.message 
    });
  }
});

// 🔥 GET PRODUCTS BY SELLER - DENGAN FIX PATH
router.get('/seller/:userId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM produk 
      WHERE id_pengguna = ?
      ORDER BY dibuat_pada DESC
    `, [req.params.userId]);
    
    // 🔥 FIX: Perbaiki path foto
    const productsWithFixedPaths = rows.map(product => ({
      ...product,
      url_foto: fixPhotoPath(product.url_foto)
    }));
    
    res.json(productsWithFixedPaths);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔥 GET PRODUCT BY ID - DENGAN FIX PATH
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        k.nama_kategori,
        u.nama as nama_penjual,
        u.no_telp,
        u.foto_profil
      FROM produk p
      JOIN kategori k ON p.id_kategori = k.id_kategori
      JOIN pengguna u ON p.id_pengguna = u.id_pengguna
      WHERE p.id_produk = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    
    // 🔥 FIX: Perbaiki path foto
    const product = {
      ...rows[0],
      url_foto: fixPhotoPath(rows[0].url_foto)
    };
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE PRODUCT - Tidak perlu diubah
router.put('/:id', authenticateToken, upload.single('url_foto'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nama_barang, 
      deskripsi, 
      harga, 
      id_kategori, 
      kondisi, 
      lokasi, 
      stok, 
      bisa_nego 
    } = req.body;
    
    const id_pengguna = req.user.id;

    // Cek apakah produk milik user ini
    const [checkProduct] = await db.query(
      'SELECT * FROM produk WHERE id_produk = ? AND id_pengguna = ?',
      [id, id_pengguna]
    );

    if (checkProduct.length === 0) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk mengubah produk ini' });
    }

    let url_foto = checkProduct[0].url_foto;
    
    // Jika ada foto baru, hapus foto lama dan gunakan foto baru
    if (req.file) {
      if (url_foto && fs.existsSync(`.${url_foto}`)) {
        fs.unlinkSync(`.${url_foto}`);
      }
      url_foto = `/uploads/products/${req.file.filename}`;
    }

    const query = `
      UPDATE produk 
      SET nama_barang = ?, deskripsi = ?, harga = ?, id_kategori = ?, 
          kondisi = ?, lokasi = ?, stok = ?, bisa_nego = ?, url_foto = ?
      WHERE id_produk = ? AND id_pengguna = ?
    `;

    await db.query(query, [
      nama_barang,
      deskripsi,
      parseFloat(harga),
      id_kategori,
      kondisi,
      lokasi,
      parseInt(stok),
      bisa_nego === 'true' || bisa_nego === '1' || bisa_nego === true ? 1 : 0,
      url_foto,
      id,
      id_pengguna
    ]);

    res.json({ 
      message: 'Produk berhasil diperbarui',
      data: { id_produk: id, nama_barang, harga, url_foto }
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Gagal memperbarui produk' });
  }
});

// DELETE PRODUCT - Tidak perlu diubah
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const id_pengguna = req.user.id;

    // Cek apakah produk milik user ini
    const [checkProduct] = await db.query(
      'SELECT * FROM produk WHERE id_produk = ? AND id_pengguna = ?',
      [id, id_pengguna]
    );

    if (checkProduct.length === 0) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk menghapus produk ini' });
    }

    // Hapus foto jika ada
    if (checkProduct[0].url_foto && fs.existsSync(`.${checkProduct[0].url_foto}`)) {
      fs.unlinkSync(`.${checkProduct[0].url_foto}`);
    }

    // Soft delete - ubah status jadi 'dihapus'
    await db.query(
      'UPDATE produk SET status = ? WHERE id_produk = ?',
      ['dihapus', id]
    );

    res.json({ message: 'Produk berhasil dihapus' });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Gagal menghapus produk' });
  }
});

module.exports = router;