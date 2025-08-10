import { api, ApiResponse, User, UserStats, PaginatedResponse, QueryParams } from './api';

// User management API calls
export const usersApi = {
  // Get all users with advanced querying
  getUsers: async (params?: QueryParams): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Search users
  searchUsers: async (searchTerm: string, params?: QueryParams): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await api.get('/users/search', { 
      params: { q: searchTerm, ...params } 
    });
    return response.data;
  },

  // Get users by role
  getUsersByRole: async (role: string, params?: QueryParams): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await api.get(`/users/role/${role}`, { params });
    return response.data;
  },

  // Get users by account type
  getUsersByAccountType: async (type: string, params?: QueryParams): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await api.get(`/users/account-type/${type}`, { params });
    return response.data;
  },

  // Get user statistics
  getUserStats: async (): Promise<ApiResponse<UserStats>> => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: string, params?: { fields?: string; populate?: string }): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get(`/users/${id}`, { params });
    return response.data;
  },

  // Update user status
  updateUserStatus: async (id: string, data: { isActive?: boolean; status?: string }): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.patch(`/users/${id}/status`, data);
    return response.data;
  },

  // Update user role
  updateUserRole: async (id: string, role: string): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Bulk update users
  bulkUpdateUsers: async (userIds: string[], updateData: any): Promise<ApiResponse> => {
    const response = await api.patch('/users/bulk-update', { userIds, updateData });
    return response.data;
  },

  // Export users
  exportUsers: async (params?: QueryParams): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/users/export', { params });
    return response.data;
  },
};

export default usersApi;