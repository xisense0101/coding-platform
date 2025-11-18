/**
 * Exams API - React Query hooks for exam data fetching
 * Wraps existing API endpoints with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/query-keys'

interface Exam {
  id: string
  title: string
  description?: string
  organization_id: string
  created_by: string
  start_time: string
  end_time: string
  duration: number
  status: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface OngoingExam extends Exam {
  totalStudents: number
  activeStudents: number
}

/**
 * Hook to fetch list of exams
 */
export function useExams(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.exams.list(filters),
    queryFn: () => 
      apiClient.get<{ exams: Exam[] }>('/api/exams', { params: filters }),
  })
}

/**
 * Hook to fetch ongoing exams
 */
export function useOngoingExams() {
  return useQuery({
    queryKey: queryKeys.exams.ongoing(),
    queryFn: () => apiClient.get<{ exams: OngoingExam[] }>('/api/admin/exams/ongoing'),
    // Refetch every 30 seconds for ongoing exams
    refetchInterval: 30000,
  })
}

/**
 * Hook to fetch a single exam by ID
 */
export function useExam(examId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.exams.detail(examId),
    queryFn: () => apiClient.get<Exam>(`/api/exams/${examId}`),
    enabled: enabled && !!examId,
  })
}

/**
 * Hook to create a new exam
 */
export function useCreateExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (examData: Partial<Exam>) => apiClient.post('/api/exams', examData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.lists() })
    },
  })
}

/**
 * Hook to update an exam
 */
export function useUpdateExam(examId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (examData: Partial<Exam>) =>
      apiClient.patch(`/api/exams/${examId}`, examData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.detail(examId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.lists() })
    },
  })
}

/**
 * Hook to delete an exam
 */
export function useDeleteExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (examId: string) => apiClient.delete(`/api/exams/${examId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.lists() })
    },
  })
}
