/**
 * Organizations API - React Query hooks for organization data fetching
 * Wraps existing API endpoints with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/query-keys'

interface Organization {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface OrganizationStats {
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  totalExams: number
  activeExams: number
}

/**
 * Hook to fetch list of organizations
 */
export function useOrganizations(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.organizations.list(filters),
    queryFn: () => 
      apiClient.get<{ organizations: Organization[] }>('/api/admin/organizations', { 
        params: filters 
      }),
  })
}

/**
 * Hook to fetch a single organization by ID
 */
export function useOrganization(orgId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.organizations.detail(orgId),
    queryFn: () => apiClient.get<Organization>(`/api/admin/organizations/${orgId}`),
    enabled: enabled && !!orgId,
  })
}

/**
 * Hook to fetch organization stats
 */
export function useOrganizationStats(orgId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.organizations.stats(orgId),
    queryFn: () => apiClient.get<OrganizationStats>(`/api/admin/organizations/${orgId}/stats`),
    enabled: enabled && !!orgId,
  })
}

/**
 * Hook to create a new organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orgData: Partial<Organization>) => 
      apiClient.post('/api/admin/organizations', orgData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.lists() })
    },
  })
}

/**
 * Hook to update an organization
 */
export function useUpdateOrganization(orgId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orgData: Partial<Organization>) =>
      apiClient.patch(`/api/admin/organizations/${orgId}`, orgData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(orgId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.lists() })
    },
  })
}

/**
 * Hook to delete an organization
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orgId: string) => apiClient.delete(`/api/admin/organizations/${orgId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.lists() })
    },
  })
}
