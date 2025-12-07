import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';

// Pages
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import ChatPage from './components/ChatPage';
import ProfilePage from './components/ProfilePage';
import SellPage from './components/SellPage';
import ProductDetailPage from './components/ProductDetailPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <SocketProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />

          {/* Protected Routes */}
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          
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

          {/* 404 Page - Harus paling akhir */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SocketProvider>
    </Router>
  );
}

// 404 Component dengan design yang lebih baik
function NotFound() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4" 
      style={{ backgroundColor: '#EEC6CA' }}
    >
      <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <h1 
          className="text-6xl font-bold mb-4" 
          style={{ color: '#A4C3B2' }}
        >
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-gray-600 mb-6">
          Maaf, halaman yang Anda cari tidak ditemukan.
        </p>
        <a 
          href="/" 
          className="inline-block text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity duration-200"
          style={{ backgroundColor: '#A4C3B2' }}
        >
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}

export default App;