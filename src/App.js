import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProfilePage from './components/ProfilePage';
import SellPage from './components/SellPage';
import ProductDetailPage from './components/ProductDetailPage'; // 👈 TAMBAHKAN INI
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import ChatPage from './components/ChatPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} /> {/* 👈 TAMBAHKAN INI */}
        
        {/* Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jual"
          element={
            <ProtectedRoute>
              <SellPage />
            </ProtectedRoute>
          }
        />

        {/*untuk Lupa Password dan Reset Password?*/}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />


        {/* 404 - Harus paling akhir */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EEC6CA' }}>
              <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
                <h1 className="text-6xl font-bold mb-4" style={{ color: '#A4C3B2' }}>404</h1>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Halaman Tidak Ditemukan</h2>
                <p className="text-gray-600 mb-6">Maaf, halaman yang Anda cari tidak ditemukan.</p>
                <a href="/" className="inline-block text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition" style={{ backgroundColor: '#A4C3B2' }}>
                  Kembali ke Beranda
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;