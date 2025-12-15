import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

export const GET = withAuth(
  async (request: NextRequest, { user, userProfile, supabase }) => {
    try {
      // 1. Get all courses taught by this teacher
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('teacher_id', user.id)
        .eq('organization_id', userProfile.organization_id)

      if (coursesError) {
        logger.error('Error fetching courses:', coursesError)
        throw coursesError
      }

      const courses = coursesData as any[]
      const courseIds = courses?.map((c: any) => c.id) || []
      
      if (courseIds.length === 0) {
        return NextResponse.json([])
      }

      // 2. Get all enrollments for these courses
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          student_id,
          course_id,
          progress_percentage,
          final_grade,
          grade_letter,
          last_accessed,
          enrollment_date,
          is_active
        `)
        .in('course_id', courseIds)
        .eq('is_active', true)

      if (enrollmentsError) {
        logger.error('Error fetching enrollments:', enrollmentsError)
        throw enrollmentsError
      }

      const enrollments = enrollmentsData as any[]

      // 3. Get student details
      const studentIds = [...new Set(enrollments?.map((e: any) => e.student_id) || [])]
      
      if (studentIds.length === 0) {
        return NextResponse.json([])
      }

      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select('id, full_name, email, profile_image_url, student_id')
        .in('id', studentIds)

      if (studentsError) {
        logger.error('Error fetching students:', studentsError)
        throw studentsError
      }

      const students = studentsData as any[]

      // 3.5 Fetch course structure (sections -> questions) to calculate total questions per course
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('id, course_id, questions:questions!questions_section_id_fkey(id)')
        .in('course_id', courseIds)

      if (sectionsError) {
        logger.error('Error fetching sections:', sectionsError)
      }

      const courseQuestionMap = new Map<string, Set<string>>()
      const allQuestionIds = new Set<string>()

      if (sectionsData) {
        sectionsData.forEach((section: any) => {
          if (!courseQuestionMap.has(section.course_id)) {
            courseQuestionMap.set(section.course_id, new Set())
          }
          section.questions?.forEach((q: any) => {
            courseQuestionMap.get(section.course_id)?.add(q.id)
            allQuestionIds.add(q.id)
          })
        })
      }

      // 3.6 Fetch attempts for these students and questions
      let attemptsData: any[] = []
      if (allQuestionIds.size > 0) {
        const { data, error: attemptsError } = await supabase
          .from('attempts')
          .select('user_id, question_id, is_correct, test_cases_passed, total_test_cases, attempt_type')
          .in('user_id', studentIds)
          .in('question_id', Array.from(allQuestionIds))
        
        if (attemptsError) {
          logger.error('Error fetching attempts:', attemptsError)
        } else {
          attemptsData = data || []
        }
      }
      
      const studentCompletedQuestions = new Map<string, Set<string>>() // userId -> Set<questionId>

      attemptsData.forEach((attempt: any) => {
        let isCompleted = false
        if (attempt.attempt_type === 'mcq') {
          isCompleted = attempt.is_correct === true
        } else if (attempt.attempt_type === 'coding') {
          isCompleted = attempt.test_cases_passed === attempt.total_test_cases && attempt.total_test_cases > 0
        } else {
           isCompleted = true
        }

        if (isCompleted) {
          if (!studentCompletedQuestions.has(attempt.user_id)) {
            studentCompletedQuestions.set(attempt.user_id, new Set())
          }
          studentCompletedQuestions.get(attempt.user_id)?.add(attempt.question_id)
        }
      })

      // 4. Aggregate data
      const studentMap = new Map()

      students?.forEach((student: any) => {
        studentMap.set(student.id, {
          id: student.id,
          full_name: student.full_name,
          email: student.email,
          student_id: student.student_id,
          profile_image_url: student.profile_image_url,
          courses: []
        })
      })

      enrollments?.forEach((enrollment: any) => {
        const student = studentMap.get(enrollment.student_id)
        if (student) {
          const course = courses?.find((c: any) => c.id === enrollment.course_id)
          if (course) {
            // Calculate dynamic progress
            const courseQuestions = courseQuestionMap.get(course.id)
            const totalQuestions = courseQuestions?.size || 0
            
            let completedCount = 0
            if (totalQuestions > 0) {
              const studentCompleted = studentCompletedQuestions.get(student.id)
              if (studentCompleted) {
                courseQuestions?.forEach(qId => {
                  if (studentCompleted.has(qId)) {
                    completedCount++
                  }
                })
              }
            }

            const dynamicProgress = totalQuestions > 0 
              ? Math.round((completedCount / totalQuestions) * 100) 
              : 0

            student.courses.push({
              course_id: course.id,
              course_title: course.title,
              progress: dynamicProgress, // Use dynamic progress instead of DB value
              final_grade: enrollment.final_grade,
              grade_letter: enrollment.grade_letter,
              last_accessed_at: enrollment.last_accessed,
              enrolled_at: enrollment.enrollment_date
            })
          }
        }
      })

      const result = Array.from(studentMap.values())

      return NextResponse.json(result)
    } catch (error) {
      logger.error('Error in student stats API:', error)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      )
    }
  }
)
