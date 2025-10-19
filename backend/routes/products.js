const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all products
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
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID
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
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Get products by seller
router.get('/seller/:userId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM produk 
      WHERE id_pengguna = ?
      ORDER BY dibuat_pada DESC
    `, [req.params.userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;