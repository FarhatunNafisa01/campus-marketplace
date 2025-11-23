const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all conversations for a user
router.get('/conversations/:userId', async (req, res) => {
  try {
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
        (SELECT COUNT(*) 
         FROM pesan_percakapan 
         WHERE id_percakapan = p.id_percakapan 
         AND id_pengirim != ? 
         AND sudah_dibaca = FALSE) as unread_count
      FROM percakapan p
      JOIN pengguna pembeli ON p.id_pembeli = pembeli.id_pengguna
      JOIN pengguna penjual ON p.id_penjual = penjual.id_pengguna
      JOIN produk prod ON p.id_produk = prod.id_produk
      WHERE (p.id_pembeli = ? OR p.id_penjual = ?) AND p.status = 'aktif'
      ORDER BY p.waktu_pesan_terakhir DESC
    `, [req.params.userId, req.params.userId, req.params.userId, req.params.userId, req.params.userId, req.params.userId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages in a conversation
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
    res.status(500).json({ error: error.message });
  }
});

// Create or get conversation
router.post('/conversations', async (req, res) => {
  try {
    const { id_pembeli, id_penjual, id_produk } = req.body;
    
    console.log('Creating conversation:', { id_pembeli, id_penjual, id_produk });
    
    // Check if conversation exists
    const [existing] = await db.query(
      'SELECT * FROM percakapan WHERE id_pembeli = ? AND id_penjual = ? AND id_produk = ?',
      [id_pembeli, id_penjual, id_produk]
    );
    
    if (existing.length > 0) {
      console.log('Conversation exists:', existing[0]);
      return res.json(existing[0]);
    }
    
    // Create new conversation
    const [result] = await db.query(
      'INSERT INTO percakapan (id_pembeli, id_penjual, id_produk) VALUES (?, ?, ?)',
      [id_pembeli, id_penjual, id_produk]
    );
    
    console.log('New conversation created:', result.insertId);
    
    res.status(201).json({ 
      id_percakapan: result.insertId,
      id_pembeli,
      id_penjual,
      id_produk
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/messages', async (req, res) => {
  try {
    const { id_percakapan, id_pengirim, pesan, jenis_pesan = 'teks' } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO pesan_percakapan (id_percakapan, id_pengirim, pesan, jenis_pesan) VALUES (?, ?, ?, ?)',
      [id_percakapan, id_pengirim, pesan, jenis_pesan]
    );
    
    res.status(201).json({ 
      id_pesan: result.insertId,
      id_percakapan,
      id_pengirim,
      pesan,
      jenis_pesan,
      dikirim_pada: new Date()
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
router.put('/messages/read/:conversationId/:userId', async (req, res) => {
  try {
    await db.query(
      'UPDATE pesan_percakapan SET sudah_dibaca = TRUE WHERE id_percakapan = ? AND id_pengirim != ?',
      [req.params.conversationId, req.params.userId]
    );
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;