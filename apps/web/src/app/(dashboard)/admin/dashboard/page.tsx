'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, 
  BookOpen, 
  Shield, 
  BarChart3,
  Activity,
  AlertTriangle,
  Settings,
  Database,
  Server,
  Globe,
  UserCheck,
  FileText,
  TrendingUp,
  Clock,
  Building2,
  LogOut
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'

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
    securityAlerts: 0
  })
  const [loading, setLoading] = useState(true)
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        logger.error('Failed to fetch admin stats:', response.status)
      }
    } catch (error) {
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
      // Force navigation even if signOut fails
      router.push('/auth/login')
    }
  }
  return (
    <Container size="xl" className="py-6">
      <PageHeader
        heading="Super Admin Dashboard"
        description="Manage organizations and monitor platform-wide metrics. Select an organization to manage users and resources."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/organizations'}>
              <Building2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Manage Organizations</span>
              <span className="sm:hidden">Organizations</span>
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">System Settings</span>
              <span className="sm:hidden">Settings</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              data-logout-btn
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </>
        }
      />

      {/* System Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.newUsersThisMonth} new this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeCourses}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.coursesThisWeek} published this week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.systemUptime}%</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.securityAlerts}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.securityAlerts > 0 ? 'Require attention' : 'All clear'}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Organizations Quick Access */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>
                Select an organization to manage users, courses, exams, and settings
              </CardDescription>
            </div>
            <Button onClick={() => window.location.href = '/admin/organizations'}>
              <Building2 className="h-4 w-4 mr-2" />
              View All Organizations
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click on any organization to access user management, exam monitoring, course administration, 
            and organization-specific settings. All administrative tasks are performed within the context 
            of a selected organization.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-7 mt-6">
        {/* Recent System Events */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent System Events</CardTitle>
            <CardDescription>
              Latest administrative activities and system events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start sm:items-center space-x-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium">Security alert: Multiple failed login attempts</p>
                <p className="text-sm text-muted-foreground">IP: 192.168.1.100 - 15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start sm:items-center space-x-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium">New organization registered: &ldquo;TechCorp University&rdquo;</p>
                <p className="text-sm text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start sm:items-center space-x-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium">Database backup completed successfully</p>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start sm:items-center space-x-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                <Globe className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium">CDN cache cleared for all regions</p>
                <p className="text-sm text-muted-foreground">4 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health and performance metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Database</span>
              </div>
              <span className="text-sm text-muted-foreground">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">API Services</span>
              </div>
              <span className="text-sm text-muted-foreground">Operational</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <span className="text-sm">File Storage</span>
              </div>
              <span className="text-sm text-muted-foreground">Degraded</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Authentication</span>
              </div>
              <span className="text-sm text-muted-foreground">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Real-time</span>
              </div>
              <span className="text-sm text-muted-foreground">Operational</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Statistics */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Platform-Wide Statistics</CardTitle>
          <CardDescription>
            Overview of all organizations and platform health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                <span className="text-sm truncate">Exams Completed</span>
              </div>
              <span className="text-sm font-medium ml-2">{loading ? '...' : stats.completedExams.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <TrendingUp className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm truncate">Course Completions</span>
              </div>
              <span className="text-sm font-medium ml-2">{loading ? '...' : stats.completedCourses.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <Clock className="h-4 w-4 text-orange-600 shrink-0" />
                <span className="text-sm truncate">Avg. Session Duration</span>
              </div>
              <span className="text-sm font-medium ml-2">{loading ? '...' : `${stats.avgSessionDuration} min`}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <BarChart3 className="h-4 w-4 text-purple-600 shrink-0" />
                <span className="text-sm truncate">Daily Active Users</span>
              </div>
              <span className="text-sm font-medium ml-2">{loading ? '...' : stats.dailyActiveUsers.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  )
}
