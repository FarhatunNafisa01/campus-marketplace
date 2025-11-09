import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!email) {
            setError('Email harus diisi');
            return;
        }

        if (!email.includes('@')) {
            setError('Format email tidak valid');
            return;
        }

        setLoading(true);

        try {
            // ✅ Panggil API
            await forgotPassword(email);

            setSuccess(true);
            setEmail('');
        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.response?.data?.message || 'Gagal mengirim email reset password. Coba lagi.');
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
                    <h2 className="text-3xl font-bold text-gray-800">Lupa Password?</h2>
                    <p className="mt-2 text-gray-600">
                        Masukkan email Anda dan kami akan mengirimkan link untuk reset password
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
                                    Link reset password telah dikirim ke email Anda!
                                </p>
                                <p className="text-green-600 text-xs mt-1">
                                    Silakan cek inbox atau spam folder Anda.
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
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError('');
                                        if (success) setSuccess(false);
                                    }}
                                    placeholder="nama.mahasiswa@student.pnl.ac.id"
                                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition"
                                    style={{ focusBorderColor: '#A4C3B2' }}
                                    onFocus={(e) => e.target.style.borderColor = '#A4C3B2'}
                                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                                    disabled={loading}
                                    required
                                />
                            </div>
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
                                    <span>Mengirim...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    <span>Kirim Link Reset</span>
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

                    {/* Back to Login */}
                    <div className="text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center space-x-2 font-semibold hover:underline transition"
                            style={{ color: '#A4C3B2' }}
                        >
                            <ArrowLeft size={18} />
                            <span>Kembali ke Login</span>
                        </Link>
                    </div>
                </div>

                {/* Help Text */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-800 mb-2">💡 Bantuan:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Pastikan email yang Anda masukkan terdaftar</li>
                        <li>• Cek folder spam jika tidak menerima email</li>
                        <li>• Link reset berlaku selama 1 jam</li>
                        <li>• Hubungi admin jika masih bermasalah</li>
                    </ul>
                </div>
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