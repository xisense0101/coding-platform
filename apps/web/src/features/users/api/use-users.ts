/**
 * Users API - React Query hooks for user data fetching
 * Wraps existing API endpoints with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/query-keys'
import type { User } from '@/lib/database/types'

interface UserListFilters {
  role?: 'student' | 'teacher'
  search?: string
  status?: 'active' | 'inactive'
  page?: number
  limit?: number
}

interface UserListResponse {
  users: User[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Hook to fetch list of users
 * Used in admin user management pages
 */
export function useUsers(filters: UserListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => apiClient.get<UserListResponse>('/api/admin/users', { params: filters }),
    // Keep previous data while fetching new page
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => apiClient.get<User>(`/api/admin/users/${userId}`),
    enabled: enabled && !!userId,
  })
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userData: any) => apiClient.post('/api/admin/users', userData),
    onSuccess: () => {
      // Invalidate user lists to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

/**
 * Hook to update a user
 */
export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userData: Partial<User>) => 
      apiClient.patch(`/api/admin/users/${userId}`, userData),
    onSuccess: () => {
      // Invalidate both the specific user and user lists
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => apiClient.delete(`/api/admin/users/${userId}`),
    onSuccess: () => {
      // Invalidate user lists to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

/**
 * Hook to toggle user active status
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      apiClient.patch(`/api/admin/users/${userId}`, { is_active: isActive }),
    onSuccess: (_, variables) => {
      // Invalidate both the specific user and user lists
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}
