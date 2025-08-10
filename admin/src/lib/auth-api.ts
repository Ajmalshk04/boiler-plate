import { api, ApiResponse, User } from './api';

export interface LoginResponse {
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  accessTokenExpiry: string;
}

// Authentication API calls
export const authApi = {
  // Admin login
  adminLogin: async (credentials: { email: string; password: string }): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post('/auth/admin/login', credentials);
    return response.data;
  },

  // Admin logout
  adminLogout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/admin/logout');
    return response.data;
  },

  // Refresh admin tokens
  adminRefresh: async (): Promise<ApiResponse<RefreshResponse>> => {
    const response = await api.post('/auth/admin/refresh');
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: {
    name?: string;
    email?: string;
    mobile?: string;
    avatar?: string;
    companyName?: string;
    gstinNo?: string;
    getWhatsappUpdate?: boolean;
  }): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  // Get active sessions
  getSessions: async (): Promise<ApiResponse> => {
    const response = await api.get('/users/sessions');
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse> => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

export default authApi;