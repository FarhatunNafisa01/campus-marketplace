import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, ArrowLeft, Search, Circle } from 'lucide-react';
import { getConversations, getMessages, getAuthUser } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function ChatPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { 
    socket, 
    connected,
    joinConversation, 
    leaveConversation, 
    sendMessage, 
    startTyping, 
    stopTyping,
    markMessagesAsRead,
    isUserOnline
  } = useSocket();

  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());

  // ============================================
  // MEMOIZE CALLBACKS
  // ============================================
  const loadConversations = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError('');
      const response = await getConversations(userId);
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Gagal memuat percakapan');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    try {
      setError('');
      const response = await getMessages(conversationId);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Gagal memuat pesan');
    }
  }, []);

  // ============================================
  // SOCKET EVENT LISTENERS
  // ============================================
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Listen for new messages
    const handleMessageReceived = (message) => {
      console.log('📨 Received message:', message);
      
      if (selectedConversation && message.id_percakapan === selectedConversation.id_percakapan) {
        setMessages(prev => {
          if (prev.some(m => m.id_pesan === message.id_pesan)) {
            return prev;
          }
          return [...prev, message];
        });
      }
      
      loadConversations(currentUser.id);
    };

    // Listen for typing indicators
    const handleTypingUser = (data) => {
      console.log('⌨️  Typing indicator:', data);
      
      if (selectedConversation && data.conversationId === selectedConversation.id_percakapan) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    };

    // Listen for read receipts
    const handleMessagesRead = (data) => {
      console.log('✓✓ Messages read:', data);
      
      if (selectedConversation && data.conversationId === selectedConversation.id_percakapan) {
        setMessages(prev => prev.map(msg => 
          msg.id_pengirim === currentUser.id 
            ? { ...msg, sudah_dibaca: true }
            : msg
        ));
      }
    };

    // Listen for errors
    const handleMessageError = (error) => {
      console.error('❌ Message error:', error);
      setError(error.error || 'Gagal mengirim pesan');
      setSending(false);
    };

    socket.on('message:received', handleMessageReceived);
    socket.on('typing:user', handleTypingUser);
    socket.on('messages:read', handleMessagesRead);
    socket.on('message:error', handleMessageError);

    return () => {
      socket.off('message:received', handleMessageReceived);
      socket.off('typing:user', handleTypingUser);
      socket.off('messages:read', handleMessagesRead);
      socket.off('message:error', handleMessageError);
    };
  }, [socket, selectedConversation, currentUser, loadConversations]);

  // ============================================
  // AUTO SCROLL
  // ============================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // ============================================
  // CHECK AUTH
  // ============================================
  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    loadConversations(user.id);
  }, [navigate, loadConversations]);

  // ============================================
  // JOIN/LEAVE CONVERSATION - FIXED DEPENDENCIES
  // ============================================
  useEffect(() => {
    if (selectedConversation && currentUser && joinConversation && leaveConversation && markMessagesAsRead) {
      joinConversation(selectedConversation.id_percakapan);
      loadMessages(selectedConversation.id_percakapan);
      markMessagesAsRead(selectedConversation.id_percakapan, currentUser.id);
      
      return () => {
        leaveConversation(selectedConversation.id_percakapan);
      };
    }
  }, [selectedConversation, currentUser, joinConversation, leaveConversation, markMessagesAsRead, loadMessages]);

  // ============================================
  // HANDLE SEND MESSAGE
  // ============================================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedConversation) return;

    setSending(true);
    setError('');
    
    const messageData = {
      id_percakapan: selectedConversation.id_percakapan,
      id_pengirim: currentUser.id,
      pesan: newMessage.trim(),
      jenis_pesan: 'teks'
    };

    sendMessage(messageData);
    setNewMessage('');
    setSending(false);
    stopTyping(selectedConversation.id_percakapan, currentUser.id);
  };

  // ============================================
  // HANDLE TYPING
  // ============================================
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!selectedConversation) return;
    
    startTyping(selectedConversation.id_percakapan, currentUser.id);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedConversation.id_percakapan, currentUser.id);
    }, 3000);
  };

  const filteredConversations = conversations.filter(conv =>
    (conv.nama_lawan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.nama_barang || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Kemarin';
    } else {
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/50';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return `http://localhost:5000${imagePath}`;
    return `http://localhost:5000/${imagePath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EEC6CA' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: '#A4C3B2' }}></div>
          <p className="text-gray-700 font-semibold">Memuat chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#EEC6CA' }}>
      {/* Sidebar */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 bg-white border-r`}>
        <div className="p-4 border-b" style={{ backgroundColor: '#A4C3B2' }}>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <ArrowLeft className="text-white" size={24} />
            </button>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white">Pesan</h1>
              {connected ? (
                <Circle size={10} className="text-green-400 fill-current animate-pulse" />
              ) : (
                <Circle size={10} className="text-red-400 fill-current" />
              )}
            </div>
            <div className="w-10"></div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border-none focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <MessageSquare size={64} className="mb-4 opacity-50" />
              <p className="text-center font-medium">Belum ada percakapan</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id_percakapan}
                onClick={() => {
                  setSelectedConversation(conv);
                  setError('');
                }}
                className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition ${
                  selectedConversation?.id_percakapan === conv.id_percakapan ? 'bg-gray-100' : ''
                }`}
              >
                <div className="relative">
                  <img
                    src={getImageUrl(conv.foto_lawan)}
                    alt={conv.nama_lawan}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  {isUserOnline(conv.id_lawan) && (
                    <Circle 
                      size={12} 
                      className="absolute bottom-0 right-0 text-green-500 fill-current border-2 border-white rounded-full" 
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800 truncate">{conv.nama_lawan}</h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(conv.waktu_pesan_terakhir)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mb-1">{conv.nama_barang}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 truncate">
                      {conv.pesan_terakhir || 'Belum ada pesan'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-white`}>
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: '#F5F5F5' }}>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-200 rounded-lg"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  <img
                    src={getImageUrl(selectedConversation.foto_lawan)}
                    alt={selectedConversation.nama_lawan}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {isUserOnline(selectedConversation.id_lawan) && (
                    <Circle 
                      size={10} 
                      className="absolute bottom-0 right-0 text-green-500 fill-current border-2 border-white rounded-full" 
                    />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">{selectedConversation.nama_lawan}</h2>
                  <p className="text-xs text-gray-600">
                    {isUserOnline(selectedConversation.id_lawan) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#F9F9F9' }}>
              {messages.map((msg, index) => {
                const isMe = msg.id_pengirim === currentUser.id;
                return (
                  <div
                    key={msg.id_pesan || index}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-md ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!isMe && (
                        <img
                          src={getImageUrl(msg.foto_profil)}
                          alt={msg.nama_pengirim}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <div>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isMe
                              ? 'text-white rounded-br-none'
                              : 'bg-white text-gray-800 rounded-bl-none'
                          }`}
                          style={isMe ? { backgroundColor: '#A4C3B2' } : {}}
                        >
                          <p className="text-sm break-words">{msg.pesan}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 px-2">
                          {formatTime(msg.dikirim_pada)}
                          {isMe && msg.sudah_dibaca && (
                            <span className="ml-1 text-blue-500">✓✓</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 rounded-2xl px-4 py-2 rounded-bl-none">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Ketik pesan..."
                  className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:border-opacity-100"
                  style={{ borderColor: '#A4C3B2' }}
                  disabled={sending || !connected}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending || !connected}
                  className="p-2 rounded-full transition disabled:opacity-50"
                  style={{ backgroundColor: '#A4C3B2' }}
                >
                  <Send size={24} className="text-white" />
                </button>
              </div>
              {!connected && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  Koneksi terputus. Mencoba menghubungkan kembali...
                </p>
              )}
            </form>
          </>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare size={80} className="mb-4 opacity-50" />
            <p className="text-lg">Pilih percakapan untuk mulai chat</p>
          </div>
        )}
      </div>
    </div>
  );
}