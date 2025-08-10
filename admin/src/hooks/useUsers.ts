import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../lib/users-api';
import { QueryParams } from '../lib/api';
import { toast } from 'sonner';

// Users management hooks
export const useUsers = (params?: QueryParams) => {
  return useQuery({
    queryKey: ['users', 'list', params],
    queryFn: async () => {
      const response = await usersApi.getUsers(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSearchUsers = (searchTerm: string, params?: QueryParams) => {
  return useQuery({
    queryKey: ['users', 'search', searchTerm, params],
    queryFn: async () => {
      const response = await usersApi.searchUsers(searchTerm, params);
      return response.data;
    },
    enabled: !!searchTerm && searchTerm.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useUsersByRole = (role: string, params?: QueryParams) => {
  return useQuery({
    queryKey: ['users', 'role', role, params],
    queryFn: async () => {
      const response = await usersApi.getUsersByRole(role, params);
      return response.data;
    },
    enabled: !!role,
    staleTime: 2 * 60 * 1000,
  });
};

export const useUsersByAccountType = (type: string, params?: QueryParams) => {
  return useQuery({
    queryKey: ['users', 'accountType', type, params],
    queryFn: async () => {
      const response = await usersApi.getUsersByAccountType(type, params);
      return response.data;
    },
    enabled: !!type,
    staleTime: 2 * 60 * 1000,
  });
};

export const useUserStats = () => {
  return useQuery({
    queryKey: ['users', 'stats'],
    queryFn: async () => {
      const response = await usersApi.getUserStats();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUser = (id: string, params?: { fields?: string; populate?: string }) => {
  return useQuery({
    queryKey: ['users', 'detail', id, params],
    queryFn: async () => {
      const response = await usersApi.getUserById(id, params);
      return response.data?.user;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isActive?: boolean; status?: string } }) =>
      usersApi.updateUserStatus(id, data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Update the specific user in cache
      queryClient.setQueryData(['users', 'detail', variables.id], data.data?.user);
      toast.success('User status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      usersApi.updateUserRole(id, role),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.setQueryData(['users', 'detail', variables.id], data.data?.user);
      toast.success('User role updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });
};

export const useBulkUpdateUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userIds, updateData }: { userIds: string[]; updateData: any }) =>
      usersApi.bulkUpdateUsers(userIds, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Users updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update users');
    },
  });
};

export const useExportUsers = () => {
  return useMutation({
    mutationFn: (params?: QueryParams) => usersApi.exportUsers(params),
    onSuccess: (data) => {
      // Create and download file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Users exported successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to export users');
    },
  });
};