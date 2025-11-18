'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/feedback/LoadingStates'
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  FileText,
  Activity,
  Ban,
  CheckCircle,
  Trash2,
  Edit,
  AlertTriangle
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import Link from 'next/link'
import { supabase } from '@/lib/database/supabase'
import { useAuth } from '@/lib/auth/AuthContext'

interface UserDetail {
  user: any
  enrollments?: any[]
  recentSubmissions?: any[]
  courses?: any[]
  exams?: any[]
  totalEnrollments?: number
  totalSubmissions?: number
  totalCourses?: number
  totalExams?: number
  totalStudents?: number
  recentSessions?: any[]
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const { user: authUser, userProfile, isLoading: authLoading } = useAuth()

  const [userData, setUserData] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Check if user is super_admin, redirect regular admins
  useEffect(() => {
    const checkRole = async () => {
      try {
        // Wait for auth to finish loading
        if (authLoading) {
          return
        }
        
        if (!authUser || !userProfile) {
          router.replace('/auth/login')
          return
        }
        
        // Regular admins should use organization-scoped user detail
        if (userProfile.role === 'admin' && userProfile.organization_id) {
          router.replace(`/admin/organizations/${userProfile.organization_id}/users/${userId}`)
          return
        }
        
        // Only super_admin can access this page
        if (userProfile.role !== 'super_admin') {
          router.replace('/admin/dashboard')
          return
        }
        
        setCheckingAuth(false)
      } catch (error) {
        logger.error('Error checking role:', error)
        setCheckingAuth(false)
      }
    }
    
    checkRole()
  }, [router, userId, authUser, userProfile, authLoading])

  useEffect(() => {
    if (!checkingAuth) {
      fetchUserDetail()
    }
  }, [userId, checkingAuth])

  const fetchUserDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      if (!response.ok) throw new Error('Failed to fetch user details')

      const data = await response.json()
      setUserData(data)
    } catch (error) {
      logger.error('Error fetching user details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspendUser = async (suspend: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: suspend ? 'suspend' : 'activate' })
      })

      if (!response.ok) throw new Error('Failed to update user')
      
      await fetchUserDetail()
    } catch (error) {
      logger.error('Error updating user:', error)
      alert('Failed to update user')
    }
  }

  const handleDeleteUser = async () => {
    const userName = userData?.user?.full_name || 'this user'
    
    if (!confirm(`⚠️ CRITICAL WARNING ⚠️\n\nYou are about to permanently delete ${userName} and ALL associated content:\n\n- All courses created\n- All exams created\n- All questions created\n- All submissions and grades\n- All enrollments\n- All login sessions\n\nThis will affect students enrolled in their courses and cannot be undone!\n\nType YES in the next prompt to confirm.`)) {
      return
    }

    const confirmation = prompt('Type YES (in capital letters) to confirm deletion:')
    if (confirmation !== 'YES') {
      alert('Deletion cancelled')
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete user')
      }
      
      alert('✅ User and all associated content deleted successfully')
      router.push('/admin/users')
    } catch (error: any) {
      logger.error('Error deleting user:', error)
      alert('❌ ' + (error.message || 'Failed to delete user'))
    }
  }

  if (checkingAuth || loading) {
    return <LoadingSpinner message="Loading user details..." />
  }

  if (!userData) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    )
  }

  const { user } = userData

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-3xl font-bold tracking-tight">{user.full_name}</h2>
              <Badge variant={user.role === 'teacher' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
              {user.is_active ? (
                <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
              ) : (
                <Badge variant="destructive">Suspended</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSuspendUser(user.is_active)}
          >
            {user.is_active ? (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Suspend
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button variant="destructive" onClick={handleDeleteUser}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            {user.student_id && (
              <div>
                <p className="text-sm text-muted-foreground">Student ID</p>
                <p className="font-medium">{user.student_id}</p>
              </div>
            )}
            {user.employee_id && (
              <div>
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="font-medium">{user.employee_id}</p>
              </div>
            )}
            {user.department && (
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{user.department}</p>
              </div>
            )}
            {user.phone_number && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{user.phone_number}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            {user.last_login && (
              <div>
                <p className="text-sm text-muted-foreground">Last Login</p>
                <p className="font-medium">{new Date(user.last_login).toLocaleString()}</p>
              </div>
            )}
            {user.specialization && user.specialization.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Specialization</p>
                <p className="font-medium">{user.specialization.join(', ')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {user.role === 'student' && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Course Enrollments</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.totalEnrollments || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exam Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.totalSubmissions || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Logins</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.recentSessions?.length || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {user.role === 'teacher' && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.totalCourses || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.totalExams || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.totalStudents || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Logins</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData.recentSessions?.length || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student-specific data */}
      {user.role === 'student' && (
        <>
          {/* Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle>Course Enrollments</CardTitle>
              <CardDescription>All courses this student is enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              {userData.enrollments && userData.enrollments.length > 0 ? (
                <div className="space-y-3">
                  {userData.enrollments.map((enrollment: any) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{enrollment.courses?.title || 'Unknown Course'}</h4>
                        <p className="text-sm text-muted-foreground">
                          Progress: {enrollment.progress_percentage || 0}%
                          {enrollment.completion_date && ' • Completed'}
                        </p>
                      </div>
                      <Badge>{enrollment.enrollment_status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No enrollments</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Exam Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Exam Submissions</CardTitle>
              <CardDescription>Latest 10 exam attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {userData.recentSubmissions && userData.recentSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {userData.recentSubmissions.map((submission: any) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{submission.exams?.title || 'Unknown Exam'}</h4>
                        <p className="text-sm text-muted-foreground">
                          Score: {submission.total_score || 0} / {submission.exams?.total_marks || 0}
                          {' • '}
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={submission.submission_status === 'graded' ? 'default' : 'secondary'}>
                        {submission.submission_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No exam submissions</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Teacher-specific data */}
      {user.role === 'teacher' && (
        <>
          {/* Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Created Courses</CardTitle>
              <CardDescription>All courses created by this teacher</CardDescription>
            </CardHeader>
            <CardContent>
              {userData.courses && userData.courses.length > 0 ? (
                <div className="space-y-3">
                  {userData.courses.map((course: any) => (
                    <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(course.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={course.is_published ? 'default' : 'secondary'}>
                        {course.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No courses created</p>
              )}
            </CardContent>
          </Card>

          {/* Exams */}
          <Card>
            <CardHeader>
              <CardTitle>Created Exams</CardTitle>
              <CardDescription>All exams created by this teacher</CardDescription>
            </CardHeader>
            <CardContent>
              {userData.exams && userData.exams.length > 0 ? (
                <div className="space-y-3">
                  {userData.exams.map((exam: any) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{exam.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(exam.start_time).toLocaleDateString()} - {new Date(exam.end_time).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={exam.is_published ? 'default' : 'secondary'}>
                        {exam.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No exams created</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Recent Login Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Login Sessions</CardTitle>
          <CardDescription>Last 10 login sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {userData.recentSessions && userData.recentSessions.length > 0 ? (
            <div className="space-y-3">
              {userData.recentSessions.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">
                      {session.ip_address || 'Unknown IP'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.user_agent || 'Unknown device'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{new Date(session.created_at).toLocaleString()}</p>
                    <Badge variant={session.is_active ? 'default' : 'secondary'} className="mt-1">
                      {session.is_active ? 'Active' : 'Expired'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No login sessions recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
