'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  BookOpen,
  Shield,
  Activity,
  Server,
  Building2,
  LogOut,
  Settings,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import {
  StatsCard,
  LoadingPage,
  ResponsiveContainer,
  ErrorMessage,
} from '@/components/shared'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    activeCourses: 0,
    coursesThisWeek: 0,
    completedExams: 0,
    completedCourses: 0,
    dailyActiveUsers: 0,
    avgSessionDuration: 0,
    ongoingExams: 0,
    activeStudents: 0,
    activeTeachers: 0,
    systemUptime: 99.9,
    securityAlerts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError('Failed to load admin statistics')
        logger.error('Failed to fetch admin stats:', response.status)
      }
    } catch (error) {
      setError('Error loading dashboard data')
      logger.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      logger.log('Admin logout initiated')
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      logger.error('Logout error:', error)
      router.push('/auth/login')
    }
  }

  if (loading) {
    return <LoadingPage message="Loading admin dashboard..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <ResponsiveContainer className="py-4 sm:py-6 lg:py-8">
        {/* Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Super Admin Dashboard
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage organizations and monitor platform-wide metrics
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/organizations')}
              className="flex-1 sm:flex-none"
            >
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="text-xs sm:text-sm">Organizations</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="text-xs sm:text-sm">Settings</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              data-logout-btn
              className="flex-1 sm:flex-none"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="text-xs sm:text-sm">Logout</span>
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <ErrorMessage
            title="Error"
            message={error}
            retry={fetchStats}
          />
        )}

        {/* System Overview - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            description={`+${stats.newUsersThisMonth} new this month`}
            icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="blue"
            trend={
              stats.newUsersThisMonth > 0
                ? { value: ((stats.newUsersThisMonth / stats.totalUsers) * 100), isPositive: true }
                : undefined
            }
          />
          <StatsCard
            title="Active Courses"
            value={stats.activeCourses}
            description={`+${stats.coursesThisWeek} this week`}
            icon={<BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="green"
          />
          <StatsCard
            title="System Uptime"
            value={`${stats.systemUptime}%`}
            description="Last 30 days"
            icon={<Server className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="purple"
          />
          <StatsCard
            title="Security Alerts"
            value={stats.securityAlerts}
            description={stats.securityAlerts > 0 ? 'Require attention' : 'All clear'}
            icon={<Shield className="h-4 w-4 sm:h-5 sm:w-5" />}
            color={stats.securityAlerts > 0 ? 'red' : 'green'}
          />
        </div>

        {/* Additional Metrics - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatsCard
            title="Active Students"
            value={stats.activeStudents}
            description="Currently enrolled"
            icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="indigo"
          />
          <StatsCard
            title="Active Teachers"
            value={stats.activeTeachers}
            description="Teaching courses"
            icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="orange"
          />
          <StatsCard
            title="Ongoing Exams"
            value={stats.ongoingExams}
            description="In progress now"
            icon={<Activity className="h-4 w-4 sm:h-5 sm:w-5" />}
            color="red"
          />
        </div>

        {/* Organizations Section */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Organizations</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  Select an organization to manage users, courses, exams, and settings
                </CardDescription>
              </div>
              <Button
                onClick={() => router.push('/admin/organizations')}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                View All Organizations
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-gray-600">
              Click on any organization to access user management, exam monitoring, course
              administration, and organization-specific settings. All administrative tasks are
              performed within the context of a selected organization.
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity & Quick Stats */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Recent System Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Recent System Events</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest administrative activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">New user registration</p>
                    <p className="text-xs text-gray-600 truncate">5 new users joined today</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 sm:p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Course published</p>
                    <p className="text-xs text-gray-600 truncate">2 new courses this week</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 sm:p-3 bg-purple-50 rounded-lg">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Exams completed</p>
                    <p className="text-xs text-gray-600 truncate">{stats.completedExams} exams finished</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/users')}
                  size="sm"
                >
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Manage Users</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/organizations')}
                  size="sm"
                >
                  <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Manage Organizations</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/exams/ongoing')}
                  size="sm"
                >
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Monitor Ongoing Exams</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  disabled={stats.securityAlerts === 0}
                  size="sm"
                >
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-xs sm:text-sm">View Security Alerts ({stats.securityAlerts})</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ResponsiveContainer>
    </div>
  )
}
