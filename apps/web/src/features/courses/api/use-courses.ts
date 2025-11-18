/**
 * Courses API - React Query hooks for course data fetching
 * Wraps existing API endpoints with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/query-keys'

interface Course {
  id: string
  title: string
  description?: string
  organization_id: string
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Lesson {
  id: string
  course_id: string
  title: string
  description?: string
  content?: string
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Hook to fetch list of courses
 */
export function useCourses(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.courses.list(filters),
    queryFn: () => 
      apiClient.get<{ courses: Course[] }>('/api/courses', { params: filters }),
  })
}

/**
 * Hook to fetch a single course by ID
 */
export function useCourse(courseId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.courses.detail(courseId),
    queryFn: () => apiClient.get<Course>(`/api/courses/${courseId}`),
    enabled: enabled && !!courseId,
  })
}

/**
 * Hook to fetch lessons for a course
 */
export function useCourseLessons(courseId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.courses.lessons(courseId),
    queryFn: () => 
      apiClient.get<{ lessons: Lesson[] }>(`/api/courses/${courseId}/lessons`),
    enabled: enabled && !!courseId,
  })
}

/**
 * Hook to fetch a single lesson
 */
export function useCourseLesson(courseId: string, lessonId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.courses.lesson(courseId, lessonId),
    queryFn: () => 
      apiClient.get<Lesson>(`/api/courses/${courseId}/lessons/${lessonId}`),
    enabled: enabled && !!courseId && !!lessonId,
  })
}

/**
 * Hook to create a new course
 */
export function useCreateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseData: Partial<Course>) => apiClient.post('/api/courses', courseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() })
    },
  })
}

/**
 * Hook to update a course
 */
export function useUpdateCourse(courseId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseData: Partial<Course>) =>
      apiClient.patch(`/api/courses/${courseId}`, courseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() })
    },
  })
}

/**
 * Hook to delete a course
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseId: string) => apiClient.delete(`/api/courses/${courseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() })
    },
  })
}
