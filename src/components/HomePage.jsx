import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, MessageSquare, User, ChevronRight, Book, Laptop, Home, Utensils, TrendingUp, Eye, Menu, X, LogOut } from 'lucide-react';
import { getProducts, getAuthUser, isAuthenticated, logout, createConversation } from '../services/api';
import { Filter, ChevronDown, DollarSign, Package, Tag } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState(null); // 'kategori' atau 'jual'
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedCondition, setSelectedCondition] = useState('Semua');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [sortBy, setSortBy] = useState('terbaru');

  const [categories, setCategories] = useState([
    { name: 'Semua', icon: ShoppingBag, count: 0 },
    { name: 'Buku', icon: Book, count: 0 },
    { name: 'Elektronik', icon: Laptop, count: 0 },
    { name: 'Kost', icon: Home, count: 0 },
    { name: 'Lainnya', icon: Utensils, count: 0 }
  ]);

  useEffect(() => {
    fetchProducts();
    checkUser();
  }, []);

  const checkUser = () => {
    if (isAuthenticated()) {
      setCurrentUser(getAuthUser());
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();

      console.log('📦 Raw products from API:', response.data); // DEBUG

      const transformedData = response.data.map(product => {
        // 🔥 FIX: Konversi path ke URL lengkap
        let imageUrl = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400'; // default

        if (product.url_foto) {
          // Jika sudah URL lengkap (mulai dengan http)
          if (product.url_foto.startsWith('http')) {
            imageUrl = product.url_foto;
          }
          // Jika path relatif (misal: /uploads/products/...)
          else {
            const cleanPath = product.url_foto.startsWith('/')
              ? product.url_foto
              : '/' + product.url_foto;
            imageUrl = `http://localhost:5000${cleanPath}`;
          }
        }

        console.log(`📸 Product: ${product.nama_barang}`);
        console.log(`   DB path: ${product.url_foto}`);
        console.log(`   Final URL: ${imageUrl}`);

        return {
          id: product.id_produk,
          name: product.nama_barang,
          price: `Rp ${Number(product.harga).toLocaleString('id-ID')}`,
          condition: product.kondisi === 'bekas' ? 'Bekas' : 'Baru',
          location: product.lokasi,
          image: imageUrl,
          seller: product.nama_penjual,
          sellerId: product.id_pengguna,  // ✅ Tambahkan ini
          views: product.jumlah_dilihat,
          negotiable: product.bisa_nego,
          category: product.nama_kategori
        };
      });

      console.log('✅ Transformed products:', transformedData);

      // Update kategori dengan jumlah real dari data
      const categoryCounts = {
        'Semua': transformedData.length,
        'Buku': transformedData.filter(p => p.category === 'Buku').length,
        'Elektronik': transformedData.filter(p => p.category === 'Elektronik').length,
        'Kost': transformedData.filter(p => p.category === 'Kost').length,
        'Lainnya': transformedData.filter(p => p.category === 'Lainnya').length
      };

      setCategories(prev => prev.map(cat => ({
        ...cat,
        count: categoryCounts[cat.name] || 0
      })));
      setFeaturedProducts(transformedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Gagal memuat produk. Pastikan backend sudah berjalan.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin logout?')) {
      logout();
    }
  };

  const handleChatSeller = async (product) => {
    if (!currentUser) {
      alert('Silakan login terlebih dahulu untuk chat dengan penjual');
      navigate('/login');
      return;
    }

    // Cek apakah user mencoba chat produk sendiri
    if (product.sellerId === currentUser.id) {
      alert('Anda tidak dapat chat dengan diri sendiri');
      return;
    }

    try {
      // Tampilkan loading
      const loadingElement = document.createElement('div');
      loadingElement.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      loadingElement.innerHTML = `
      <div class="bg-white rounded-lg p-6 flex flex-col items-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-3"></div>
        <p class="text-gray-700">Membuka chat...</p>
      </div>
    `;
      document.body.appendChild(loadingElement);

      // Create or get conversation
      const conversationData = {
        id_pembeli: currentUser.id,
        id_penjual: product.sellerId,
        id_produk: product.id
      };

      console.log('Creating conversation:', conversationData);
      await createConversation(conversationData);

      // Remove loading dan navigate
      document.body.removeChild(loadingElement);
      navigate('/chat');

    } catch (error) {
      console.error('Error creating conversation:', error);

      // Remove loading jika ada
      const loadingElement = document.querySelector('.fixed.inset-0');
      if (loadingElement) {
        document.body.removeChild(loadingElement);
      }

      // Tampilkan error message
      alert('Gagal membuka chat: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleJualBarang = () => {
    if (!currentUser) {
      navigate('/login');
    } else {
      navigate('/jual');
    }
  };

  const handleOpenSidebar = (mode) => {
    setSidebarMode(mode);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setTimeout(() => setSidebarMode(null), 300);
  };

  const handleSelectCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    handleCloseSidebar();
  };

  const resetFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSelectedCondition('Semua');
    setIsNegotiable(false);
    setSortBy('terbaru');
  };

  const hasActiveFilters = priceRange.min || priceRange.max || selectedCondition !== 'Semua' || isNegotiable || sortBy !== 'terbaru';

  // Filter berdasarkan kategori, search query, dan filters

  const filteredProducts = featuredProducts.filter(product => {
    const matchCategory = selectedCategory === 'Semua' || product.category === selectedCategory;

    const matchSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    // 🔥 FIX: Perbaikan parsing harga
    const productPrice = Number(product.price.replace(/[^0-9]/g, ''));

    // Jika min atau max kosong string, jangan gunakan Number() langsung
    const minPrice = priceRange.min && priceRange.min.trim() !== ''
      ? Number(priceRange.min)
      : 0;

    const maxPrice = priceRange.max && priceRange.max.trim() !== ''
      ? Number(priceRange.max)
      : Infinity;

    // Filter hanya jika ada input
    const matchPrice = productPrice >= minPrice && productPrice <= maxPrice;

    // Debug console (bisa dihapus nanti)
    if (priceRange.min || priceRange.max) {
      console.log('Filter Debug:', {
        productName: product.name,
        productPrice: productPrice,
        minPrice: minPrice,
        maxPrice: maxPrice,
        matchPrice: matchPrice
      });
    }

    const matchCondition = selectedCondition === 'Semua' || product.condition === selectedCondition;

    const matchNego = !isNegotiable || product.negotiable;

    return matchCategory && matchSearch && matchPrice && matchCondition && matchNego;
  }).sort((a, b) => {
    const priceA = Number(a.price.replace(/[^0-9]/g, ''));
    const priceB = Number(b.price.replace(/[^0-9]/g, ''));

    if (sortBy === 'termurah') return priceA - priceB;
    if (sortBy === 'termahal') return priceB - priceA;
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EEC6CA' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: '#A4C3B2' }}></div>
          <p className="text-gray-700 font-semibold">Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EEC6CA' }}>
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition"
            style={{ backgroundColor: '#A4C3B2' }}
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EEC6CA' }}>

      {/*Background Effects - Floating Elements*/}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating Hearts */}
        <div className="absolute top-20 left-10 animate-bounce" style={{ animationDelay: '0s' }}>
          <svg className="w-8 h-8 text-pink-300 opacity-30" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="absolute top-40 right-20 animate-bounce" style={{ animationDelay: '1s' }}>
          <svg className="w-6 h-6 text-pink-400 opacity-40" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="absolute bottom-32 left-1/4 animate-bounce" style={{ animationDelay: '2s' }}>
          <svg className="w-10 h-10 text-pink-200 opacity-25" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Floating Stars */}
        <div className="absolute top-1/3 right-10 animate-pulse" style={{ animationDelay: '0.5s' }}>
          <svg className="w-5 h-5 text-yellow-300 opacity-50" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <div className="absolute bottom-20 right-1/3 animate-pulse" style={{ animationDelay: '1.5s' }}>
          <svg className="w-4 h-4 text-yellow-400 opacity-40" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>

        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-transparent to-pink-300 opacity-20 animate-pulse"></div>

        {/* Subtle Wave Pattern */}
        <svg className="absolute bottom-0 left-0 w-full h-32 opacity-10" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="fill-current text-pink-300"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="fill-current text-pink-400"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="fill-current text-pink-500"></path>
        </svg>
      </div>




      {/* Header */}
      <header className="backdrop-blur-2xl bg-white/60 shadow-xl sticky top-0 z-50 transition-all duration-500 border-b border-white/40 animate-fadeInSlow">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-4 group">
              <div className="p-3 rounded-3xl bg-[#A4C3B2]/90 shadow-lg backdrop-blur-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <ShoppingBag className="text-white drop-shadow-lg" size={30} />
              </div>
              <div className="transition-all duration-300 group-hover:translate-x-1">
                <h1 className="text-3xl font-extrabold text-gray-800 tracking-wide drop-shadow-sm group-hover:text-[#7DA08E]">
                  CampusMarket
                </h1>
                <p className="text-xs text-gray-500">Marketplace Mahasiswa</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-10">
              <Link
                to="/"
                className="text-gray-700 font-medium transition-all duration-300 hover:text-[#A4C3B2] hover:scale-110 hover:drop-shadow-md"
              >
                Beranda
              </Link>
              <button
                onClick={() => handleOpenSidebar('kategori')}
                className="text-gray-700 font-medium transition-all duration-300 hover:text-[#A4C3B2] hover:scale-110 hover:drop-shadow-md bg-transparent border-none cursor-pointer"
              >
                Kategori
              </button>
              <button
                onClick={handleJualBarang}
                className="text-gray-700 font-medium transition-all duration-300 hover:text-[#A4C3B2] hover:scale-110 hover:drop-shadow-md bg-transparent border-none cursor-pointer"
              >
                Jual Barang
              </button>
            </nav>

            <div className="flex items-center space-x-5">
              {currentUser ? (
                <>
                  {/* Notification Center - NEW! */}
                  <NotificationCenter />

                  {/* Profile Button */}
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 text-white px-5 py-2.5 rounded-2xl bg-[#A4C3B2]/90 shadow-lg backdrop-blur-xl transition-all duration-300 hover:opacity-95 hover:scale-110 hover:shadow-xl"
                  >
                    <User size={18} />
                    <span className="hidden sm:inline drop-shadow-sm">
                      {currentUser.nama.split(' ')[0]}
                    </span>
                  </Link>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="hidden sm:flex items-center space-x-2 text-red-600 p-3 rounded-xl transition-all duration-300 hover:text-red-700 hover:bg-red-50/70 hover:scale-110"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:inline text-gray-700 font-medium transition-all duration-300 hover:text-[#A4C3B2] hover:scale-105"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center space-x-2 text-white px-5 py-2.5 rounded-2xl bg-[#A4C3B2]/90 shadow-lg backdrop-blur-xl transition-all duration-300 hover:opacity-95 hover:scale-110 hover:shadow-xl"
                  >
                    <User size={18} />
                    <span>Daftar</span>
                  </Link>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-3 rounded-xl hover:bg-gray-100/60 transition-all duration-300 hover:scale-110"
              >
                {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-300/30 pt-4 animate-fadeInSlow">
              <nav className="flex flex-col space-y-4">
                <Link
                  to="/"
                  className="text-gray-700 font-medium py-2 transition-all duration-300 hover:text-[#A4C3B2] hover:translate-x-3"
                >
                  Beranda
                </Link>
                <button
                  onClick={() => {
                    handleOpenSidebar('kategori');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-gray-700 font-medium py-2 text-left transition-all duration-300 hover:text-[#A4C3B2] hover:translate-x-3"
                >
                  Kategori
                </button>
                <button
                  onClick={() => {
                    handleJualBarang();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-gray-700 font-medium py-2 text-left transition-all duration-300 hover:text-[#A4C3B2] hover:translate-x-3"
                >
                  Jual Barang
                </button>

                {currentUser ? (
                  <>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-gray-700 flex items-center font-medium py-2 transition-all duration-300 hover:text-[#A4C3B2] hover:translate-x-3"
                    >
                      <MessageSquare size={18} className="mr-2" />
                      Pesan (3)
                    </button>
                    <Link
                      to="/profile"
                      className="flex items-center justify-center space-x-2 text-white px-5 py-2.5 rounded-2xl bg-[#A4C3B2]/90 backdrop-blur-xl transition-all duration-300 hover:opacity-95 hover:scale-110"
                    >
                      <User size={18} />
                      <span>Profil</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center space-x-2 text-red-600 px-5 py-2.5 rounded-xl transition-all duration-300 hover:bg-red-50 hover:scale-110"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-center py-2 text-gray-700 font-medium transition-all duration-300 hover:text-[#A4C3B2] hover:translate-x-3"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center justify-center space-x-2 text-white px-5 py-2.5 rounded-2xl bg-[#A4C3B2]/90 backdrop-blur-xl transition-all duration-300 hover:opacity-95 hover:scale-110"
                    >
                      <User size={18} />
                      <span>Daftar</span>
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}

          <div className="mt-5 animate-fadeInSlow">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari barang, buku, kost, elektronik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border-2 border-[#A4C3B2] rounded-2xl bg-white/70 backdrop-blur-xl focus:outline-none transition-all duration-300 focus:border-[#8AB3A2] focus:shadow-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-300 hover:scale-125"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>




      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 animate-fadeIn"
          onClick={handleCloseSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {sidebarMode === 'kategori' ? 'Pilih Kategori' : 'Mulai Berjualan'}
            </h2>
            <button
              onClick={handleCloseSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:scale-110"
            >
              <X size={24} className="text-gray-700" />
            </button>
          </div>

          {sidebarMode === 'kategori' && (
            <div className="space-y-3">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.name}
                    onClick={() => handleSelectCategory(category.name)}
                    className={`w-full p-4 rounded-lg transition-all duration-300 flex items-center space-x-3 hover:shadow-md hover:scale-105 ${selectedCategory === category.name
                      ? 'text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    style={selectedCategory === category.name ? { backgroundColor: '#A4C3B2' } : {}}
                  >
                    <Icon size={24} />
                    <div className="text-left flex-1">
                      <p className="font-semibold text-sm">{category.name}</p>
                      <p className="text-xs opacity-75">{category.count} items</p>
                    </div>
                    {selectedCategory === category.name && <ChevronRight size={20} />}
                  </button>
                );
              })}
            </div>
          )}

          {sidebarMode === 'jual' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br p-6 rounded-lg text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #A4C3B2 0%, #8fb3a0 100%)' }}>
                <h3 className="text-xl font-bold mb-2">Jual Barang Kamu</h3>
                <p className="text-sm opacity-90 mb-4">Dapatkan uang tambahan dengan menjual barang bekas Anda di CampusMarket</p>
                <ul className="space-y-2 text-sm mb-4">
                  <li>✓ Gratis untuk semua mahasiswa</li>
                  <li>✓ Proses verifikasi cepat</li>
                  <li>✓ Pembayaran aman</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  if (!currentUser) {
                    navigate('/login');
                  } else {
                    navigate('/jual');
                  }
                  handleCloseSidebar();
                }}
                className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                style={{ backgroundColor: '#A4C3B2' }}
              >
                <span>Mulai Posting Produk</span>
                <ChevronRight size={20} />
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-md">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Tips Penjualan</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Gunakan foto produk yang jelas</li>
                  <li>• Deskripsikan kondisi dengan detail</li>
                  <li>• Atur harga kompetitif</li>
                  <li>• Respond cepat terhadap pembeli</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hero Section - Hidden when searching */}
      {!searchQuery && (
        <section className="container mx-auto px-4 py-8">
          <div className="rounded-2xl p-8 md:p-12 text-white shadow-xl transition-all duration-300 hover:shadow-2xl" style={{ backgroundColor: '#A4C3B2' }}>
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fadeIn">
                Jual Beli Barang Bekas Mahasiswa
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Platform marketplace eksklusif untuk mahasiswa. Aman, mudah, dan terpercaya untuk jual beli buku, elektronik, kost, dan lainnya.
              </p>
              <button
                onClick={handleJualBarang}
                className="bg-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                style={{ color: '#A4C3B2' }}
              >
                <span>Mulai Jual Barang</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Categories - Hidden when searching */}
      {!searchQuery && (
        <section className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Kategori Populer</h3>
            <button
              onClick={() => handleOpenSidebar('kategori')}
              className="md:hidden text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: '#A4C3B2' }}
            >
              Lihat Semua
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => handleSelectCategory(category.name)}
                  className={`p-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 ${selectedCategory === category.name
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  style={selectedCategory === category.name ? { backgroundColor: '#A4C3B2' } : {}}
                >
                  <Icon size={32} className="mx-auto mb-3 transition-transform duration-300 hover:scale-110" />
                  <p className="font-semibold">{category.name}</p>
                  <p className={`text-sm mt-1 ${selectedCategory === category.name ? 'text-white' : 'text-gray-500'}`}>
                    {category.count} items
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Filter Section */}
      <section className="container mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-lg p-4 transition-all duration-300 hover:shadow-xl">
          {/* Filter Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:opacity-90 hover:scale-105"
              style={{ backgroundColor: '#A4C3B2', color: 'white' }}
            >
              <Filter size={20} />
              <span>Filter & Urutkan</span>
              <ChevronDown
                size={20}
                className={`transform transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-all duration-300 hover:scale-105"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Filter Content */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Price Range */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <DollarSign size={16} style={{ color: '#A4C3B2' }} />
                    <span>Rentang Harga</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm transition-all duration-300 focus:border-[#A4C3B2] focus:shadow-md"
                      style={{ borderColor: '#A4C3B2' }}
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm transition-all duration-300 focus:border-[#A4C3B2] focus:shadow-md"
                      style={{ borderColor: '#A4C3B2' }}
                    />
                  </div>
                </div>

                {/* Condition Filter */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Package size={16} style={{ color: '#A4C3B2' }} />
                    <span>Kondisi Barang</span>
                  </label>
                  <select
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm transition-all duration-300 focus:border-[#A4C3B2] focus:shadow-md"
                    style={{ borderColor: '#A4C3B2' }}
                  >
                    <option value="Semua">Semua Kondisi</option>
                    <option value="Baru">Baru</option>
                    <option value="Bekas">Bekas</option>
                  </select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <TrendingUp size={16} style={{ color: '#A4C3B2' }} />
                    <span>Urutkan</span>
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm transition-all duration-300 focus:border-[#A4C3B2] focus:shadow-md"
                    style={{ borderColor: '#A4C3B2' }}
                  >
                    <option value="terbaru">Terbaru</option>
                    <option value="termurah">Harga Terendah</option>
                    <option value="termahal">Harga Tertinggi</option>
                  </select>
                </div>

                {/* Negotiable Filter */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                    <Tag size={16} style={{ color: '#A4C3B2' }} />
                    <span>Opsi Tambahan</span>
                  </label>
                  <label className="flex items-center space-x-2 px-3 py-2 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-300 hover:shadow-md"
                    style={{ borderColor: '#A4C3B2' }}
                  >
                    <input
                      type="checkbox"
                      checked={isNegotiable}
                      onChange={(e) => setIsNegotiable(e.target.checked)}
                      className="w-4 h-4 rounded transition-all duration-300"
                      style={{ accentColor: '#A4C3B2' }}
                    />
                    <span className="text-sm text-gray-700">Bisa Nego Saja</span>
                  </label>
                </div>

              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="pt-4 border-t animate-fadeIn">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Filter Aktif:</p>
                  <div className="flex flex-wrap gap-2">
                    {priceRange.min && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium text-white transition-all duration-300 hover:scale-105" style={{ backgroundColor: '#A4C3B2' }}>
                        Min: Rp {Number(priceRange.min).toLocaleString('id-ID')}
                      </span>
                    )}
                    {priceRange.max && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium text-white transition-all duration-300 hover:scale-105" style={{ backgroundColor: '#A4C3B2' }}>
                        Max: Rp {Number(priceRange.max).toLocaleString('id-ID')}
                      </span>
                    )}
                    {selectedCondition !== 'Semua' && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium text-white transition-all duration-300 hover:scale-105" style={{ backgroundColor: '#A4C3B2' }}>
                        {selectedCondition}
                      </span>
                    )}
                    {isNegotiable && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium text-white transition-all duration-300 hover:scale-105" style={{ backgroundColor: '#A4C3B2' }}>
                        Bisa Nego
                      </span>
                    )}
                    {sortBy !== 'terbaru' && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium text-white transition-all duration-300 hover:scale-105" style={{ backgroundColor: '#A4C3B2' }}>
                        {sortBy === 'termurah' ? 'Termurah' : 'Termahal'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {searchQuery ? (
              <>
                Hasil Pencarian: "{searchQuery}"
                <span className="text-base font-normal text-gray-600 ml-2">
                  ({filteredProducts.length} produk)
                </span>
              </>
            ) : selectedCategory === 'Semua' ? (
              'Barang Terbaru'
            ) : (
              `Kategori: ${selectedCategory}`
            )}
          </h3>
          {!searchQuery && !hasActiveFilters && (
            <div className="hidden sm:flex items-center space-x-2 text-gray-600">
              <TrendingUp size={20} />
              <span className="text-sm font-medium">Paling Populer</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <Search size={64} className="mx-auto mb-4 text-gray-400 animate-pulse" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Tidak ada produk ditemukan</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? `Tidak ada hasil untuk "${searchQuery}"`
                  : 'Belum ada produk di kategori ini'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: '#A4C3B2' }}
                >
                  Hapus Pencarian
                </button>
              )}
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer hover:scale-105">
                <div className="relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-300"
                    onClick={() => navigate(`/product/${product.id}`)}
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.condition === 'Baru'
                      ? 'bg-green-500 text-white'
                      : 'bg-yellow-500 text-white'
                      } transition-all duration-300 hover:scale-110`}>
                      {product.condition}
                    </span>
                  </div>
                  {product.negotiable && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold text-white transition-all duration-300 hover:scale-110" style={{ backgroundColor: '#A4C3B2' }}>
                        Nego
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-lg flex items-center space-x-1 text-xs transition-all duration-300 hover:bg-opacity-80">
                    <Eye size={12} />
                    <span>{product.views}</span>
                  </div>
                </div>

                <div className="p-3">
                  <h4 className="font-bold text-sm text-gray-800 mb-2 line-clamp-2 hover:text-[#A4C3B2] transition-colors duration-300">
                    {product.name}
                  </h4>
                  <p className="text-lg font-bold mb-2 transition-colors duration-300" style={{ color: '#A4C3B2' }}>
                    {product.price}
                  </p>

                  <div className="flex flex-col text-xs text-gray-600 mb-2 space-y-1">
                    <div className="flex items-center space-x-1">
                      <Home size={12} />
                      <span className="truncate">{product.location}</span>
                    </div>
                    <span className="text-gray-500 truncate">{product.seller}</span>
                  </div>

                  <button
                    onClick={() => handleChatSeller(product)}
                    className="w-full text-white py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:opacity-90 hover:scale-105 flex items-center justify-center space-x-2"
                    style={{ backgroundColor: '#A4C3B2' }}
                  >
                    <MessageSquare size={16} />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-gradient-to-br from-[#A4C3B2] via-[#B8D4C0] to-[#EEC6CA] text-gray-800 py-16 mt-12 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full animate-pulse" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="animatedGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="#ffffff" opacity="0.5">
                  <animate attributeName="r" values="1;2;1" dur="3s" repeatCount="indefinite" />
                </circle>
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#animatedGrid)" />
          </svg>
        </div>

        {/* Floating Elements for Wow Effect */}
        <div className="absolute top-10 left-10 animate-bounce">
          <svg className="w-6 h-6 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.84L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.84l-7-3z" />
          </svg>
        </div>
        <div className="absolute bottom-10 right-10 animate-ping">
          <svg className="w-8 h-8 text-white opacity-30" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Top Stats Section for Wow Factor */}
          <div className="text-center mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                <div className="text-4xl font-bold text-white mb-2">500+</div>
                <p className="text-gray-700 font-semibold">Mahasiswa Terdaftar</p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                <div className="text-4xl font-bold text-white mb-2">1,200+</div>
                <p className="text-gray-700 font-semibold">Barang Dijual</p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                <div className="text-4xl font-bold text-white mb-2">98%</div>
                <p className="text-gray-700 font-semibold">Kepuasan Pengguna</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand Section with Enhanced Design */}
            <div className="text-center md:text-left">
              <h4 className="font-bold text-2xl mb-4 flex items-center justify-center md:justify-start animate-fadeIn">
                <svg className="w-10 h-10 mr-3 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.84L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.84l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                CampusMarket
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                Platform marketplace eksklusif untuk mahasiswa. Jual beli barang bekas dengan aman dan mudah.
              </p>
              {/* Newsletter Signup */}
              <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg p-4 shadow-md">
                <p className="text-gray-700 font-semibold mb-2">Dapatkan Update Terbaru</p>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Email Anda"
                    className="flex-1 px-3 py-2 rounded-l-lg border-none focus:outline-none text-gray-800"
                  />
                  <button className="bg-[#A4C3B2] text-white px-4 py-2 rounded-r-lg hover:bg-opacity-90 transition">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Section with Hover Effects */}
            <div className="text-center md:text-left">
              <h4 className="font-bold text-lg mb-4">Navigasi</h4>
              <ul className="space-y-3 text-gray-700 text-sm">
                <li>
                  <Link to="/" className="hover:text-white hover:scale-105 transition-all duration-300 flex items-center justify-center md:justify-start group">
                    <svg className="w-4 h-4 mr-2 group-hover:animate-spin" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-6 6a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-6-6z" />
                    </svg>
                    Beranda
                  </Link>
                </li>
                <li>
                  <button onClick={() => handleOpenSidebar('kategori')} className="hover:text-white hover:scale-105 transition-all duration-300 bg-transparent border-none cursor-pointer flex items-center justify-center md:justify-start w-full text-left group">
                    <svg className="w-4 h-4 mr-2 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Kategori
                  </button>
                </li>
                <li>
                  <button onClick={handleJualBarang} className="hover:text-white hover:scale-105 transition-all duration-300 bg-transparent border-none cursor-pointer flex items-center justify-center md:justify-start w-full text-left group">
                    <svg className="w-4 h-4 mr-2 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    Jual Barang
                  </button>
                </li>
                <li>
                  <a href="#bantuan" className="hover:text-white hover:scale-105 transition-all duration-300 flex items-center justify-center md:justify-start group">
                    <svg className="w-4 h-4 mr-2 group-hover:animate-spin" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    Bantuan
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Section with Social Links */}
            <div className="text-center md:text-left">
              <h4 className="font-bold text-lg mb-4">Kontak</h4>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Email: <a href="mailto:support@campusmarket.ac.id" className="hover:text-white transition duration-300 font-semibold">campusmarket.pnl@gmail.com</a><br />
                Khusus mahasiswa terdaftar
              </p>
              {/* Enhanced Social Media Icons */}
              <div className="mt-4 flex justify-center md:justify-start space-x-4">
                <a href="#" className="text-gray-600 hover:text-white hover:scale-110 transition-all duration-300 transform">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-white hover:scale-110 transition-all duration-300 transform">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-white hover:scale-110 transition-all duration-300 transform">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.017 0H7.99C3.58 0 0 3.58 0 7.99v4.02c0 4.41 3.58 7.99 7.99 7.99h4.027c4.41 0 7.99-3.58 7.99-7.99V7.99C20.007 3.58 16.427 0 12.017 0zm5.17 12.01c0 2.85-2.32 5.17-5.17 5.17H7.99c-2.85 0-5.17-2.32-5.17-5.17V7.99c0-2.85 2.32-5.17 5.17-5.17h4.027c2.85 0 5.17 2.32 5.17 5.17v4.02z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M10 5.38a4.62 4.62 0 100 9.24 4.62 4.62 0 000-9.24zM10 12a2 2 0 110-4 2 2 0 010 4zm4.8-5.8a1.1 1.1 0 100-2.2 1.1 1.1 0 000 2.2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
            © 2025 CampusMarket. Platform Marketplace Mahasiswa. | Dibuat dengan ❤️ untuk mahasiswa.
          </div>
        </div>
      </footer>


      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <style jsx>{`
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-float-delayed {
    animation: float 3s ease-in-out infinite;
    animation-delay: 1s;
  }
`}</style>
    </div>
  );
}