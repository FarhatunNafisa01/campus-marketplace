import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Lock, Eye, EyeOff, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import { resetPassword } from '../services/api';  

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [tokenValid, setTokenValid] = useState(true);

    // Validasi token saat component mount
    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            setError('Token tidak valid atau sudah kadaluarsa');
        } else {
            // Nanti bisa tambah validasi token ke backend
            // validateToken(token);
        }
    }, [token]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError('');
    };

    const validatePassword = (password) => {
        if (password.length < 6) {
            return 'Password minimal 6 karakter';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password harus mengandung minimal 1 huruf besar';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password harus mengandung minimal 1 angka';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validasi
        if (!formData.password || !formData.confirmPassword) {
            setError('Semua field harus diisi');
            return;
        }

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Password tidak cocok');
            return;
        }

        setLoading(true);

        try {
            // ✅ Panggil API
            await resetPassword(token, formData.password);

            setSuccess(true);

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error('Reset password error:', err);
            if (err.response?.status === 400) {
                setError('Token tidak valid atau sudah kadaluarsa');
                setTokenValid(false);
            } else {
                setError(err.response?.data?.message || 'Gagal reset password. Coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Password strength indicator
    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, text: '', color: '' };

        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        if (strength <= 2) return { strength: 1, text: 'Lemah', color: 'bg-red-500' };
        if (strength <= 4) return { strength: 2, text: 'Sedang', color: 'bg-yellow-500' };
        return { strength: 3, text: 'Kuat', color: 'bg-green-500' };
    };

    const passwordStrength = getPasswordStrength(formData.password);

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
                    <h2 className="text-3xl font-bold text-gray-800">Reset Password</h2>
                    <p className="mt-2 text-gray-600">
                        Buat password baru untuk akun Anda
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start space-x-3 animate-fade-in">
                            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <p className="text-green-700 text-sm font-medium">
                                    Password berhasil direset!
                                </p>
                                <p className="text-green-600 text-xs mt-1">
                                    Anda akan diarahkan ke halaman login...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3 animate-shake">
                            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <p className="text-red-700 text-sm font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Invalid Token */}
                    {!tokenValid ? (
                        <div className="text-center py-8">
                            <KeyRound className="mx-auto text-gray-400 mb-4" size={48} />
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Token Tidak Valid</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                Link reset password sudah kadaluarsa atau tidak valid.
                            </p>
                            <Link
                                to="/forgot-password"
                                className="inline-block text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
                                style={{ backgroundColor: '#A4C3B2' }}
                            >
                                Minta Link Baru
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* New Password Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password Baru
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Minimal 6 karakter"
                                        className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition"
                                        style={{ focusBorderColor: '#A4C3B2' }}
                                        onFocus={(e) => e.target.style.borderColor = '#A4C3B2'}
                                        onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                                        disabled={loading || success}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                        disabled={loading || success}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-600">Kekuatan Password:</span>
                                            <span className={`text-xs font-semibold ${passwordStrength.strength === 1 ? 'text-red-600' :
                                                passwordStrength.strength === 2 ? 'text-yellow-600' : 'text-green-600'
                                                }`}>
                                                {passwordStrength.text}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                                                style={{ width: `${(passwordStrength.strength / 3) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Konfirmasi Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Ketik ulang password"
                                        className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition"
                                        style={{ focusBorderColor: '#A4C3B2' }}
                                        onFocus={(e) => e.target.style.borderColor = '#A4C3B2'}
                                        onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                                        disabled={loading || success}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                        disabled={loading || success}
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-600">Password tidak cocok</p>
                                )}
                            </div>

                            {/* Password Requirements */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-xs font-semibold text-blue-800 mb-2">Password harus memiliki:</p>
                                <ul className="text-xs text-blue-700 space-y-1">
                                    <li className="flex items-center space-x-2">
                                        <span className={formData.password.length >= 6 ? 'text-green-600' : 'text-gray-400'}>
                                            {formData.password.length >= 6 ? '✓' : '○'}
                                        </span>
                                        <span>Minimal 6 karakter</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <span className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                                            {/[A-Z]/.test(formData.password) ? '✓' : '○'}
                                        </span>
                                        <span>Minimal 1 huruf besar</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <span className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                                            {/[0-9]/.test(formData.password) ? '✓' : '○'}
                                        </span>
                                        <span>Minimal 1 angka</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || success}
                                className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md"
                                style={{ backgroundColor: '#A4C3B2' }}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Memproses...</span>
                                    </>
                                ) : success ? (
                                    <>
                                        <CheckCircle size={20} />
                                        <span>Berhasil!</span>
                                    </>
                                ) : (
                                    <>
                                        <KeyRound size={20} />
                                        <span>Reset Password</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Back to Login */}
                {!success && (
                    <div className="text-center mt-6">
                        <Link
                            to="/login"
                            className="text-gray-600 hover:text-gray-800 font-medium transition inline-flex items-center space-x-1"
                        >
                            <span>←</span>
                            <span>Kembali ke Login</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Custom CSS untuk animasi */}
            <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
        </div>
    );
}