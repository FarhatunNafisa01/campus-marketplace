import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menambahkan token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor untuk handle error response
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AUTH API
export const login = (email, password) => 
  api.post('/auth/login', { email, password });

export const register = (userData) => 
  api.post('/auth/register', userData);

export const verifyToken = () => 
  api.get('/auth/verify');

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// PRODUCTS API
export const getProducts = () => api.get('/products');
export const getProductById = (id) => api.get(`/products/${id}`);
export const getProductsBySeller = (userId) => api.get(`/products/seller/${userId}`);

// USERS API
export const getUserProfile = (id) => api.get(`/users/${id}`);
export const updateUserProfile = (id, data) => api.put(`/users/${id}`, data);
export const updatePassword = (id, data) => api.put(`/users/${id}/password`, data);

// ✅ TAMBAHAN BARU: Upload & Delete Foto Profil
export const uploadProfilePhoto = (userId, file) => {
  const formData = new FormData();
  formData.append('foto_profil', file);
  
  return api.post(`/users/${userId}/upload-photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const deleteProfilePhoto = (userId) => {
  return api.delete(`/users/${userId}/photo`);
};

// TRANSACTIONS API
export const getTransactionsByBuyer = (userId) => api.get(`/transactions/buyer/${userId}`);

// HELPER FUNCTIONS
export const getAuthUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Forgot Password
export const forgotPassword = (email) => {
  return api.post('/auth/forgot-password', { email });
};

// Reset Password
export const resetPassword = (token, password) => {
  return api.post('/auth/reset-password', { token, password });
};

// Validate Token
export const validateResetToken = (token) => {
  return api.get(`/auth/validate-token/${token}`);
};

//Fungsi Buat Produk
export const createProduct = (productData) => 
  api.post('/products', productData);

// Chat endpoints (tambahkan di bagian bawah file)
export const getConversations = (userId) => api.get(`/chat/conversations/${userId}`);
export const getMessages = (conversationId) => api.get(`/chat/messages/${conversationId}`);
export const createConversation = (data) => api.post('/chat/conversations', data);
export const sendMessage = (data) => api.post('/chat/messages', data);
export const markAsRead = (conversationId, userId) => api.put(`/chat/messages/read/${conversationId}/${userId}`);

export default api;