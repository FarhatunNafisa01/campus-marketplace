import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Mail, Lock, User, BookOpen, Phone, Eye, EyeOff, AlertCircle, CheckCircle, Home } from 'lucide-react';
import { register, isAuthenticated } from '../services/api';
import registerIllustration from '../images/register-illustration.png'

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
    <div className="h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-y-auto" style={{ background: 'linear-gradient(135deg, #EEC6CA 0%, #F8E5E5 50%, #EEC6CA 100%)', position: 'relative' }}>
      {/* Background Particles untuk efek wow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-10 h-10 bg-white opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-20 w-8 h-8 bg-white opacity-5 rounded-full animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-6 h-6 bg-white opacity-8 rounded-full animate-ping"></div>
      </div>

      <div
        className={`max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
      >
        {/* Gambar Samping dengan Filter dan Animasi */}
        <div
          className={`hidden lg:block lg:w-1/2 relative transition-all duration-1000 ease-out ${isVisible ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <img
            src={registerIllustration}
            alt="CampusMarket Register Illustration"
            className="w-full h-full object-cover brightness-110 contrast-105 saturate-110"
            style={{ filter: 'brightness(1.1) contrast(1.05) saturate(1.1)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black to-black opacity-40"></div>


          {/* 🔼 Teks di atas gambar tanpa shadow */}
          <div
            className={`absolute top-4 left-4 text-white transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-5 opacity-0'
              }`}
          >
            <h3 className="text-base font-bold mb-1">
              Bergabunglah dengan Komunitas Kami
            </h3>
            <p className="text-xs opacity-90">
              Daftar sekarang dan mulai jual beli barang bekas mahasiswa dengan mudah.
            </p>
          </div>
        </div>



        {/* Form Register dengan Animasi */}
        <div className={`w-full lg:w-1/2 p-5 flex flex-col justify-center transition-all duration-1000 ease-out delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} overflow-y-auto max-h-screen`}>
          {/* Logo & Header */}
          <div className="text-center mb-3">
            <div className={`flex justify-center mb-2 transition-all duration-1000 delay-700 ${isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
              <div className="p-2.5 rounded-lg shadow-lg transform hover:scale-110 transition-transform duration-500" style={{ background: 'linear-gradient(135deg, #A4C3B2 0%, #B8D4C0 100%)' }}>
                <ShoppingBag className="text-white animate-pulse" size={28} />
              </div>
            </div>
            <h2 className={`text-xl font-extrabold text-gray-800 mb-1 transition-all duration-1000 delay-800 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>Daftar Akun Baru</h2>
            <p className={`text-xs text-gray-600 transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>Bergabung dengan CampusMarket</p>
          </div>

          {/* Global Error Alert */}
          {error && (
            <div className={`mb-3 p-2.5 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-2 animate-bounce transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
              <div className="flex-1">
                <p className="text-red-700 text-xs font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Nama Lengkap */}
            <div className={`transition-all duration-1000 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-300" size={16} />
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className={`w-full pl-8 pr-3 py-2 border-2 rounded-lg focus:outline-none transition-all duration-300 text-xs ${errors.nama ? 'border-red-300 shadow-red-200 bg-red-50' : 'border-gray-200 shadow-gray-100'
                    } hover:shadow-lg focus:shadow-xl hover:border-green-400`}
                  style={{
                    focusBorderColor: '#A4C3B2',
                    borderColor: errors.nama ? '#FCA5A5' : undefined
                  }}
                  onFocus={(e) => !errors.nama && (e.target.style.borderColor = '#A4C3B2')}
                  onBlur={(e) => !errors.nama && (e.target.style.borderColor = '#E5E7EB')}
                  disabled={loading}
                />
              </div>
              {errors.nama && (
                <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                  <AlertCircle size={10} />
                  <span>{errors.nama}</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div className={`transition-all duration-1000 delay-1100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email Mahasiswa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-300" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="namamahasiswa@student.pnl.ac.id"
                  className={`w-full pl-8 pr-3 py-2 border-2 rounded-lg focus:outline-none transition-all duration-300 text-xs ${errors.email ? 'border-red-300 shadow-red-200 bg-red-50' : 'border-gray-200 shadow-gray-100'
                    } hover:shadow-lg focus:shadow-xl hover:border-green-400`}
                  onFocus={(e) => !errors.email && (e.target.style.borderColor = '#A4C3B2')}
                  onBlur={(e) => !errors.email && (e.target.style.borderColor = '#E5E7EB')}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                  <AlertCircle size={10} />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>



            {/* NIM */}
            <div className={`transition-all duration-1000 delay-1200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                NIM <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-300" size={18} />
                <input
                  type="text"
                  name="nim"
                  value={formData.nim}
                  onChange={handleChange}
                  placeholder="2022573010017"
                  className={`w-full pl-10 pr-4 py-2 border-2 rounded-lg focus:outline-none transition-all duration-300 text-sm ${errors.nim ? 'border-red-300 shadow-red-200 bg-red-50' : 'border-gray-200 shadow-gray-100'
                    } hover:shadow-lg focus:shadow-xl hover:border-green-400`}
                  onFocus={(e) => !errors.nim && (e.target.style.borderColor = '#A4C3B2')}
                  onBlur={(e) => !errors.nim && (e.target.style.borderColor = '#E5E7EB')}
                  disabled={loading}
                />
              </div>
              {errors.nim && (
                <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                  <AlertCircle size={12} />
                  <span>{errors.nim}</span>
                </p>
              )}
            </div>

            {/* No Telepon */}
            <div className={`transition-all duration-1000 delay-1300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Nomor Telepon <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-300" size={18} />
                <input
                  type="tel"
                  name="no_telp"
                  value={formData.no_telp}
                  onChange={handleChange}
                  placeholder="081234567890"
                  className={`w-full pl-10 pr-4 py-2 border-2 rounded-lg focus:outline-none transition-all duration-300 text-sm ${errors.no_telp ? 'border-red-300 shadow-red-200 bg-red-50' : 'border-gray-200 shadow-gray-100'
                    } hover:shadow-lg focus:shadow-xl hover:border-green-400`}
                  onFocus={(e) => !errors.no_telp && (e.target.style.borderColor = '#A4C3B2')}
                  onBlur={(e) => !errors.no_telp && (e.target.style.borderColor = '#E5E7EB')}
                  disabled={loading}
                />
              </div>
              {errors.no_telp && (
                <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                  <AlertCircle size={12} />
                  <span>{errors.no_telp}</span>
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">Contoh: 081234567890 atau +6281234567890</p>
            </div>

            {/* Password */}
            <div className={`transition-all duration-1000 delay-1400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-300" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  className={`w-full pl-10 pr-10 py-2 border-2 rounded-lg focus:outline-none transition-all duration-300 text-sm ${errors.password ? 'border-red-300 shadow-red-200 bg-red-50' : 'border-gray-200 shadow-gray-100'
                    } hover:shadow-lg focus:shadow-xl hover:border-green-400`}
                  onFocus={(e) => !errors.password && (e.target.style.borderColor = '#A4C3B2')}
                  onBlur={(e) => !errors.password && (e.target.style.borderColor = '#E5E7EB')}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Kekuatan Password:</span>
                    <span className="text-xs font-semibold" style={{ color: getPasswordStrengthColor() }}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    />
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                  <AlertCircle size={12} />
                  <span>{errors.password}</span>
                </p>
              )}

              <p className="mt-1 text-xs text-gray-500">
                Password harus mengandung huruf besar, huruf kecil, dan angka
              </p>
            </div>

            {/* Confirm Password */}
            <div className={`transition-all duration-1000 delay-1500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Konfirmasi Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-300" size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi password"
                  className={`w-full pl-10 pr-10 py-2 border-2 rounded-lg focus:outline-none transition-all duration-300 text-sm ${errors.confirmPassword ? 'border-red-300 shadow-red-200 bg-red-50' : 'border-gray-200 shadow-gray-100'
                    } hover:shadow-lg focus:shadow-xl hover:border-green-400`}
                  onFocus={(e) => !errors.confirmPassword && (e.target.style.borderColor = '#A4C3B2')}
                  onBlur={(e) => !errors.confirmPassword && (e.target.style.borderColor = '#E5E7EB')}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                  <AlertCircle size={12} />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-xs text-green-600 flex items-center space-x-1">
                  <CheckCircle size={12} />
                  <span>Password cocok</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white py-2 rounded-lg font-bold hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-1000 delay-1600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}
              style={{ background: 'linear-gradient(135deg, #A4C3B2 0%, #B8D4C0 100%)' }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Mendaftar...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Daftar Sekarang</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className={`relative my-4 transition-all duration-1000 delay-1700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500 font-medium">atau</span>
            </div>
          </div>

          {/* Login Link */}
          <div className={`text-center transition-all duration-1000 delay-1800 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
            <p className="text-gray-600 text-sm">
              Sudah punya akun?{' '}
              <Link
                to="/login"
                className="font-bold hover:underline transition-colors duration-200 text-sm hover:text-green-600"
                style={{ color: '#A4C3B2' }}
              >
                Login di sini
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Back to Home - Desain Estetik */}
      <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-1900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
        <Link
          to="/"
          className="bg-white bg-opacity-90 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-opacity-100 hover:scale-105 flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium text-xs"
        >
          <Home size={14} className="text-gray-500" />
          <span>Kembali ke Beranda</span>
        </Link>
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
