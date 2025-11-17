'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { courseService } from '@/lib/database/service'
import { useAuth } from '@/lib/auth/AuthContext'
import CourseSections from './CourseSections'
import { LoadingPage, ErrorMessage } from '@/components/shared'

import { logger } from '@/lib/utils/logger'

interface Props {
  params: {
    courseId: string
  }
}

export default function CoursePage({ params }: Props) {
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const loadCourse = async () => {
      try {
        if (!user) {
          router.push('/auth/login')
          return
        }

        const courseData = await courseService.getCourse(params.courseId)
        
        if (!courseData) {
          router.push('/student/dashboard')
          return
        }

        setCourse(courseData)
      } catch (err) {
        logger.error('Error loading course:', err)
        setError('Failed to load course data')
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [params.courseId, user, router])

  if (loading) {
    return <LoadingPage message="Loading course..." />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <ErrorMessage
          message={error}
          onRetry={() => router.push('/student/dashboard')}
          retryLabel="Back to Dashboard"
        />
      </div>
    )
  }

  if (!course) {
    return null
  }

  return <CourseSections courseData={course} userId={user?.id || ''} />
}
