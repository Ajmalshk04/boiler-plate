import { api, ApiResponse, User, LoginRequest, RegisterRequest, VerifyOTPRequest } from './api';

export interface LoginResponse {
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  accessTokenExpiry: string;
}

// Authentication API calls for website
export const authApi = {
  // User registration
  register: async (data: RegisterRequest): Promise<ApiResponse<{ message: string; userId: string }>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // User login (password or OTP)
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (data: VerifyOTPRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  // User logout
  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Logout from all devices
  logoutAll: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout-all');
    return response.data;
  },

  // Refresh tokens
  refresh: async (): Promise<ApiResponse<RefreshResponse>> => {
    const response = await api.post('/auth/refresh');
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