import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Home } from 'lucide-react';
import { login, isAuthenticated } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // Untuk animasi masuk

  // Redirect jika sudah login
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  // Animasi masuk saat komponen mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error saat user mulai mengetik
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi client-side
    if (!formData.email || !formData.password) {
      setError('Email dan password harus diisi');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Format email tidak valid');
      return;
    }

    setLoading(true);

    try {
      const response = await login(formData.email, formData.password);

      // Simpan token dan user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Jika remember me, simpan ke localStorage yang persistent
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Redirect ke home
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);

      // Handle berbagai jenis error
      if (err.response) {
        // Error dari backend
        if (err.response.status === 401) {
          setError('Email atau password salah');
        } else if (err.response.status === 500) {
          setError('Server error. Coba lagi nanti.');
        } else {
          setError(err.response?.data?.message || 'Login gagal. Coba lagi.');
        }
      } else if (err.request) {
        // Request dibuat tapi tidak ada response
        setError('Tidak dapat terhubung ke server. Pastikan backend sudah running.');
      } else {
        setError('Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #EEC6CA 0%, #F8E5E5 50%, #EEC6CA 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Background Particles untuk efek wow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-16 h-16 bg-white opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-20 w-12 h-12 bg-white opacity-5 rounded-full animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-10 h-10 bg-white opacity-8 rounded-full animate-ping"></div>
      </div>

      <div className={`max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Gambar Samping dengan Filter dan Animasi */}
        <div className={`hidden lg:block lg:w-1/2 relative transition-all duration-1000 ease-out ${isVisible ? 'translate-x-0' : '-translate-x-full'}`}>
          <img
            src="/images/login-illustration.jpg" // Ganti dengan path gambar Anda
            alt="CampusMarket Illustration"
            className="w-full h-full object-cover filter brightness-110 contrast-105 saturate-110"
            style={{ filter: 'brightness(1.1) contrast(1.05) saturate(1.1)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black to-black opacity-40"></div>
          <div className={`absolute bottom-8 left-8 text-white transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
            <h3 className="text-xl font-bold mb-2 drop-shadow-lg">Temukan Barang Bekas Berkualitas</h3>
            <p className="text-base opacity-90 drop-shadow-md">Di CampusMarket, jual beli barang mahasiswa jadi lebih mudah dan menyenangkan.</p>
          </div>
        </div>

        {/* Form Login dengan Animasi */}
        <div className={`w-full lg:w-1/2 p-8 flex flex-col justify-center transition-all duration-1000 ease-out delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className={`flex justify-center mb-4 transition-all duration-1000 delay-700 ${isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
              <div className="p-4 rounded-2xl shadow-xl transform hover:scale-110 transition-transform duration-500" style={{ background: 'linear-gradient(135deg, #A4C3B2 0%, #B8D4C0 100%)' }}>
                <ShoppingBag className="text-white animate-pulse" size={40} />
              </div>
            </div>
            <h2 className={`text-3xl font-extrabold text-gray-800 mb-2 transition-all duration-1000 delay-800 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>Selamat Datang Kembali</h2>
            <p className={`text-base text-gray-600 transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>Login ke akun CampusMarket Anda</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className={`mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3 animate-bounce transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className={`transition-all duration-1000 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Mahasiswa
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-300" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama.mahasiswa@student.pnl.ac.id"
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 text-base ${error && !formData.email ? 'border-red-300 shadow-red-200' : 'border-gray-200 shadow-gray-100'
                    } hover:shadow-lg focus:shadow-xl hover:border-green-400`}
                  style={{
                    focusBorderColor: '#A4C3B2',
                    borderColor: error && !formData.email ? '#FCA5A5' : undefined
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#A4C3B2'}
                  onBlur={(e) => e.target.style.borderColor = error && !formData.email ? '#FCA5A5' : '#E5E7EB'}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className={`transition-all duration-1000 delay-1100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-300" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  className={`w-full pl-12 pr-12 py-3 border-2 rounded-lg focus:outline-none transition-all duration-300 text-base ${error && !formData.password ? 'border-red-300 shadow-red-200' : 'border-gray-200 shadow-gray-100'
                    } hover:shadow-lg focus:shadow-xl hover:border-green-400`}
                  style={{
                    focusBorderColor: '#A4C3B2',
                    borderColor: error && !formData.password ? '#FCA5A5' : undefined
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#A4C3B2'}
                  onBlur={(e) => e.target.style.borderColor = error && !formData.password ? '#FCA5A5' : '#E5E7EB'}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className={`flex items-center justify-between text-sm transition-all duration-1000 delay-1200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 rounded cursor-pointer w-4 h-4"
                  style={{ accentColor: '#A4C3B2' }}
                  disabled={loading}
                />
                <span className="text-gray-600 select-none font-medium">Ingat saya</span>
              </label>
              <Link
                to="/forgot-password"
                className="font-bold hover:underline transition-colors duration-200 text-base hover:text-green-600"
                style={{ color: '#A4C3B2' }}
              >
                Lupa password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-1000 delay-1300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}
              style={{ background: 'linear-gradient(135deg, #A4C3B2 0%, #B8D4C0 100%)' }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="text-base">Memproses...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span className="text-base">Login</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className={`relative my-6 transition-all duration-1000 delay-1400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">atau</span>
            </div>
          </div>

          {/* Register Link */}
          <div className={`text-center transition-all duration-1000 delay-1500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
            <p className="text-gray-600 text-base">
              Belum punya akun?{' '}
              <Link
                to="/register"
                className="font-bold hover:underline transition-colors duration-200 text-base hover:text-green-600"
                style={{ color: '#A4C3B2' }}
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Back to Home - Desain Estetik */}
      <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-1600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
        <Link
          to="/"
          className="bg-white bg-opacity-90 backdrop-blur-sm border border-gray-200 rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-opacity-100 hover:scale-105 flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium text-sm"
        >
          <Home size={18} className="text-gray-500" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Demo Accounts Info - Dipindah ke bawah dan lebih kecil */}
      <div className={`absolute bottom-6 right-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 shadow-lg transition-all duration-1000 delay-1700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
        <p className="text-sm font-bold text-blue-800 mb-2">💡 Demo Account:</p>
        <p className="text-xs text-blue-700">
          <strong>Email:</strong> budi.santoso@student.pnl.ac.id<br />
          <strong>Password:</strong> password123
        </p>
      </div>

      {/* Custom CSS untuk animasi tambahan */}
      <style jsx>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in-left {
          animation: slideInLeft 1s ease-out;
        }
        .animate-slide-in-right {
          animation: slideInRight 1s ease-out;
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out;
        }
      `}</style>
    </div>
  );
}