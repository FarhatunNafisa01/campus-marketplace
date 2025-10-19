import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Mail, Lock, User, BookOpen, Phone, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { register, isAuthenticated } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
    nim: '',
    no_telp: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirect jika sudah login
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  // Cek kekuatan password
  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 6) strength++;
      if (/[a-z]/.test(formData.password)) strength++;
      if (/[A-Z]/.test(formData.password)) strength++;
      if (/[0-9]/.test(formData.password)) strength++;
      if (/[^a-zA-Z0-9]/.test(formData.password)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear error untuk field yang sedang diubah
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
    setError('');
  };

  const validateForm = () => {
    const newErrors = {};

    // Validasi nama
    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama wajib diisi';
    } else if (formData.nama.trim().length < 3) {
      newErrors.nama = 'Nama minimal 3 karakter';
    }

    // Validasi NIM
    if (!formData.nim) {
      newErrors.nim = 'NIM wajib diisi';
    } else if (formData.nim.length < 8) {
      newErrors.nim = 'NIM minimal 8 karakter';
    }

    // Validasi email dengan format khusus
    if (!formData.email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[a-z_]+\d{3}@student\.pnl\.ac\.id$/.test(formData.email)) {
      newErrors.email = 'Format: nama_lengkap + 3 digit terakhir NIM (contoh: farhatun_nafisa016@student.pnl.ac.id)';
    } else {
      // Cek apakah 3 digit terakhir email cocok dengan NIM
      const emailMatch = formData.email.match(/(\d{3})@student\.pnl\.ac\.id$/);
      if (emailMatch && formData.nim) {
        const last3DigitsNIM = formData.nim.slice(-3);
        const last3DigitsEmail = emailMatch[1];
        
        if (last3DigitsNIM !== last3DigitsEmail) {
          newErrors.email = `3 digit terakhir email (${last3DigitsEmail}) harus sama dengan 3 digit terakhir NIM (${last3DigitsNIM})`;
        }
      }

      // Cek apakah nama cocok dengan email
      if (formData.nama && !newErrors.email) {
        const namaFormatted = formData.nama.toLowerCase().trim().replace(/\s+/g, '_');
        const emailPrefix = formData.email.split(/\d{3}@/)[0]; // ambil bagian sebelum 3 digit
        
        if (!emailPrefix.includes(namaFormatted.split('_')[0])) {
          newErrors.email = 'Email harus mengandung nama Anda (gunakan underscore untuk spasi)';
        }
      }
    }

    // Validasi nomor telepon
    if (!formData.no_telp) {
      newErrors.no_telp = 'Nomor telepon wajib diisi';
    } else if (!/^(\+62|62|0)[0-9]{9,12}$/.test(formData.no_telp.replace(/[\s-]/g, ''))) {
      newErrors.no_telp = 'Format nomor telepon tidak valid (contoh: 081234567890)';
    }

    // Validasi password
    if (!formData.password) {
      newErrors.password = 'Password wajib diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password harus mengandung huruf kecil';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password harus mengandung huruf besar';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password harus mengandung angka';
    }

    // Validasi konfirmasi password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password wajib diisi';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await register(registerData);
      
      // Simpan token dan user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect ke home
      navigate('/');
    } catch (err) {
      console.error('Register error:', err);
      
      if (err.response) {
        // Error dari backend
        if (err.response.status === 409) {
          setError('Email atau NIM sudah terdaftar');
        } else if (err.response.status === 400) {
          // Handle validation errors dari backend
          if (err.response.data.errors) {
            const newErrors = {};
            err.response.data.errors.forEach(error => {
              newErrors[error.param] = error.msg;
            });
            setErrors(newErrors);
          } else {
            setError(err.response.data.message || 'Data tidak valid');
          }
        } else if (err.response.status === 500) {
          setError('Server error. Coba lagi nanti.');
        } else {
          setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
        }
      } else if (err.request) {
        setError('Tidak dapat terhubung ke server. Pastikan backend sudah running.');
      } else {
        setError('Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return '#EF4444'; // red
    if (passwordStrength <= 2) return '#F59E0B'; // orange
    if (passwordStrength <= 3) return '#EAB308'; // yellow
    if (passwordStrength <= 4) return '#84CC16'; // lime
    return '#22C55E'; // green
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Sangat Lemah';
    if (passwordStrength <= 2) return 'Lemah';
    if (passwordStrength <= 3) return 'Cukup';
    if (passwordStrength <= 4) return 'Kuat';
    return 'Sangat Kuat';
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
          <h2 className="text-3xl font-bold text-gray-800">Daftar Akun Baru</h2>
          <p className="mt-2 text-gray-600">Bergabung dengan CampusMarket</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Global Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3 animate-shake">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                    errors.nama ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  style={{ 
                    borderColor: errors.nama ? '#FCA5A5' : undefined,
                    focusBorderColor: '#A4C3B2'
                  }}
                  onFocus={(e) => !errors.nama && (e.target.style.borderColor = '#A4C3B2')}
                  onBlur={(e) => !errors.nama && (e.target.style.borderColor = '#E5E7EB')}
                  disabled={loading}
                />
              </div>
              {errors.nama && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle size={14} />
                  <span>{errors.nama}</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Mahasiswa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama.mahasiswa@student.pnl.ac.id"
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  onFocus={(e) => !errors.email && (e.target.style.borderColor = '#A4C3B2')}
                  onBlur={(e) => !errors.email && (e.target.style.borderColor = '#E5E7EB')}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle size={14} />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* NIM */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                NIM <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="nim"
                  value={formData.nim}
                  onChange={handleChange}
                  placeholder="2021050123"
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                    errors.nim ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  onFocus={(e) => !errors.nim && (e.target.style.borderColor = '#A4C3B2')}
                  onBlur={(e) => !errors.nim && (e.target.style.borderColor = '#E5E7EB')}
                  disabled={loading}
                />
              </div>
              {errors.nim && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle size={14} />
                  <span>{errors.nim}</span>
                </p>
              )}
            </div>

            {/* No Telepon */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nomor Telepon <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  name="no_telp"
                  value={formData.no_telp}
                  onChange={handleChange}
                  placeholder="081234567890"
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none transition ${
                    errors.no_telp ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  onFocus={(e) => !errors.no_telp && (e.target.style.borderColor = '#A4C3B2')}
                  onBlur={(e) => !errors.no_telp && (e.target.style.borderColor = '#E5E7EB')}
                  disabled={loading}
                />
              </div>
              {errors.no_telp && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle size={14} />
                  <span>{errors.no_telp}</span>
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">Contoh: 081234567890 atau +6281234567890</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  className={`w-full pl-11 pr-12 py-3 border-2 rounded-lg focus:outline-none transition ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  onFocus={(e) => !errors.password && (e.target.style.borderColor = '#A4C3B2')}
                  onBlur={(e) => !errors.password && (e.target.style.borderColor = '#E5E7EB')}
                  disabled={loading}
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
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Kekuatan Password:</span>
                    <span className="text-xs font-semibold" style={{ color: getPasswordStrengthColor() }}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    />
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle size={14} />
                  <span>{errors.password}</span>
                </p>
              )}
              
              <p className="mt-1 text-xs text-gray-500">
                Password harus mengandung huruf besar, huruf kecil, dan angka
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Konfirmasi Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi password"
                  className={`w-full pl-11 pr-12 py-3 border-2 rounded-lg focus:outline-none transition ${
                    errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  onFocus={(e) => !errors.confirmPassword && (e.target.style.borderColor = '#A4C3B2')}
                  onBlur={(e) => !errors.confirmPassword && (e.target.style.borderColor = '#E5E7EB')}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle size={14} />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-sm text-green-600 flex items-center space-x-1">
                  <CheckCircle size={14} />
                  <span>Password cocok</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md mt-6"
              style={{ backgroundColor: '#A4C3B2' }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Mendaftar...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Daftar Sekarang</span>
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

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Sudah punya akun?{' '}
              <Link 
                to="/login" 
                className="font-semibold hover:underline transition"
                style={{ color: '#A4C3B2' }}
              >
                Login di sini
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
      </div>

      {/* Animation CSS */}
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