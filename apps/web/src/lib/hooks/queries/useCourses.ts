import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/database/client'

const supabase = createClient()

export function usePublishedCourses() {
  return useQuery({
    queryKey: ['courses', 'published'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          teacher:users!courses_teacher_id_fkey(full_name, email)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
  })
}

export function useTeacherCourses(teacherId: string | null) {
  return useQuery({
    queryKey: ['courses', 'teacher', teacherId],
    queryFn: async () => {
      if (!teacherId) throw new Error('Teacher ID required')
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!teacherId,
  })
}

export function useCourse(courseId: string | null) {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID required')
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          sections:sections!sections_course_id_fkey (
            id,
            title,
            description,
            order_index,
            is_published,
            questions:questions!questions_section_id_fkey (
              id,
              title,
              type,
              points,
              order_index,
              is_published
            )
          ),
          teacher:users!courses_teacher_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('id', courseId)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!courseId,
  })
}

export function useStudentEnrollments(studentId: string | null) {
  return useQuery({
    queryKey: ['enrollments', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID required')
      
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses!course_enrollments_course_id_fkey(
            id,
            title,
            description,
            cover_image_url,
            teacher:users!courses_teacher_id_fkey(full_name)
          )
        `)
        .eq('student_id', studentId)
        .eq('is_active', true)
        .order('enrolled_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!studentId,
  })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (courseData: any) => {
      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export function useUpdateCourse() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ courseId, updates }: { courseId: string; updates: any }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses', data.id] })
      queryClient.invalidateQueries({ queryKey: ['courses', 'teacher', data.teacher_id] })
    },
  })
}
