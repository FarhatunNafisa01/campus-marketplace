// backend/socket/socketHandler.js
const db = require('../config/database');

// Store online users: { userId: socketId }
const onlineUsers = new Map();

// Store typing status: { conversationId: [userId1, userId2] }
const typingUsers = new Map();

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);

    // ============================================
    // USER AUTHENTICATION & ONLINE STATUS
    // ============================================
    socket.on('user:online', (userId) => {
      console.log(`👤 User ${userId} is online`);
      onlineUsers.set(userId.toString(), socket.id);
      socket.userId = userId;
      
      // Broadcast to all users that this user is online
      io.emit('user:status', {
        userId,
        status: 'online'
      });
    });

    // ============================================
    // JOIN CONVERSATION ROOM
    // ============================================
    socket.on('conversation:join', async (conversationId) => {
      socket.join(`conversation-${conversationId}`);
      console.log(`📥 User ${socket.userId} joined conversation ${conversationId}`);
      
      // Mark messages as read when joining
      if (socket.userId) {
        try {
          await db.query(
            `UPDATE pesan_percakapan 
             SET sudah_dibaca = TRUE 
             WHERE id_percakapan = ? 
             AND id_pengirim != ? 
             AND sudah_dibaca = FALSE`,
            [conversationId, socket.userId]
          );
          
          // Notify other user that messages were read
          socket.to(`conversation-${conversationId}`).emit('messages:read', {
            conversationId,
            readBy: socket.userId
          });
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      }
    });

    // ============================================
    // LEAVE CONVERSATION ROOM
    // ============================================
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation-${conversationId}`);
      console.log(`📤 User ${socket.userId} left conversation ${conversationId}`);
      
      // Stop typing when leaving
      handleStopTyping(socket, conversationId);
    });

    // ============================================
    // SEND MESSAGE
    // ============================================
    socket.on('message:send', async (data) => {
      try {
        const { id_percakapan, id_pengirim, pesan, jenis_pesan = 'teks' } = data;
        
        console.log('📨 Sending message:', data);
        
        // Validate
        if (!id_percakapan || !id_pengirim || !pesan) {
          socket.emit('message:error', {
            error: 'Data tidak lengkap'
          });
          return;
        }

        // Insert to database
        const [result] = await db.query(
          `INSERT INTO pesan_percakapan 
           (id_percakapan, id_pengirim, pesan, jenis_pesan, sudah_dibaca) 
           VALUES (?, ?, ?, ?, FALSE)`,
          [id_percakapan, id_pengirim, pesan, jenis_pesan]
        );

        // Get sender info
        const [senderInfo] = await db.query(
          'SELECT nama, foto_profil FROM pengguna WHERE id_pengguna = ?',
          [id_pengirim]
        );

        // Get conversation participants
        const [conversation] = await db.query(
          'SELECT id_pembeli, id_penjual FROM percakapan WHERE id_percakapan = ?',
          [id_percakapan]
        );

        if (conversation.length === 0) {
          socket.emit('message:error', {
            error: 'Conversation tidak ditemukan'
          });
          return;
        }

        const messageData = {
          id_pesan: result.insertId,
          id_percakapan,
          id_pengirim,
          pesan,
          jenis_pesan,
          dikirim_pada: new Date(),
          sudah_dibaca: false,
          nama_pengirim: senderInfo[0]?.nama,
          foto_profil: senderInfo[0]?.foto_profil
        };

        // Send to all users in conversation room
        io.to(`conversation-${id_percakapan}`).emit('message:received', messageData);

        // Send notification to offline user
        const recipientId = conversation[0].id_pembeli === id_pengirim 
          ? conversation[0].id_penjual 
          : conversation[0].id_pembeli;

        const recipientSocketId = onlineUsers.get(recipientId.toString());
        
        if (!recipientSocketId) {
          // User is offline - could send push notification here
          console.log(`📵 User ${recipientId} is offline`);
        } else {
          // Send notification to online user (if not in conversation room)
          io.to(recipientSocketId).emit('notification:new_message', {
            conversationId: id_percakapan,
            senderId: id_pengirim,
            senderName: senderInfo[0]?.nama,
            message: pesan,
            timestamp: new Date()
          });
        }

        // Stop typing indicator
        handleStopTyping(socket, id_percakapan);

      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('message:error', {
          error: 'Gagal mengirim pesan',
          message: error.message
        });
      }
    });

    // ============================================
    // TYPING INDICATOR
    // ============================================
    socket.on('typing:start', (data) => {
      const { conversationId, userId } = data;
      
      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set());
      }
      
      typingUsers.get(conversationId).add(userId);
      
      // Broadcast to other users in room (except sender)
      socket.to(`conversation-${conversationId}`).emit('typing:user', {
        conversationId,
        userId,
        isTyping: true
      });
      
      console.log(`⌨️  User ${userId} is typing in conversation ${conversationId}`);
    });

    socket.on('typing:stop', (data) => {
      const { conversationId } = data;
      handleStopTyping(socket, conversationId);
    });

    // ============================================
    // MARK MESSAGES AS READ
    // ============================================
    socket.on('messages:mark_read', async (data) => {
      try {
        const { conversationId, userId } = data;
        
        await db.query(
          `UPDATE pesan_percakapan 
           SET sudah_dibaca = TRUE 
           WHERE id_percakapan = ? 
           AND id_pengirim != ? 
           AND sudah_dibaca = FALSE`,
          [conversationId, userId]
        );
        
        // Notify sender that messages were read
        socket.to(`conversation-${conversationId}`).emit('messages:read', {
          conversationId,
          readBy: userId
        });
        
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // ============================================
    // DISCONNECT
    // ============================================
    socket.on('disconnect', () => {
      console.log('🔴 User disconnected:', socket.id);
      
      if (socket.userId) {
        onlineUsers.delete(socket.userId.toString());
        
        // Broadcast offline status
        io.emit('user:status', {
          userId: socket.userId,
          status: 'offline'
        });
        
        // Clear typing indicators
        typingUsers.forEach((users, conversationId) => {
          if (users.has(socket.userId)) {
            handleStopTyping(socket, conversationId);
          }
        });
      }
    });
  });

  // Helper function to handle stop typing
  const handleStopTyping = (socket, conversationId) => {
    if (typingUsers.has(conversationId)) {
      typingUsers.get(conversationId).delete(socket.userId);
      
      if (typingUsers.get(conversationId).size === 0) {
        typingUsers.delete(conversationId);
      }
      
      socket.to(`conversation-${conversationId}`).emit('typing:user', {
        conversationId,
        userId: socket.userId,
        isTyping: false
      });
    }
  };

  // Helper to get online users (for debugging)
  io.on('connection', (socket) => {
    socket.on('users:get_online', () => {
      socket.emit('users:online_list', Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = setupSocketHandlers;