import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Edit2, Save, X, ShoppingBag, MessageSquare, Eye, Calendar, Camera, Lock, Package, ArrowLeft, BookOpen, AlertCircle, Trash2 } from 'lucide-react';
import axios from 'axios';

import { 
  getUserProfile, 
  updateUserProfile, 
  updatePassword, 
  getProductsBySeller, 
  getTransactionsByBuyer, 
  getAuthUser,
  logout 
} from '../services/api';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profil');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Ref untuk input file
  const fileInputRef = useRef(null);
  
  const currentUser = getAuthUser();
  const userId = currentUser?.id;

  const [profileData, setProfileData] = useState({
    nama: '',
    email: '',
    nim: '',
    no_telp: '',
    alamat: '',
    bio: '',
    foto_profil: ''
  });

  const [editData, setEditData] = useState({...profileData});
  const [passwordData, setPasswordData] = useState({
    passwordLama: '',
    passwordBaru: '',
    konfirmasiPassword: ''
  });

  const [stats, setStats] = useState({
    totalProduk: 0,
    produkTerjual: 0,
    totalTransaksi: 0,
    rating: 0
  });

  const [riwayatPenjualan, setRiwayatPenjualan] = useState([]);
  const [riwayatPembelian, setRiwayatPembelian] = useState([]);

  useEffect(() => {
    fetchProfileData();
    fetchStats();
    fetchRiwayatPenjualan();
    fetchRiwayatPembelian();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      console.log('Fetching profile for user ID:', userId);
      
      const response = await getUserProfile(userId);
      console.log('Profile response:', response.data);

      const user = response.data;
      
      const formattedData = {
        nama: user.nama || currentUser.nama || '',
        email: user.email || currentUser.email || '',
        nim: user.nim || currentUser.nim || '',
        no_telp: user.no_telp || '',
        alamat: user.alamat || '',
        bio: user.bio || '',
        foto_profil: user.foto_profil ? `http://localhost:5000${user.foto_profil}` : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'
      };
      
      console.log('Formatted data:', formattedData);
      
      setProfileData(formattedData);
      setEditData(formattedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      if (currentUser) {
        const fallbackData = {
          nama: currentUser.nama || '',
          email: currentUser.email || '',
          nim: currentUser.nim || '',
          no_telp: '',
          alamat: '',
          bio: '',
          foto_profil: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'
        };
        setProfileData(fallbackData);
        setEditData(fallbackData);
      }
      
      if (error.response?.status === 401) {
        logout();
      }
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${userId}`);
      setStats({
        totalProduk: response.data.total_produk || 0,
        produkTerjual: response.data.produk_terjual || 0,
        totalTransaksi: response.data.total_transaksi || 0,
        rating: response.data.rating || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRiwayatPenjualan = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/products/seller/${userId}`);
      const transformed = response.data.map(item => ({
        id: item.id_produk,
        nama: item.nama_barang,
        harga: `Rp ${Number(item.harga).toLocaleString('id-ID')}`,
        status: item.status === 'terjual' ? 'Terjual' : 'Aktif',
        tanggal: new Date(item.dibuat_pada).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        views: item.jumlah_dilihat,
        foto: item.url_foto || 'https://via.placeholder.com/200'
      }));
      setRiwayatPenjualan(transformed);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const fetchRiwayatPembelian = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/transactions/buyer/${userId}`);
      const transformed = response.data.map(item => ({
        id: item.id_transaksi,
        nama: item.nama_barang,
        harga: `Rp ${Number(item.harga_disepakati).toLocaleString('id-ID')}`,
        hargaDisepakati: `Rp ${Number(item.harga_disepakati).toLocaleString('id-ID')}`,
        status: item.status === 'selesai' ? 'Selesai' : item.status,
        tanggal: new Date(item.dibuat_pada).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        tanggalTransaksi: new Date(item.diselesaikan_pada || item.dibuat_pada).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        penjual: item.nama_penjual,
        noPenjual: item.no_telp_penjual,
        metodeBayar: item.metode_bayar,
        lokasiCOD: item.lokasi_ketemu,
        catatan: item.catatan,
        foto: item.url_foto || 'https://via.placeholder.com/200'
      }));
      setRiwayatPembelian(transformed);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  // Handler untuk upload foto
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Hanya file JPG, JPEG, dan PNG yang diperbolehkan!');
      return;
    }

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB!');
      return;
    }

    try {
      setUploadingPhoto(true);

      const formData = new FormData();
      formData.append('foto_profil', file);

      const response = await axios.post(
        `http://localhost:5000/api/users/${userId}/upload-photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update state dengan foto baru
      const newPhotoUrl = `http://localhost:5000${response.data.foto_profil}`;
      setProfileData(prev => ({...prev, foto_profil: newPhotoUrl}));
      setEditData(prev => ({...prev, foto_profil: newPhotoUrl}));

      alert('Foto profil berhasil diupdate!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert(error.response?.data?.error || 'Gagal mengupload foto. Coba lagi.');
    } finally {
      setUploadingPhoto(false);
      // Reset input file
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Yakin ingin menghapus foto profil?')) return;

    try {
      setUploadingPhoto(true);

      await axios.delete(`http://localhost:5000/api/users/${userId}/photo`);

      // Set kembali ke default
      const defaultPhoto = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';
      setProfileData(prev => ({...prev, foto_profil: defaultPhoto}));
      setEditData(prev => ({...prev, foto_profil: defaultPhoto}));

      alert('Foto profil berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Gagal menghapus foto. Coba lagi.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({...profileData});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({...profileData});
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/users/${userId}`, {
        nama: editData.nama,
        no_telp: editData.no_telp,
        alamat: editData.alamat,
        bio: editData.bio
      });
      
      setProfileData({...editData});
      setIsEditing(false);
      alert('Profil berhasil diupdate!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal mengupdate profil. Coba lagi.');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.passwordBaru !== passwordData.konfirmasiPassword) {
      alert('Password baru tidak cocok dengan konfirmasi!');
      return;
    }
    if (passwordData.passwordBaru.length < 6) {
      alert('Password minimal 6 karakter!');
      return;
    }
    
    try {
      await axios.put(`http://localhost:5000/api/users/${userId}/password`, {
        oldPassword: passwordData.passwordLama,
        newPassword: passwordData.passwordBaru
      });
      
      alert('Password berhasil diubah!');
      setShowPasswordModal(false);
      setPasswordData({passwordLama: '', passwordBaru: '', konfirmasiPassword: ''});
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Gagal mengubah password. Pastikan password lama benar.');
    }
  };

  const handleViewTransaction = (item, type) => {
    setSelectedTransaction({...item, type});
    setShowTransactionDetail(true);
  };

  const handleReportIssue = () => {
    alert('Form komplain akan dibuka. Admin akan menindaklanjuti masalah Anda.');
    setShowTransactionDetail(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EEC6CA' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: '#A4C3B2' }}></div>
          <p className="text-gray-700 font-semibold">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EEC6CA' }}>
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: '#A4C3B2' }}>
                <ShoppingBag className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">CampusMarket</h1>
                <p className="text-xs text-gray-500">Profil Saya</p>
              </div>
            </div>
            <Link to="/" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium transition">
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* Profile Picture */}
              <div className="relative mb-4">
                <img 
                  src={profileData.foto_profil} 
                  alt="Profile"
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-100"
                />
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
                <div className="absolute bottom-0 right-1/2 translate-x-16 flex gap-2">
                  <button 
                    onClick={handlePhotoClick}
                    disabled={uploadingPhoto}
                    className="p-2 rounded-full text-white shadow-lg hover:scale-110 transition disabled:opacity-50 disabled:cursor-not-allowed" 
                    style={{ backgroundColor: '#A4C3B2' }}
                    title="Upload foto"
                  >
                    <Camera size={18} />
                  </button>
                  {profileData.foto_profil && !profileData.foto_profil.includes('unsplash') && (
                    <button 
                      onClick={handleDeletePhoto}
                      disabled={uploadingPhoto}
                      className="p-2 rounded-full bg-red-500 text-white shadow-lg hover:scale-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Hapus foto"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">{profileData.nama}</h2>
                <p className="text-sm text-gray-500">NIM: {profileData.nim}</p>
                <div className="flex items-center justify-center space-x-1 mt-2">
                  <span className="text-yellow-500">★</span>
                  <span className="font-semibold">{stats.rating ? Number(stats.rating).toFixed(1) : '0.0'}</span>
                  <span className="text-gray-500 text-sm">Rating</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#A4C3B2' }}>{stats.totalProduk}</p>
                  <p className="text-xs text-gray-600">Total Produk</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#A4C3B2' }}>{stats.produkTerjual}</p>
                  <p className="text-xs text-gray-600">Terjual</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {!isEditing ? (
                  <>
                    <button 
                      onClick={handleEdit}
                      className="w-full text-white py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:opacity-90 transition"
                      style={{ backgroundColor: '#A4C3B2' }}
                    >
                      <Edit2 size={18} />
                      <span>Edit Profil</span>
                    </button>
                    <button 
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-gray-300 transition"
                    >
                      <Lock size={18} />
                      <span>Ganti Password</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleSave}
                      className="w-full text-white py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:opacity-90 transition"
                      style={{ backgroundColor: '#A4C3B2' }}
                    >
                      <Save size={18} />
                      <span>Simpan Perubahan</span>
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold flex items-center justify-center space-x-2 hover:bg-red-600 transition"
                    >
                      <X size={18} />
                      <span>Batal</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Rest remains the same */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-md mb-6">
              <div className="flex border-b overflow-x-auto">
                <button
                  onClick={() => setActiveTab('profil')}
                  className={`flex-1 py-4 px-6 font-semibold transition whitespace-nowrap ${
                    activeTab === 'profil' 
                      ? 'border-b-2' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={activeTab === 'profil' ? { borderColor: '#A4C3B2', color: '#A4C3B2' } : {}}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <User size={18} />
                    <span>Data Profil</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('penjualan')}
                  className={`flex-1 py-4 px-6 font-semibold transition whitespace-nowrap ${
                    activeTab === 'penjualan' 
                      ? 'border-b-2' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={activeTab === 'penjualan' ? { borderColor: '#A4C3B2', color: '#A4C3B2' } : {}}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Package size={18} />
                    <span>Penjualan</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('pembelian')}
                  className={`flex-1 py-4 px-6 font-semibold transition whitespace-nowrap ${
                    activeTab === 'pembelian' 
                      ? 'border-b-2' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  style={activeTab === 'pembelian' ? { borderColor: '#A4C3B2', color: '#A4C3B2' } : {}}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <ShoppingBag size={18} />
                    <span>Pembelian</span>
                  </div>
                </button>
              </div>

              {/* Tab Content - Same as before */}
              <div className="p-6">
                {activeTab === 'profil' && (
                  <div className="space-y-4">
                    {!isEditing ? (
                      <>
                        <div className="flex items-start space-x-3 py-3 border-b">
                          <User className="text-gray-400 mt-1" size={20} />
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">Nama Lengkap</p>
                            <p className="font-semibold text-gray-800">{profileData.nama}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 py-3 border-b">
                          <Mail className="text-gray-400 mt-1" size={20} />
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-semibold text-gray-800">{profileData.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 py-3 border-b">
                          <BookOpen className="text-gray-400 mt-1" size={20} />
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">NIM</p>
                            <p className="font-semibold text-gray-800">{profileData.nim}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 py-3 border-b">
                          <Phone className="text-gray-400 mt-1" size={20} />
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">No. Telepon</p>
                            <p className="font-semibold text-gray-800">{profileData.no_telp || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 py-3 border-b">
                          <MapPin className="text-gray-400 mt-1" size={20} />
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">Alamat</p>
                            <p className="font-semibold text-gray-800">{profileData.alamat || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 py-3">
                          <MessageSquare className="text-gray-400 mt-1" size={20} />
                          <div className="flex-1">
                            <p className="text-sm text-gray-500">Bio</p>
                            <p className="font-semibold text-gray-800">{profileData.bio || '-'}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                          <input
                            type="text"
                            value={editData.nama}
                            onChange={(e) => setEditData({...editData, nama: e.target.value})}
                            className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition"
                            style={{ borderColor: '#A4C3B2' }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={editData.email}
                            disabled
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-100 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon</label>
                          <input
                            type="tel"
                            value={editData.no_telp}
                            onChange={(e) => setEditData({...editData, no_telp: e.target.value})}
                            className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition"
                            style={{ borderColor: '#A4C3B2' }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                          <input
                            type="text"
                            value={editData.alamat}
                            onChange={(e) => setEditData({...editData, alamat: e.target.value})}
                            className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition"
                            style={{ borderColor: '#A4C3B2' }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                          <textarea
                            value={editData.bio}
                            onChange={(e) => setEditData({...editData, bio: e.target.value})}
                            rows="3"
                            className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition"
                            style={{ borderColor: '#A4C3B2' }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Penjualan Tab */}
                {activeTab === 'penjualan' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Riwayat Penjualan</h3>
                      <button className="text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition" style={{ backgroundColor: '#A4C3B2' }}>
                        + Posting Baru
                      </button>
                    </div>
                    {riwayatPenjualan.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Belum ada riwayat penjualan</p>
                    ) : (
                      riwayatPenjualan.map((item) => (
                        <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:shadow-md transition">
                          <img src={item.foto} alt={item.nama} className="w-20 h-20 object-cover rounded-lg" />
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800">{item.nama}</h4>
                            <p className="font-semibold" style={{ color: '#A4C3B2' }}>{item.harga}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                <Calendar size={14} />
                                <span>{item.tanggal}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Eye size={14} />
                                <span>{item.views} views</span>
                              </span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'Terjual' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Pembelian Tab */}
                {activeTab === 'pembelian' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Riwayat Pembelian</h3>
                    {riwayatPembelian.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Belum ada riwayat pembelian</p>
                    ) : (
                      riwayatPembelian.map((item) => (
                        <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:shadow-md transition cursor-pointer" onClick={() => handleViewTransaction(item, 'pembelian')}>
                          <img src={item.foto} alt={item.nama} className="w-20 h-20 object-cover rounded-lg" />
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800">{item.nama}</h4>
                            <p className="font-semibold" style={{ color: '#A4C3B2' }}>{item.harga}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                <Calendar size={14} />
                                <span>{item.tanggal}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <User size={14} />
                                <span>{item.penjual}</span>
                              </span>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            {item.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Ganti Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password Lama</label>
                <input
                  type="password"
                  value={passwordData.passwordLama}
                  onChange={(e) => setPasswordData({...passwordData, passwordLama: e.target.value})}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition"
                  style={{ borderColor: '#A4C3B2' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
                <input
                  type="password"
                  value={passwordData.passwordBaru}
                  onChange={(e) => setPasswordData({...passwordData, passwordBaru: e.target.value})}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition"
                  style={{ borderColor: '#A4C3B2' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={passwordData.konfirmasiPassword}
                  onChange={(e) => setPasswordData({...passwordData, konfirmasiPassword: e.target.value})}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition"
                  style={{ borderColor: '#A4C3B2' }}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handlePasswordChange}
                  className="flex-1 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
                  style={{ backgroundColor: '#A4C3B2' }}
                >
                  Simpan Password
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {showTransactionDetail && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Detail Transaksi</h3>
              <button onClick={() => setShowTransactionDetail(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="flex items-start space-x-4 mb-6 pb-6 border-b">
              <img src={selectedTransaction.foto} alt={selectedTransaction.nama} className="w-24 h-24 object-cover rounded-lg" />
              <div className="flex-1">
                <h4 className="font-bold text-lg text-gray-800">{selectedTransaction.nama}</h4>
                <p className="text-lg font-bold mt-2" style={{ color: '#A4C3B2' }}>
                  {selectedTransaction.hargaDisepakati}
                </p>
              </div>
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                {selectedTransaction.status}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <h4 className="font-bold text-gray-800">Informasi Transaksi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Transaksi</p>
                    <p className="font-semibold text-gray-800">{selectedTransaction.tanggalTransaksi}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <User className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Penjual</p>
                    <p className="font-semibold text-gray-800">{selectedTransaction.penjual}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">No. Telepon</p>
                    <p className="font-semibold text-gray-800">{selectedTransaction.noPenjual}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Package className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Metode Pembayaran</p>
                    <p className="font-semibold text-gray-800">{selectedTransaction.metodeBayar}</p>
                  </div>
                </div>

                {selectedTransaction.lokasiCOD && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="text-gray-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm text-gray-500">Lokasi COD</p>
                      <p className="font-semibold text-gray-800">{selectedTransaction.lokasiCOD}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedTransaction.catatan && (
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <MessageSquare className="text-gray-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm text-gray-500">Catatan</p>
                    <p className="text-gray-800">{selectedTransaction.catatan}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <button 
                onClick={() => alert(`Membuka chat dengan ${selectedTransaction.penjual}`)}
                className="flex-1 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center space-x-2"
                style={{ backgroundColor: '#A4C3B2' }}
              >
                <MessageSquare size={18} />
                <span>Chat Penjual</span>
              </button>
              <button 
                onClick={handleReportIssue}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition flex items-center justify-center space-x-2"
              >
                <AlertCircle size={18} />
                <span>Laporkan Masalah</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">CampusMarket</h4>
              <p className="text-gray-400 text-sm">
                Platform marketplace eksklusif untuk mahasiswa. Jual beli barang bekas dengan aman dan mudah.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Navigasi</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/" className="hover:text-white transition">Beranda</Link></li>
                <li><a href="#kategori" className="hover:text-white transition">Kategori</a></li>
                <li><a href="#jual" className="hover:text-white transition">Jual Barang</a></li>
                <li><a href="#bantuan" className="hover:text-white transition">Bantuan</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Kontak</h4>
              <p className="text-gray-400 text-sm">
                Email: support@campusmarket.ac.id<br />
                Khusus mahasiswa terdaftar
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
            © 2025 CampusMarket. Platform Marketplace Mahasiswa.
          </div>
        </div>
      </footer>
    </div>
  );
}