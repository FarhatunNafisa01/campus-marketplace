import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
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

  // Redirect jika sudah login
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#EEC6CA' }}>
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl shadow-lg" style={{ backgroundColor: '#A4C3B2' }}>
              <ShoppingBag className="text-white" size={40} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Selamat Datang Kembali</h2>
          <p className="mt-2 text-gray-600">Login ke akun CampusMarket Anda</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3 animate-shake">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Mahasiswa
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama.mahasiswa@student.pnl.ac.id"
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none transition ${error && !formData.email ? 'border-red-300' : 'border-gray-200'
                    }`}
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  className={`w-full pl-11 pr-12 py-3 border-2 rounded-lg focus:outline-none transition ${error && !formData.password ? 'border-red-300' : 'border-gray-200'
                    }`}
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 rounded cursor-pointer"
                  style={{ accentColor: '#A4C3B2' }}
                  disabled={loading}
                />
                <span className="text-gray-600 select-none">Ingat saya</span>
              </label>
              <Link
                to="/forgot-password"
                className="font-semibold hover:underline transition"
                style={{ color: '#A4C3B2' }}
              >
                Lupa password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md"
              style={{ backgroundColor: '#A4C3B2' }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">atau</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Belum punya akun?{' '}
              <Link
                to="/register"
                className="font-semibold hover:underline transition"
                style={{ color: '#A4C3B2' }}
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-gray-600 hover:text-gray-800 font-medium transition inline-flex items-center space-x-1"
          >
            <span>←</span>
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Demo Accounts Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-800 mb-2">💡 Demo Account:</p>
          <p className="text-xs text-blue-700">
            <strong>Email:</strong> budi.santoso@student.pnl.ac.id<br />
            <strong>Password:</strong> password123
          </p>
        </div>
      </div>

      {/* Custom CSS untuk animasi */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}