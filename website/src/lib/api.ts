import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add any additional headers or auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        await api.post('/auth/refresh');
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'user' | 'admin';
  accountType: 'Individual' | 'Corporate';
  companyName?: string;
  gstinNo?: string;
  isActive: boolean;
  status: 'active' | 'inactive' | 'locked' | 'suspended';
  avatar?: string;
  getWhatsappUpdate: boolean;
  acceptTermsAndConditions: boolean;
  loginAttempts: number;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  contact: string; // email or mobile
  password?: string;
  otp?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  mobile: string;
  password: string;
  accountType?: 'Individual' | 'Corporate';
  companyName?: string;
  gstinNo?: string;
  getWhatsappUpdate?: boolean;
  acceptTermsAndConditions: boolean;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  companyName?: string;
  gstinNo?: string;
  getWhatsappUpdate?: boolean;
}

export interface VerifyOTPRequest {
  email?: string;
  mobile?: string;
  otp: string;
}

export default api;