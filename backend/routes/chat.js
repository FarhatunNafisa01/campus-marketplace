const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ============================================
// GET ALL CONVERSATIONS FOR A USER
// ============================================
router.get('/conversations/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const [rows] = await db.query(`
      SELECT 
        p.*,
        prod.nama_barang,
        prod.url_foto as foto_produk,
        prod.harga,
        CASE 
          WHEN p.id_pembeli = ? THEN penjual.nama
          ELSE pembeli.nama
        END as nama_lawan,
        CASE 
          WHEN p.id_pembeli = ? THEN penjual.foto_profil
          ELSE pembeli.foto_profil
        END as foto_lawan,
        CASE 
          WHEN p.id_pembeli = ? THEN p.id_penjual
          ELSE p.id_pembeli
        END as id_lawan,
        (SELECT pesan 
         FROM pesan_percakapan 
         WHERE id_percakapan = p.id_percakapan 
         ORDER BY dikirim_pada DESC 
         LIMIT 1) as pesan_terakhir,
        (SELECT dikirim_pada 
         FROM pesan_percakapan 
         WHERE id_percakapan = p.id_percakapan 
         ORDER BY dikirim_pada DESC 
         LIMIT 1) as waktu_pesan_terakhir,
        (SELECT COUNT(*) 
         FROM pesan_percakapan 
         WHERE id_percakapan = p.id_percakapan 
         AND id_pengirim != ? 
         AND sudah_dibaca = FALSE) as unread_count
      FROM percakapan p
      JOIN pengguna pembeli ON p.id_pembeli = pembeli.id_pengguna
      JOIN pengguna penjual ON p.id_penjual = penjual.id_pengguna
      JOIN produk prod ON p.id_produk = prod.id_produk
      WHERE (p.id_pembeli = ? OR p.id_penjual = ?) 
      AND p.status = 'aktif'
      ORDER BY waktu_pesan_terakhir DESC
    `, [userId, userId, userId, userId, userId, userId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ 
      error: 'Gagal memuat percakapan',
      message: error.message 
    });
  }
});

// ============================================
// GET MESSAGES IN A CONVERSATION
// ============================================
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.*,
        u.nama as nama_pengirim,
        u.foto_profil
      FROM pesan_percakapan m
      JOIN pengguna u ON m.id_pengirim = u.id_pengguna
      WHERE m.id_percakapan = ?
      ORDER BY m.dikirim_pada ASC
    `, [req.params.conversationId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ 
      error: 'Gagal memuat pesan',
      message: error.message 
    });
  }
});

// ============================================
// CREATE OR GET CONVERSATION
// ============================================
router.post('/conversations', async (req, res) => {
  try {
    const { id_pembeli, id_penjual, id_produk } = req.body;
    
    // Validasi input
    if (!id_pembeli || !id_penjual || !id_produk) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap',
        message: 'id_pembeli, id_penjual, dan id_produk wajib diisi' 
      });
    }

    // Cek apakah user mencoba chat dengan dirinya sendiri
    if (id_pembeli === id_penjual) {
      return res.status(400).json({ 
        error: 'Tidak dapat membuat percakapan',
        message: 'Anda tidak dapat chat dengan diri sendiri' 
      });
    }

    // Cek apakah produk masih tersedia
    const [produk] = await db.query(
      'SELECT status, id_pengguna FROM produk WHERE id_produk = ?',
      [id_produk]
    );

    if (produk.length === 0) {
      return res.status(404).json({ 
        error: 'Produk tidak ditemukan' 
      });
    }

    if (produk[0].status !== 'tersedia') {
      return res.status(400).json({ 
        error: 'Produk tidak tersedia',
        message: 'Produk ini sudah terjual atau dihapus' 
      });
    }

    // Pastikan id_penjual sesuai dengan pemilik produk
    if (produk[0].id_pengguna !== id_penjual) {
      return res.status(400).json({ 
        error: 'Data tidak valid',
        message: 'ID penjual tidak sesuai dengan pemilik produk' 
      });
    }
    
    // Cek apakah conversation sudah ada
    const [existing] = await db.query(
      'SELECT * FROM percakapan WHERE id_pembeli = ? AND id_penjual = ? AND id_produk = ?',
      [id_pembeli, id_penjual, id_produk]
    );
    
    if (existing.length > 0) {
      // Jika conversation sudah ada, kembalikan conversation tersebut
      return res.json({
        ...existing[0],
        message: 'Conversation sudah ada'
      });
    }
    
    // Buat conversation baru
    const [result] = await db.query(
      'INSERT INTO percakapan (id_pembeli, id_penjual, id_produk, status) VALUES (?, ?, ?, ?)',
      [id_pembeli, id_penjual, id_produk, 'aktif']
    );
    
    res.status(201).json({ 
      id_percakapan: result.insertId,
      id_pembeli,
      id_penjual,
      id_produk,
      status: 'aktif',
      message: 'Conversation berhasil dibuat'
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ 
      error: 'Gagal membuat percakapan',
      message: error.message 
    });
  }
});

