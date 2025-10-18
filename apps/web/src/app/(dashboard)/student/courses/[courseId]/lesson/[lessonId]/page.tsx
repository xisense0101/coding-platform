'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { lessonService, courseService } from '@/lib/database/service'
import { useAuth } from '@/lib/auth/AuthContext'
import LessonView from './LessonView'
import { Loader2 } from 'lucide-react'

import { logger } from '@/lib/utils/logger'

interface Props {
  params: {
    courseId: string
    lessonId: string
  }
}

export default function LessonPage({ params }: Props) {
  const [question, setQuestion] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [navigation, setNavigation] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Wait for auth to finish loading before checking user
        if (authLoading) {
          return
        }

        // Only redirect if auth has loaded and there's no user
        if (!authLoading && !user) {
          router.push(`/auth/login?next=/student/courses/${params.courseId}/lesson/${params.lessonId}`)
          return
        }

        // If we have a user, load the data
        if (user) {
          const [questionData, courseData] = await Promise.all([
            lessonService.getLesson(params.lessonId),
            courseService.getCourse(params.courseId)
          ])

          if (!questionData) {
            router.push(`/student/courses/${params.courseId}`)
            return
          }

          setQuestion(questionData)
          setCourse(courseData)

          // Calculate navigation
          if (courseData?.sections) {
            const allLessons: string[] = []
            courseData.sections
              .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
              .forEach((section: any) => {
                if (section.questions) {
                  section.questions
                    .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
                    .forEach((q: any) => {
                      allLessons.push(q.id)
                    })
                }
              })

            const currentIndex = allLessons.indexOf(params.lessonId)
            setNavigation({
              prev: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
              next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
            })
          }

          setLoading(false)
        }
      } catch (err) {
        logger.error('Error loading lesson data:', err)
        setError('Failed to load lesson data')
        setLoading(false)
      }
    }

    loadData()
  }, [params.courseId, params.lessonId, user, authLoading, router])

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!question || !course) {
    return null
  }

  return (
    <LessonView 
      question={question} 
      courseId={params.courseId}
      courseTitle={course?.title || 'Course'}
      userId={user?.id || ''}
      navigation={navigation}
    />
  )
}
