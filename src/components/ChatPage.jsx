import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, ArrowLeft, Image, Search, MoreVertical } from 'lucide-react';
import { getConversations, getMessages, sendMessage, markAsRead, getAuthUser } from '../services/api';

export default function ChatPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    loadConversations(user.id);
  }, [navigate]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id_percakapan);
      markAsRead(selectedConversation.id_percakapan, currentUser.id);
    }
  }, [selectedConversation, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async (userId) => {
    try {
      setLoading(true);
      const response = await getConversations(userId);
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await getMessages(conversationId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const messageData = {
        id_percakapan: selectedConversation.id_percakapan,
        id_pengirim: currentUser.id,
        pesan: newMessage.trim(),
        jenis_pesan: 'teks'
      };

      const response = await sendMessage(messageData);
      
      // Add message to UI immediately
      setMessages([...messages, {
        ...response.data,
        nama_pengirim: currentUser.nama,
        foto_profil: currentUser.foto_profil
      }]);
      
      setNewMessage('');
      
      // Reload conversations to update last message
      loadConversations(currentUser.id);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.nama_lawan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.nama_barang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp) => {
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
      {/* Sidebar - List Conversations */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 bg-white border-r`}>
        {/* Header */}
        <div className="p-4 border-b" style={{ backgroundColor: '#A4C3B2' }}>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <ArrowLeft className="text-white" size={24} />
            </button>
            <h1 className="text-xl font-bold text-white">Pesan</h1>
            <div className="w-10"></div>
          </div>
          
          {/* Search */}
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

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <MessageSquare size={64} className="mb-4 opacity-50" />
              <p className="text-center">Belum ada percakapan</p>
              <p className="text-sm text-center mt-2">Mulai chat dengan penjual dari halaman produk</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id_percakapan}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition ${
                  selectedConversation?.id_percakapan === conv.id_percakapan ? 'bg-gray-100' : ''
                }`}
              >
                {/* Avatar */}
                <img
                  src={conv.foto_lawan?.startsWith('http') 
                    ? conv.foto_lawan 
                    : conv.foto_lawan?.startsWith('/') 
                    ? `http://localhost:5000${conv.foto_lawan}`
                    : 'https://via.placeholder.com/50'}
                  alt={conv.nama_lawan}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />

                {/* Content */}
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
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: '#F5F5F5' }}>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-200 rounded-lg"
                >
                  <ArrowLeft size={20} />
                </button>
                <img
                  src={selectedConversation.foto_lawan?.startsWith('http') 
                    ? selectedConversation.foto_lawan 
                    : selectedConversation.foto_lawan?.startsWith('/') 
                    ? `http://localhost:5000${selectedConversation.foto_lawan}`
                    : 'https://via.placeholder.com/40'}
                  alt={selectedConversation.nama_lawan}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h2 className="font-semibold text-gray-800">{selectedConversation.nama_lawan}</h2>
                  <p className="text-sm text-gray-600">{selectedConversation.nama_barang}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-200 rounded-lg">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#F9F9F9' }}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Belum ada pesan. Mulai percakapan!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.id_pengirim === currentUser.id;
                  return (
                    <div
                      key={msg.id_pesan || index}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-md ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {!isMe && (
                          <img
                            src={msg.foto_profil?.startsWith('http') 
                              ? msg.foto_profil 
                              : msg.foto_profil?.startsWith('/') 
                              ? `http://localhost:5000${msg.foto_profil}`
                              : 'https://via.placeholder.com/32'}
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
                            <p className="text-sm">{msg.pesan}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-2">
                            {formatTime(msg.dikirim_pada)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Kirim gambar"
                >
                  <Image size={24} className="text-gray-600" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:border-opacity-100"
                  style={{ borderColor: '#A4C3B2' }}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-2 rounded-full transition disabled:opacity-50"
                  style={{ backgroundColor: '#A4C3B2' }}
                >
                  <Send size={24} className="text-white" />
                </button>
              </div>
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