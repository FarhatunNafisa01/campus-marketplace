import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, MessageSquare, User, ChevronRight, Book, Laptop, Home, Utensils, TrendingUp, Eye, Menu, X, LogOut } from 'lucide-react';
import { getProducts, getAuthUser, isAuthenticated, logout } from '../services/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const categories = [
    { name: 'Semua', icon: ShoppingBag, count: 234 },
    { name: 'Buku', icon: Book, count: 89 },
    { name: 'Elektronik', icon: Laptop, count: 45 },
    { name: 'Kost', icon: Home, count: 28 },
    { name: 'Lainnya', icon: Utensils, count: 72 }
  ];

  // Fetch products dan cek user saat component dimuat
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
      
      // Transform data dari database ke format yang dibutuhkan
      const transformedData = response.data.map(product => ({
        id: product.id_produk,
        name: product.nama_barang,
        price: `Rp ${Number(product.harga).toLocaleString('id-ID')}`,
        condition: product.kondisi === 'bekas' ? 'Bekas' : 'Baru',
        location: product.lokasi,
        image: product.url_foto || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400',
        seller: product.nama_penjual,
        views: product.jumlah_dilihat,
        negotiable: product.bisa_nego,
        category: product.nama_kategori
      }));
      
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

  const handleChatSeller = () => {
    if (!currentUser) {
      // Jika belum login, redirect ke login
      navigate('/login');
    } else {
      // Jika sudah login, tampilkan pesan (nanti bisa diganti dengan fitur chat)
      alert('Fitur chat akan segera hadir!');
    }
  };

  const handleJualBarang = () => {
    if (!currentUser) {
      navigate('/login');
    } else {
      // Navigate ke halaman posting produk (coming soon)
      alert('Fitur posting produk akan segera hadir!');
    }
  };

  const filteredProducts = selectedCategory === 'Semua' 
    ? featuredProducts 
    : featuredProducts.filter(p => p.category === selectedCategory);

  // Loading state
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

  // Error state
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
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: '#A4C3B2' }}>
                <ShoppingBag className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">CampusMarket</h1>
                <p className="text-xs text-gray-500">Marketplace Mahasiswa</p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-gray-700 transition font-medium hover:text-opacity-80" style={{ color: '#A4C3B2' }}>Beranda</Link>
              <a href="#kategori" className="text-gray-700 transition font-medium hover:opacity-80">Kategori</a>
              <a href="#jual" className="text-gray-700 transition font-medium hover:opacity-80">Jual Barang</a>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <>
                  {/* User sudah login */}
                  <button className="relative p-2 hover:bg-gray-100 rounded-full transition hidden sm:block">
                    <MessageSquare size={22} className="text-gray-700" />
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                  </button>
                  <Link to="/profile" className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg transition hover:opacity-90" style={{ backgroundColor: '#A4C3B2' }}>
                    <User size={18} />
                    <span className="hidden sm:inline">{currentUser.nama.split(' ')[0]}</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="hidden sm:flex items-center space-x-2 text-red-600 hover:text-red-700 transition p-2 rounded-lg hover:bg-red-50"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </>
              ) : (
                <>
                  {/* User belum login */}
                  <Link to="/login" className="hidden sm:inline text-gray-700 hover:opacity-80 font-medium">
                    Login
                  </Link>
                  <Link to="/register" className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg transition hover:opacity-90" style={{ backgroundColor: '#A4C3B2' }}>
                    <User size={18} />
                    <span>Daftar</span>
                  </Link>
                </>
              )}
              
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t pt-4">
              <nav className="flex flex-col space-y-3">
                <Link to="/" className="transition font-medium py-2" style={{ color: '#A4C3B2' }}>Beranda</Link>
                <a href="#kategori" className="text-gray-700 transition font-medium py-2 hover:opacity-80">Kategori</a>
                <a href="#jual" className="text-gray-700 transition font-medium py-2 hover:opacity-80">Jual Barang</a>
                
                {currentUser ? (
                  <>
                    <a href="#pesan" className="text-gray-700 transition font-medium py-2 flex items-center hover:opacity-80">
                      <MessageSquare size={18} className="mr-2" />
                      Pesan (3)
                    </a>
                    <Link to="/profile" className="flex items-center justify-center space-x-2 text-white px-4 py-2 rounded-lg transition" style={{ backgroundColor: '#A4C3B2' }}>
                      <User size={18} />
                      <span>Profil</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center justify-center space-x-2 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition font-medium"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-center py-2 text-gray-700 font-medium hover:opacity-80">
                      Login
                    </Link>
                    <Link to="/register" className="flex items-center justify-center space-x-2 text-white px-4 py-2 rounded-lg transition" style={{ backgroundColor: '#A4C3B2' }}>
                      <User size={18} />
                      <span>Daftar</span>
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari barang, buku, kost, elektronik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition focus:border-opacity-100" 
                style={{ borderColor: '#A4C3B2' }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="rounded-2xl p-8 md:p-12 text-white shadow-xl" style={{ backgroundColor: '#A4C3B2' }}>
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Jual Beli Barang Bekas Mahasiswa
            </h2>
            <p className="text-lg mb-6">
              Platform marketplace eksklusif untuk mahasiswa. Aman, mudah, dan terpercaya untuk jual beli buku, elektronik, kost, dan lainnya.
            </p>
            <button 
              onClick={handleJualBarang}
              className="bg-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition flex items-center space-x-2" 
              style={{ color: '#A4C3B2' }}
            >
              <span>Mulai Jual Barang</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="kategori" className="container mx-auto px-4 py-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Kategori Populer</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`p-6 rounded-xl transition-all ${
                  selectedCategory === category.name
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:shadow-md hover:scale-102'
                }`}
                style={selectedCategory === category.name ? { backgroundColor: '#A4C3B2' } : {}}
              >
                <Icon size={32} className="mx-auto mb-3" />
                <p className="font-semibold">{category.name}</p>
                <p className={`text-sm mt-1 ${selectedCategory === category.name ? 'text-white' : 'text-gray-500'}`}>
                  {category.count} items
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {selectedCategory === 'Semua' ? 'Barang Terbaru' : `Kategori: ${selectedCategory}`}
          </h3>
          <div className="hidden sm:flex items-center space-x-2 text-gray-600">
            <TrendingUp size={20} />
            <span className="text-sm font-medium">Paling Populer</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group cursor-pointer">
              <div className="relative overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    product.condition === 'Baru' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {product.condition}
                  </span>
                </div>
                {product.negotiable && (
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#A4C3B2' }}>
                      Bisa Nego
                    </span>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded-lg flex items-center space-x-1 text-xs">
                  <Eye size={12} />
                  <span>{product.views}</span>
                </div>
              </div>
              
              <div className="p-4">
                <h4 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 hover:opacity-80 transition">
                  {product.name}
                </h4>
                <p className="text-2xl font-bold mb-3" style={{ color: '#A4C3B2' }}>
                  {product.price}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-1">
                    <Home size={14} />
                    <span>{product.location}</span>
                  </div>
                  <span className="text-gray-500 truncate ml-2">• {product.seller}</span>
                </div>

                <button 
                  onClick={handleChatSeller}
                  className="w-full text-white py-2 rounded-lg font-semibold transition hover:opacity-90 flex items-center justify-center space-x-2" 
                  style={{ backgroundColor: '#A4C3B2' }}
                >
                  <MessageSquare size={18} />
                  <span>Chat Penjual</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

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