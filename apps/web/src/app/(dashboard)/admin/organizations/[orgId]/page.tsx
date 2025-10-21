'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Building2,
  ArrowLeft,
  Users,
  BookOpen,
  FileText,
  Activity,
  Settings,
  Search,
  Eye,
  UserX,
  CheckCircle
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  slug: string
  contact_email?: string
  contact_phone?: string
  subscription_plan: string
  max_users: number
  max_courses: number
  max_storage_gb: number
  max_exams_per_month: number
  is_active: boolean
  created_at: string
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

interface Course {
  id: string
  title: string
  description?: string
  is_published: boolean
  created_at: string
  teacher?: {
    full_name: string
  }
}

interface Exam {
  id: string
  title: string
  course?: {
    title: string
  }
  start_time: string
  end_time: string
  is_published: boolean
  created_at: string
}

interface Stats {
  totalUsers: number
  activeStudents: number
  activeTeachers: number
  suspendedUsers: number
  activeCourses: number
  totalExams: number
  ongoingExams: number
  completedExams: number
}

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const organizationId = params.orgId as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeStudents: 0,
    activeTeachers: 0,
    suspendedUsers: 0,
    activeCourses: 0,
    totalExams: 0,
    ongoingExams: 0,
    completedExams: 0
  })
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    fetchOrganizationDetails()
  }, [organizationId])

  const fetchOrganizationDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch organization info, users, courses, exams in parallel
      const [orgRes, usersRes, coursesRes, examsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/organizations/${organizationId}`),
        fetch(`/api/admin/organizations/${organizationId}/users`),
        fetch(`/api/admin/organizations/${organizationId}/courses`),
        fetch(`/api/admin/organizations/${organizationId}/exams`),
        fetch(`/api/admin/organizations/${organizationId}/stats`)
      ])

      if (orgRes.ok) {
        const orgData = await orgRes.json()
        setOrganization(orgData.organization)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData.courses || [])
      }

      if (examsRes.ok) {
        const examsData = await examsRes.json()
        setExams(examsData.exams || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      logger.error('Error fetching organization details:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="flex-1 p-8 pt-6">
        <div className="text-center py-12">Loading organization details...</div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex-1 p-8 pt-6">
        <div className="text-center py-12">Organization not found</div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/organizations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizations
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight">{organization.name}</h2>
                <Badge variant={organization.is_active ? 'default' : 'secondary'}>
                  {organization.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">{organization.subscription_plan}</Badge>
              </div>
              <p className="text-muted-foreground">
                {organization.slug} • Created {new Date(organization.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Organization Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contact Email</label>
              <p className="text-sm">{organization.contact_email || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contact Phone</label>
              <p className="text-sm">{organization.contact_phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Max Users</label>
              <p className="text-sm">{stats.totalUsers} / {organization.max_users}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Max Courses</label>
              <p className="text-sm">{stats.activeCourses} / {organization.max_courses}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Storage Limit</label>
              <p className="text-sm">{organization.max_storage_gb} GB</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Exams Per Month</label>
              <p className="text-sm">{organization.max_exams_per_month}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.suspendedUsers} suspended
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
              Published courses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExams}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedExams} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing Exams</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ongoingExams}</div>
            <p className="text-xs text-muted-foreground">
              Active right now
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Management Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Quick access to user administration for this organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="justify-start h-auto p-3"
                onClick={() => router.push(`/admin/organizations/${organizationId}/users?role=student`)}
              >
                <div className="text-left w-full">
                  <div className="font-medium">Students</div>
                  <div className="text-sm text-muted-foreground">{stats.activeStudents} active</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto p-3"
                onClick={() => router.push(`/admin/organizations/${organizationId}/users?role=teacher`)}
              >
                <div className="text-left w-full">
                  <div className="font-medium">Teachers</div>
                  <div className="text-sm text-muted-foreground">{stats.activeTeachers} active</div>
                </div>
              </Button>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-3"
              onClick={() => router.push(`/admin/organizations/${organizationId}/users`)}
            >
              <div className="text-left w-full">
                <div className="font-medium">All Users</div>
                <div className="text-sm text-muted-foreground">Manage all users in this organization</div>
              </div>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Statistics</CardTitle>
            <CardDescription>
              Key metrics for this organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Exams Completed</span>
              </div>
              <span className="text-sm font-medium">{stats.completedExams}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-green-600" />
                <span className="text-sm">Active Courses</span>
              </div>
              <span className="text-sm font-medium">{stats.activeCourses}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Total Users</span>
              </div>
              <span className="text-sm font-medium">{stats.totalUsers}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Monitoring</CardTitle>
          <CardDescription>
            Monitor ongoing exams and student activities in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-lg">{stats.ongoingExams} Ongoing Exams</p>
                <p className="text-sm text-muted-foreground">Active exams requiring monitoring</p>
              </div>
            </div>
            <Button onClick={() => router.push(`/admin/organizations/${organizationId}/exams`)}>
              View All
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Access real-time monitoring dashboards for each exam to track student progress, 
            detect violations, and ensure exam integrity.
          </p>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Recent users in this organization</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border rounded-md bg-background"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.slice(0, 10).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{user.role}</Badge>
                    {user.is_active ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <UserX className="h-3 w-3" />
                        Suspended
                      </Badge>
                    )}
                    <Link href={`/admin/organizations/${organizationId}/users/${user.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {filteredUsers.length > 10 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/admin/organizations/${organizationId}/users`)}
                  >
                    View All {filteredUsers.length} Users
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
