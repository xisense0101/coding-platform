'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Loader2, CheckCircle2, MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface FeedbackItem {
  id: string
  student_name: string
  student_email: string
  rating: number
  feedback_text: string | null
  submitted_at: string
  is_read: boolean
}

interface FeedbackStats {
  total: number
  averageRating: number
  unread: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

interface FeedbackData {
  feedback: FeedbackItem[]
  statistics: FeedbackStats
}

export default function ExamFeedbackPage({ params }: { params: { examId: string } }) {
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const router = useRouter()

  useEffect(() => {
    fetchFeedback()
  }, [params.examId])

  const fetchFeedback = async () => {
    try {
      const response = await fetch(`/api/exam/feedback/${params.examId}`)
      if (response.ok) {
        const data = await response.json()
        setFeedbackData(data)
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (feedbackId: string) => {
    try {
      const response = await fetch(`/api/exam/feedback/${params.examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, isRead: true })
      })

      if (response.ok) {
        // Update local state
        setFeedbackData(prev => {
          if (!prev) return null
          return {
            ...prev,
            feedback: prev.feedback.map((f: FeedbackItem) =>
              f.id === feedbackId ? { ...f, is_read: true } : f
            ),
            statistics: {
              ...prev.statistics,
              unread: prev.statistics.unread - 1
            }
          }
        })
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-5 w-5',
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            )}
          />
        ))}
      </div>
    )
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-50 border-green-200'
    if (rating >= 3) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (rating >= 2) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getTrendIcon = (average: number) => {
    if (average >= 4) return <TrendingUp className="h-5 w-5 text-green-600" />
    if (average >= 3) return <Minus className="h-5 w-5 text-blue-600" />
    return <TrendingDown className="h-5 w-5 text-red-600" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!feedbackData || !feedbackData.feedback || feedbackData.feedback.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>Exam Feedback</CardTitle>
            <CardDescription>No feedback received yet</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const filteredFeedbacks = filter === 'unread'
    ? feedbackData.feedback.filter((f: FeedbackItem) => !f.is_read)
    : feedbackData.feedback

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Exam Feedback</h1>
        <p className="text-slate-600">Student feedback and ratings for this exam</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Responses</CardDescription>
            <CardTitle className="text-3xl">{feedbackData.statistics.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Rating</CardDescription>
            <div className="flex items-center gap-2">
              <CardTitle className="text-3xl">
                {feedbackData.statistics.averageRating.toFixed(1)}
              </CardTitle>
              {getTrendIcon(feedbackData.statistics.averageRating)}
            </div>
            <div className="mt-1">
              {renderStars(Math.round(feedbackData.statistics.averageRating))}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Unread Feedback</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {feedbackData.statistics.unread}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rating Distribution</CardDescription>
            <div className="space-y-1 mt-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center gap-2 text-xs">
                  <span className="w-3">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: `${(feedbackData.statistics.ratingDistribution[rating as keyof typeof feedbackData.statistics.ratingDistribution] / feedbackData.statistics.total) * 100}%`
                      }}
                    />
                  </div>
                  <span className="w-6 text-slate-600">
                    {feedbackData.statistics.ratingDistribution[rating as keyof typeof feedbackData.statistics.ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({feedbackData.statistics.total})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
        >
          Unread ({feedbackData.statistics.unread})
        </Button>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedbacks.map((feedback) => (
          <Card
            key={feedback.id}
            className={cn(
              'transition-all',
              !feedback.is_read && 'border-l-4 border-l-blue-500 shadow-md'
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">{feedback.student_name}</CardTitle>
                    {!feedback.is_read && (
                      <Badge variant="default" className="bg-blue-500">
                        New
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span>{feedback.student_email}</span>
                    <span>•</span>
                    <span>{new Date(feedback.submitted_at).toLocaleString()}</span>
                  </CardDescription>
                </div>
                {!feedback.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(feedback.id)}
                    className="text-blue-600"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Mark as Read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border',
                  getRatingColor(feedback.rating)
                )}>
                  <span className="font-bold text-2xl">{feedback.rating}</span>
                  <div className="flex flex-col items-center">
                    {renderStars(feedback.rating)}
                  </div>
                </div>
                {feedback.feedback_text && (
                  <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-start gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-slate-500 mt-0.5" />
                      <span className="text-sm font-medium text-slate-700">Student Comment:</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed pl-6">
                      {feedback.feedback_text}
                    </p>
                  </div>
                )}
                {!feedback.feedback_text && (
                  <div className="flex-1 text-slate-400 italic">
                    No additional comments provided
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFeedbacks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No {filter} feedback to display</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
