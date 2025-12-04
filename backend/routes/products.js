const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// MULTER CONFIG - SUPPORT MULTIPLE FILES
// ============================================
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
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Max 5 files
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

// Middleware auth
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

// Helper function
const fixPhotoPath = (photoPath) => {
  if (!photoPath) return null;
  let fixedPath = photoPath.replace(/\\/g, '/');
  if (!fixedPath.startsWith('/uploads')) {
    if (fixedPath.startsWith('uploads')) {
      fixedPath = '/' + fixedPath;
    } else {
      const filename = path.basename(fixedPath);
      fixedPath = '/uploads/products/' + filename;
    }
  }
  return fixedPath;
};

// ============================================
// GET ALL PRODUCTS - WITH PHOTOS
// ============================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        k.nama_kategori,
        u.nama as nama_penjual,
        (SELECT url_foto 
         FROM foto_produk 
         WHERE id_produk = p.id_produk AND is_utama = 1 
         LIMIT 1) as foto_utama
      FROM produk p
      JOIN kategori k ON p.id_kategori = k.id_kategori
      JOIN pengguna u ON p.id_pengguna = u.id_pengguna
      WHERE p.status = 'tersedia'
      ORDER BY p.dibuat_pada DESC
    `);
    
    const productsWithFixedPaths = rows.map(product => ({
      ...product,
      url_foto: fixPhotoPath(product.foto_utama || product.url_foto)
    }));
    
    res.json(productsWithFixedPaths);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET PRODUCT BY ID - WITH ALL PHOTOS
// ============================================
router.get('/:id', async (req, res) => {
  try {
    console.log('📦 Getting product:', req.params.id);
    
    // Get product info
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
    
    // Get all photos for this product
    const [photos] = await db.query(`
      SELECT url_foto, urutan, is_utama
      FROM foto_produk
      WHERE id_produk = ?
      ORDER BY is_utama DESC, urutan ASC
    `, [req.params.id]);
    
    console.log('📸 Photos from DB:', photos);
    
    const product = {
      ...rows[0],
      url_foto: fixPhotoPath(rows[0].url_foto),
      foto_produk: photos.length > 0 
        ? photos.map(p => fixPhotoPath(p.url_foto)) 
        : [fixPhotoPath(rows[0].url_foto)] // Fallback ke url_foto jika tidak ada di foto_produk
    };
    
    console.log('✅ Returning product:', product);
    
    res.json(product);
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CREATE PRODUCT - WITH MULTIPLE PHOTOS
// ============================================
router.post('/', authenticateToken, upload.array('url_foto', 5), async (req, res) => {
  console.log('📦 POST /api/products - Create product with multiple photos');
  console.log('User:', req.user);
  console.log('Body:', req.body);
  console.log('Files:', req.files); // ← Sekarang pakai req.files (plural)
  
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

    if (isNaN(harga) || parseFloat(harga) <= 0) {
      return res.status(400).json({ error: 'Harga harus berupa angka lebih dari 0' });
    }

    // ✅ Validasi minimal 1 foto
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Minimal 1 foto produk harus diupload' });
    }

    console.log(`✅ Uploading ${req.files.length} photos`);

    // ✅ Foto pertama jadi foto utama
    const fotoUtama = `/uploads/products/${req.files[0].filename}`;

    // Insert produk ke tabel produk
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
      fotoUtama, // Foto utama di tabel produk
      kondisi || 'bekas',
      lokasi,
      parseInt(stok) || 1,
      bisa_nego === 'true' || bisa_nego === '1' || bisa_nego === true ? 1 : 0
    ]);

    const productId = result.insertId;

    // ✅ Insert SEMUA foto ke tabel foto_produk
    const fotoPromises = req.files.map((file, index) => {
      const fotoPath = `/uploads/products/${file.filename}`;
      const isUtama = index === 0 ? 1 : 0; // Foto pertama = utama
      
      console.log(`📸 Inserting photo ${index + 1}:`, fotoPath);
      
      return db.query(
        'INSERT INTO foto_produk (id_produk, url_foto, urutan, is_utama) VALUES (?, ?, ?, ?)',
        [productId, fotoPath, index + 1, isUtama]
      );
    });

    await Promise.all(fotoPromises);

    console.log(`✅ Product ${productId} created with ${req.files.length} photos`);

    res.status(201).json({
      message: 'Produk berhasil ditambahkan',
      id_produk: productId,
      jumlah_foto: req.files.length,
      foto_list: req.files.map(f => `/uploads/products/${f.filename}`),
      data: {
        id_produk: productId,
        nama_barang,
        harga,
        url_foto: fotoUtama
      }
    });

  } catch (error) {
    console.error('❌ Error creating product:', error);
    
    // Hapus semua file jika ada error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log('🗑️ Deleted file:', file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      });
    }
    
    res.status(500).json({ 
      error: 'Gagal menambahkan produk',
      message: error.message 
    });
  }
});

// ============================================
// UPDATE PRODUCT - WITH PHOTOS
// ============================================
router.put('/:id', authenticateToken, upload.array('url_foto', 5), async (req, res) => {
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
      bisa_nego,
      delete_photos // Array ID foto yang mau dihapus
    } = req.body;
    
    const id_pengguna = req.user.id;

    // Cek ownership
    const [checkProduct] = await db.query(
      'SELECT * FROM produk WHERE id_produk = ? AND id_pengguna = ?',
      [id, id_pengguna]
    );

    if (checkProduct.length === 0) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk mengubah produk ini' });
    }

    // Update data produk
    await db.query(`
      UPDATE produk 
      SET nama_barang = ?, deskripsi = ?, harga = ?, id_kategori = ?, 
          kondisi = ?, lokasi = ?, stok = ?, bisa_nego = ?
      WHERE id_produk = ? AND id_pengguna = ?
    `, [
      nama_barang,
      deskripsi,
      parseFloat(harga),
      id_kategori,
      kondisi,
      lokasi,
      parseInt(stok),
      bisa_nego === 'true' || bisa_nego === '1' || bisa_nego === true ? 1 : 0,
      id,
      id_pengguna
    ]);

    // Handle delete photos
    if (delete_photos) {
      const photosToDelete = JSON.parse(delete_photos);
      for (let photoId of photosToDelete) {
        const [photo] = await db.query('SELECT url_foto FROM foto_produk WHERE id_foto = ?', [photoId]);
        if (photo.length > 0 && photo[0].url_foto) {
          const filePath = `.${photo[0].url_foto}`;
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        await db.query('DELETE FROM foto_produk WHERE id_foto = ?', [photoId]);
      }
    }

    // Handle new photos
    if (req.files && req.files.length > 0) {
      const [currentPhotos] = await db.query(
        'SELECT COUNT(*) as count FROM foto_produk WHERE id_produk = ?',
        [id]
      );
      
      let startUrutan = currentPhotos[0].count;
      
      for (let i = 0; i < req.files.length; i++) {
        const fotoPath = `/uploads/products/${req.files[i].filename}`;
        await db.query(
          'INSERT INTO foto_produk (id_produk, url_foto, urutan, is_utama) VALUES (?, ?, ?, ?)',
          [id, fotoPath, startUrutan + i + 1, 0]
        );
      }
    }

    res.json({ 
      message: 'Produk berhasil diperbarui',
      data: { id_produk: id, nama_barang, harga }
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Gagal memperbarui produk' });
  }
});

// ============================================
// DELETE PRODUCT
// ============================================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const id_pengguna = req.user.id;

    const [checkProduct] = await db.query(
      'SELECT * FROM produk WHERE id_produk = ? AND id_pengguna = ?',
      [id, id_pengguna]
    );

    if (checkProduct.length === 0) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk menghapus produk ini' });
    }

    // Hapus semua foto
    const [photos] = await db.query(
      'SELECT url_foto FROM foto_produk WHERE id_produk = ?',
      [id]
    );

    for (let photo of photos) {
      if (photo.url_foto) {
        const filePath = `.${photo.url_foto}`;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Soft delete
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

// ============================================
// GET PRODUCTS BY SELLER
// ============================================
router.get('/seller/:userId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, 
             (SELECT url_foto FROM foto_produk WHERE id_produk = p.id_produk AND is_utama = 1 LIMIT 1) as foto_utama
      FROM produk p
      WHERE p.id_pengguna = ?
      ORDER BY p.dibuat_pada DESC
    `, [req.params.userId]);
    
    const productsWithFixedPaths = rows.map(product => ({
      ...product,
      url_foto: fixPhotoPath(product.foto_utama || product.url_foto)
    }));
    
    res.json(productsWithFixedPaths);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;