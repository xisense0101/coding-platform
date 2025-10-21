'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner, EmptyState as EmptyStateComponent } from '@/components/common/LoadingStates'
import {
  ArrowLeft,
  Mail,
  Calendar,
  BookOpen,
  FileText,
  Activity,
  Ban,
  CheckCircle,
  Trash2,
  User,
  Building,
  GraduationCap,
  Briefcase
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import Link from 'next/link'

interface UserDetail {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  student_id?: string
  employee_id?: string
  department?: string
  specialization?: string[]
  created_at: string
  last_login?: string
}

interface RoleData {
  enrollments?: any[]
  recentSubmissions?: any[]
  courses?: any[]
  exams?: any[]
  totalStudents?: number
}

interface Session {
  id: string
  ip_address: string
  user_agent: string
  created_at: string
  last_active: string
}

export default function OrganizationUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const organizationId = params.orgId as string
  const userId = params.userId as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [roleData, setRoleData] = useState<RoleData>({})
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserDetail()
  }, [userId, organizationId])

  const fetchUserDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/organizations/${organizationId}/users/${userId}`)
      if (!response.ok) throw new Error('Failed to fetch user details')

      const data = await response.json()
      setUser(data.user)
      setRoleData(data.roleData || {})
      setSessions(data.sessions || [])
    } catch (error) {
      logger.error('Error fetching user details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspendUser = async (suspend: boolean) => {
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: suspend ? 'suspend' : 'activate' })
      })

      if (!response.ok) throw new Error('Failed to update user')
      
      await fetchUserDetail()
      alert(`✅ User ${suspend ? 'suspended' : 'activated'} successfully`)
    } catch (error) {
      logger.error('Error updating user:', error)
      alert('❌ Failed to update user')
    }
  }

  const handleDeleteUser = async () => {
    const confirmText = prompt(
      '⚠️ WARNING: This will permanently delete the user and ALL their associated content (courses, exams, questions, submissions, etc.).\n\n' +
      'This action cannot be undone!\n\n' +
      'Type "YES" (in capitals) to confirm deletion:'
    )

    if (confirmText !== 'YES') {
      if (confirmText !== null) {
        alert('Deletion cancelled. You must type "YES" exactly to confirm.')
      }
      return
    }

    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }
      
      alert('✅ User and all associated content deleted successfully')
      router.push(`/admin/organizations/${organizationId}/users`)
    } catch (error: any) {
      logger.error('Error deleting user:', error)
      alert('❌ ' + (error.message || 'Failed to delete user'))
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading user details..." />
  }

  if (!user) {
    return (
      <EmptyStateComponent
        title="User not found"
        action={
          <Button onClick={() => router.push(`/admin/organizations/${organizationId}/users`)}>
            Back to Users
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/organizations/${organizationId}/users`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">{user.full_name}</h2>
              <Badge variant={user.is_active ? 'default' : 'destructive'}>
                {user.is_active ? 'Active' : 'Suspended'}
              </Badge>
              <Badge variant="outline">{user.role}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSuspendUser(!user.is_active)}
          >
            {user.is_active ? (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Suspend User
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate User
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteUser}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete User
          </Button>
        </div>
      </div>

      {/* User Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium mt-1 capitalize">{user.role}</p>
              </div>
              {user.student_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  <div className="flex items-center gap-2 mt-1">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{user.student_id}</p>
                  </div>
                </div>
              )}
              {user.employee_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{user.employee_id}</p>
                  </div>
                </div>
              )}
              {user.department && (
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{user.department}</p>
                  </div>
                </div>
              )}
              {user.specialization && user.specialization.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Specialization</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.specialization.map((spec, index) => (
                      <Badge key={index} variant="secondary">{spec}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {user.last_login && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Login</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{new Date(user.last_login).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent sessions</p>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="text-sm border-l-2 border-blue-500 pl-3 py-1">
                    <p className="font-medium">{session.ip_address}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user_agent}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.last_active).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role-specific data */}
      {user.role === 'student' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Enrollments ({roleData.enrollments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!roleData.enrollments || roleData.enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No enrollments yet</p>
              ) : (
                <div className="space-y-2">
                  {roleData.enrollments.slice(0, 5).map((enrollment: any) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm font-medium">{enrollment.course?.title || 'Unknown Course'}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(enrollment.enrollment_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Submissions ({roleData.recentSubmissions?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!roleData.recentSubmissions || roleData.recentSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No submissions yet</p>
              ) : (
                <div className="space-y-2">
                  {roleData.recentSubmissions.slice(0, 5).map((submission: any) => (
                    <div key={submission.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{submission.exam?.title || 'Unknown Exam'}</p>
                        <p className="text-xs text-muted-foreground">
                          Score: {submission.score}/{submission.max_score}
                        </p>
                      </div>
                      <Badge variant={submission.status === 'submitted' ? 'default' : 'secondary'}>
                        {submission.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {user.role === 'teacher' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Courses ({roleData.courses?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!roleData.courses || roleData.courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No courses created yet</p>
              ) : (
                <div className="space-y-2">
                  {roleData.courses.slice(0, 5).map((course: any) => (
                    <div key={course.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(course.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={course.is_published ? 'default' : 'secondary'}>
                        {course.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Exams ({roleData.exams?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!roleData.exams || roleData.exams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No exams created yet</p>
              ) : (
                <div className="space-y-2">
                  {roleData.exams.slice(0, 5).map((exam: any) => (
                    <div key={exam.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{exam.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(exam.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={exam.is_published ? 'default' : 'secondary'}>
                        {exam.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
