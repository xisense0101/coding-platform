import { createClient } from '@/lib/database/client'
import type { Database } from '@/lib/database/types'

type Tables = Database['public']['Tables']

export class CourseService {
  private supabase = createClient()

  async getCourse(courseId: string) {
    const { data, error } = await this.supabase
      .from('courses')
      .select(`
        *,
        sections:sections!sections_course_id_fkey (
          id,
          title,
          description,
          order_index,
          questions:questions!questions_section_id_fkey (
            id,
            title,
            type,
            points,
            order_index
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
  }

  async getCourseProgress(userId: string, courseId: string) {
    const { data, error } = await this.supabase
      .from('section_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('section_id', courseId)

    if (error) throw error
    return data
  }

  async getCourseSections(courseId: string) {
    const { data, error } = await this.supabase
      .from('sections')
      .select(`
        *,
        questions:questions!questions_section_id_fkey (
          id,
          title,
          type,
          points,
          order_index,
          is_published
        )
      `)
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('order_index')

    if (error) throw error
    return data
  }

  async enrollInCourse(userId: string, courseId: string) {
    const { data, error } = await this.supabase
      .from('course_enrollments')
      .insert({
        student_id: userId,
        course_id: courseId,
        enrollment_date: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateSectionProgress(
    userId: string, 
    sectionId: string, 
    progress: Partial<Tables['section_progress']['Update']>
  ) {
    const { data, error } = await this.supabase
      .from('section_progress')
      .upsert({
        user_id: userId,
        section_id: sectionId,
        ...progress,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export class LessonService {
  private supabase = createClient()

  async getLesson(lessonId: string) {
    const { data, error } = await this.supabase
      .from('questions')
      .select(`
        *,
        mcq_questions (*),
        coding_questions (*),
        section:sections!questions_section_id_fkey (
          id,
          title,
          course:courses!sections_course_id_fkey (
            id,
            title,
            teacher:users!courses_teacher_id_fkey (
              full_name
            )
          )
        )
      `)
      .eq('id', lessonId)
      .single()

    if (error) throw error
    return data
  }

  async submitAnswer(
    userId: string,
    questionId: string,
    answer: any,
    questionType: string
  ) {
    const { data, error } = await this.supabase
      .from('attempts')
      .insert({
        user_id: userId,
        question_id: questionId,
        attempt_type: questionType,
        answer: answer,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getUserAttempts(userId: string, questionId: string) {
    const { data, error } = await this.supabase
      .from('attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}

export class ExamService {
  private supabase = createClient()

  async getPublicExam(slug: string) {
    const { data, error } = await this.supabase
      .from('exams')
      .select(`
        *,
        exam_sections (
          *,
          exam_questions (
            *,
            question:questions!exam_questions_question_id_fkey (
              *,
              mcq_questions (*),
              coding_questions (*)
            )
          )
        ),
        teacher:users!exams_teacher_id_fkey (
          full_name
        )
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (error) throw error
    return data
  }

  async submitExam(examId: string, studentData: any, answers: any) {
    const { data, error } = await this.supabase
      .from('exam_submissions')
      .insert({
        exam_id: examId,
        student_id: studentData.id || crypto.randomUUID(),
        student_name: studentData.name,
        student_email: studentData.email,
        student_section: studentData.section,
        roll_number: studentData.rollNumber,
        answers: answers,
        submitted_at: new Date().toISOString(),
        is_submitted: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Export instances for easy use
export const courseService = new CourseService()
export const lessonService = new LessonService()
export const examService = new ExamService()

// Export a combined DatabaseService class for compatibility
export class DatabaseService {
  courses = courseService
  lessons = lessonService  
  exams = examService
}

export const databaseService = new DatabaseService()
