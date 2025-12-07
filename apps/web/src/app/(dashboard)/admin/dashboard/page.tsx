'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  LogOut,
  Home,
  Bell,
  CheckCircle2
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import { useAuth } from '@/lib/auth/AuthContext'
import { DashboardShell } from '@/components/layouts/DashboardShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
  const [activeSection, setActiveSection] = useState('overview')
  const { signOut, userProfile } = useAuth()
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
      router.push('/auth/login')
    }
  }

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const handleSectionChange = (id: string) => {
    if (id === 'organizations') {
      router.push('/admin/organizations')
      return
    }
    setActiveSection(id)
  }

  return (
    <DashboardShell
      sidebarItems={sidebarItems}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      userProfile={{
        name: userProfile?.full_name || 'Admin User',
        email: userProfile?.email || 'admin@example.com',
      }}
      onLogout={handleLogout}
      organizationBranding={{
        name: 'Admin Portal',
      }}
      colorScheme="purple"
    >
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-gray-900 text-3xl mb-2">Welcome back, {userProfile?.full_name || 'Admin'}! 👋</h2>
            <p className="text-gray-500">Here&apos;s what&apos;s happening across the platform today.</p>
          </div>

          {/* System Overview Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{stats.newUsersThisMonth}</span>
                </div>
              </div>
              <h3 className="text-gray-900 text-3xl mb-1">{loading ? '...' : stats.totalUsers.toLocaleString()}</h3>
              <p className="text-gray-500 text-sm">Total Users</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{stats.coursesThisWeek}</span>
                </div>
              </div>
              <h3 className="text-gray-900 text-3xl mb-1">{loading ? '...' : stats.activeCourses}</h3>
              <p className="text-gray-500 text-sm">Active Courses</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Server className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-gray-900 text-3xl mb-1">{stats.systemUptime}%</h3>
              <p className="text-gray-500 text-sm">System Uptime</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
                {stats.securityAlerts > 0 && (
                   <div className="flex items-center gap-1 text-red-600 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Action Req.</span>
                  </div>
                )}
              </div>
              <h3 className="text-gray-900 text-3xl mb-1">{stats.securityAlerts}</h3>
              <p className="text-gray-500 text-sm">Security Alerts</p>
            </div>
          </div>

          {/* Organizations Quick Access */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-gray-900 text-xl font-semibold">Organizations</h3>
                <p className="text-gray-500 text-sm">Select an organization to manage users and resources</p>
              </div>
              <Button onClick={() => router.push('/admin/organizations')}>
                <Building2 className="h-4 w-4 mr-2" />
                View All Organizations
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Click on any organization to access user management, exam monitoring, course administration, 
              and organization-specific settings. All administrative tasks are performed within the context 
              of a selected organization.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            {/* Recent System Events */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-gray-900 text-xl font-semibold">Recent System Events</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">Security alert: Multiple failed login attempts</p>
                    <p className="text-sm text-gray-500">IP: 192.168.1.100 - 15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">New organization registered: &quot;TechCorp University&quot;</p>
                    <p className="text-sm text-gray-500">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Database className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">Database backup completed successfully</p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                    <Globe className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">CDN cache cleared for all regions</p>
                    <p className="text-sm text-gray-500">4 hours ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-gray-900 text-xl font-semibold">System Status</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-700">Database</span>
                  </div>
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-700">API Services</span>
                  </div>
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <span className="text-sm font-medium text-gray-700">File Storage</span>
                  </div>
                  <span className="text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Degraded</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-700">Authentication</span>
                  </div>
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium text-gray-700">Real-time</span>
                  </div>
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">Operational</span>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Statistics */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h3 className="text-gray-900 text-xl font-semibold mb-6">Platform-Wide Statistics</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Exams Completed</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{loading ? '...' : stats.completedExams.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Course Completions</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{loading ? '...' : stats.completedCourses.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Avg. Session</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{loading ? '...' : `${stats.avgSessionDuration} min`}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Daily Active Users</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{loading ? '...' : stats.dailyActiveUsers.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeSection === 'settings' && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Settings className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-gray-900 text-xl mb-2">System Settings</h3>
          <p className="text-gray-500">Global system configuration is under development.</p>
        </div>
      )}
    </DashboardShell>
  )
}
