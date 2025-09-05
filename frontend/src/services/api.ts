import axios from 'axios';

const API_BASE_URL = ' https://padmavati-backend.onrender.com/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    console.log('API Request:', config.url, 'Token exists:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added Authorization header with token');
    }
    return config;
  },
  (error) => {
    console.error('API Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 errors for authentication-related endpoints
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/users/profile/me') || url.includes('/users/') && !url.includes('/users/login') && !url.includes('/users/admin');
    
    if (error.response?.status === 401 && isAuthEndpoint) {
      // Only logout for authentication-related endpoints
      localStorage.removeItem('authToken');
      // Don't redirect automatically, let the component handle it
      console.log('Token expired or invalid, user should be logged out');
    }
    return Promise.reject(error);
  }
);

// Product API endpoints
export const productAPI = {
  // Get all products
  getAll: () => api.get('/products'),
  getAllProducts: () => api.get('/products'), // Alias for admin dashboard
  getCategories: () => api.get('/products/categories/list'),
  
  // Get single product
  getById: (id: string) => api.get(`/products/${id}`),
  
  // Create new product (admin only)
  create: (productData: FormData) => api.post('/products', productData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Update product (admin only)
  update: (id: string, productData: FormData) => api.put(`/products/${id}`, productData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Delete product (admin only)
  delete: (id: string) => api.delete(`/products/${id}`),
  deleteProduct: (id: string) => api.delete(`/products/${id}`), // Alias for admin dashboard
  deleteCategory: (name: string) => api.delete(`/products/category/${encodeURIComponent(name)}`),
  
  // Upload multiple images for a product
  uploadImages: (id: string, images: FormData) => api.post(`/products/upload-images/${id}`, images, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

// User API endpoints
export const userAPI = {
  // Login user
  login: (credentials: { email: string; password: string }) => 
    api.post('/users/login', credentials),
  
  // Register user
  register: (userData: { name: string; email: string; password: string; role?: string }) => 
    api.post('/users', userData),
  
  // Create admin user
  createAdmin: (userData: { name: string; email: string; password: string; adminSecret: string }) => 
    api.post('/users/admin', userData),
  
  // Get current user profile
  getProfile: () => api.get('/users/profile/me'),
  
  // Update user profile
  updateProfile: (userData: any) => api.put('/users/profile/me', userData),
  
  // Get all users (admin only)
  getAllUsers: () => api.get('/users'),
  
  // Delete user (admin only)
  deleteUser: (userId: string) => api.delete(`/users/${userId}`),
  
  // Delete user by email (admin only)
  deleteUserByEmail: (email: string) => api.delete(`/users/email/${email}`),
  
  // Delete specific user hetshah1072@gmail.com (admin only)
  deleteHetshahUser: () => api.delete('/users/remove/hetshah'),
  
  // Promote user to admin (admin only)
  promoteUser: (userId: string, adminSecret: string) => 
    api.put(`/users/${userId}/promote`, { adminSecret }),
};

// Order API endpoints
export const orderAPI = {
  // Get all orders for admin
  getAll: () => api.get('/orders'),
  getAllOrders: () => api.get('/orders'), // Alias for admin dashboard
  
  // Get user's orders
  getUserOrders: (userId: string) => api.get(`/orders/user/${userId}`),
  
  // Get specific order
  getById: (orderId: string) => api.get(`/orders/${orderId}`),
  
  // Create new order (checkout)
  create: (orderData: any) => api.post('/orders/checkout', orderData),
  
  // Update order status (admin only)
  updateStatus: (orderId: string, statusData: { orderStatus: string; notes?: string }) => 
    api.put(`/orders/${orderId}/status`, statusData),
  
  // Clear order status (admin only)
  clearOrderStatus: (orderId: string) => api.delete(`/orders/${orderId}/clear-status`),
  
  // Clear all orders for a specific user (admin only)
  clearUserOrders: (userId: string) => api.delete(`/orders/user/${userId}/clear-all`),
  
  // Clear all orders in the system (admin only)
  clearAllOrders: () => api.delete('/orders/clear-all'),
};

// Cart API endpoints
export const cartAPI = {
  // Save cart for current user
  save: (items: Array<{ product: string; quantity: number }>) => 
    api.post('/cart', { items }),
};

export default api;
