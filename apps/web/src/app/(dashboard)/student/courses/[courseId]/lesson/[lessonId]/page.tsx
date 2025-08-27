'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { lessonService, courseService } from '@/lib/database/service'
import { useAuth } from '@/lib/auth/AuthContext'
import LessonView from './LessonView'
import { Loader2 } from 'lucide-react'

interface Props {
  params: {
    courseId: string
    lessonId: string
  }
}

export default function LessonPage({ params }: Props) {
  const [question, setQuestion] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user) {
          router.push('/auth/login')
          return
        }

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
      } catch (err) {
        console.error('Error loading lesson data:', err)
        setError('Failed to load lesson data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.courseId, params.lessonId, user, router])

  if (loading) {
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
    />
  )
}
