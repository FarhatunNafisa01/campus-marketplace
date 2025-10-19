const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get transactions by buyer
router.get('/buyer/:userId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.*,
        p.nama_barang,
        p.url_foto,
        u.nama as nama_penjual,
        u.no_telp as no_telp_penjual
      FROM transaksi t
      JOIN produk p ON t.id_produk = p.id_produk
      JOIN pengguna u ON t.id_penjual = u.id_pengguna
      WHERE t.id_pembeli = ?
      ORDER BY t.dibuat_pada DESC
    `, [req.params.userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;