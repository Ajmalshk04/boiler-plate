import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../lib/auth-api';
import { User } from '../lib/api';
import { toast } from 'sonner';

// Auth hooks
export const useAdminLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.adminLogin,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'user'], data.data?.user);
      toast.success('Login successful');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });
};

export const useAdminLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.adminLogout,
    onSuccess: () => {
      queryClient.clear();
      toast.success('Logged out successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Logout failed');
    },
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const response = await authApi.getProfile();
      return response.data?.user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'user'], data.data?.user);
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Profile update failed');
    },
  });
};

export const useSessions = () => {
  return useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: async () => {
      const response = await authApi.getSessions();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success('Password reset link sent to your email');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword),
    onSuccess: () => {
      toast.success('Password reset successful');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Password reset failed');
    },
  });
};

// Auth context helper
export const useAuthUser = (): User | null => {
  const { data: user } = useProfile();
  return user || null;
};

export const useIsAuthenticated = (): boolean => {
  const user = useAuthUser();
  return !!user;
};

export const useIsAdmin = (): boolean => {
  const user = useAuthUser();
  return user?.role === 'admin';
};