// ============================================
// SEND MESSAGE
// ============================================
router.post('/messages', async (req, res) => {
  try {
    const { id_percakapan, id_pengirim, pesan, jenis_pesan = 'teks', harga_tawaran = null } = req.body;
    
    // Validasi input
    if (!id_percakapan || !id_pengirim || !pesan) {
      return res.status(400).json({ 
        error: 'Data tidak lengkap',
        message: 'id_percakapan, id_pengirim, dan pesan wajib diisi' 
      });
    }

    // Validasi bahwa user adalah bagian dari conversation
    const [conversation] = await db.query(
      'SELECT * FROM percakapan WHERE id_percakapan = ? AND (id_pembeli = ? OR id_penjual = ?)',
      [id_percakapan, id_pengirim, id_pengirim]
    );

    if (conversation.length === 0) {
      return res.status(403).json({ 
        error: 'Akses ditolak',
        message: 'Anda tidak memiliki akses ke percakapan ini' 
      });
    }

    // Cek apakah conversation masih aktif
    if (conversation[0].status !== 'aktif') {
      return res.status(400).json({ 
        error: 'Conversation ditutup',
        message: 'Percakapan ini sudah ditutup' 
      });
    }
    
    // Insert pesan ke database
    const [result] = await db.query(
      'INSERT INTO pesan_percakapan (id_percakapan, id_pengirim, pesan, jenis_pesan, harga_tawaran) VALUES (?, ?, ?, ?, ?)',
      [id_percakapan, id_pengirim, pesan, jenis_pesan, harga_tawaran]
    );
    
    // Get data pengirim untuk response
    const [pengirim] = await db.query(
      'SELECT nama, foto_profil FROM pengguna WHERE id_pengguna = ?',
      [id_pengirim]
    );

    res.status(201).json({ 
      id_pesan: result.insertId,
      id_percakapan,
      id_pengirim,
      pesan,
      jenis_pesan,
      harga_tawaran,
      dikirim_pada: new Date(),
      sudah_dibaca: false,
      nama_pengirim: pengirim[0].nama,
      foto_profil: pengirim[0].foto_profil,
      message: 'Pesan berhasil dikirim'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Gagal mengirim pesan',
      message: error.message 
    });
  }
});

// ============================================
// MARK MESSAGES AS READ
// ============================================
router.put('/messages/read/:conversationId/:userId', async (req, res) => {
  try {
    const { conversationId, userId } = req.params;

    // Validasi bahwa user adalah bagian dari conversation
    const [conversation] = await db.query(
      'SELECT * FROM percakapan WHERE id_percakapan = ? AND (id_pembeli = ? OR id_penjual = ?)',
      [conversationId, userId, userId]
    );

    if (conversation.length === 0) {
      return res.status(403).json({ 
        error: 'Akses ditolak',
        message: 'Anda tidak memiliki akses ke percakapan ini' 
      });
    }
    
    // Tandai semua pesan dari lawan bicara sebagai sudah dibaca
    await db.query(
      'UPDATE pesan_percakapan SET sudah_dibaca = TRUE WHERE id_percakapan = ? AND id_pengirim != ? AND sudah_dibaca = FALSE',
      [conversationId, userId]
    );
    
    res.json({ 
      message: 'Pesan berhasil ditandai sebagai dibaca' 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ 
      error: 'Gagal menandai pesan',
      message: error.message 
    });
  }
});

// ============================================
// CLOSE CONVERSATION (OPTIONAL)
// ============================================
router.put('/conversations/:conversationId/close', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    // Validasi bahwa user adalah bagian dari conversation
    const [conversation] = await db.query(
      'SELECT * FROM percakapan WHERE id_percakapan = ? AND (id_pembeli = ? OR id_penjual = ?)',
      [conversationId, userId, userId]
    );

    if (conversation.length === 0) {
      return res.status(403).json({ 
        error: 'Akses ditolak',
        message: 'Anda tidak memiliki akses ke percakapan ini' 
      });
    }

    // Tutup conversation
    await db.query(
      'UPDATE percakapan SET status = ? WHERE id_percakapan = ?',
      ['ditutup', conversationId]
    );

    res.json({ 
      message: 'Percakapan berhasil ditutup' 
    });
  } catch (error) {
    console.error('Error closing conversation:', error);
    res.status(500).json({ 
      error: 'Gagal menutup percakapan',
      message: error.message 
    });
  }
});

module.exports = router;