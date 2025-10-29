'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/common/LoadingStates'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Ban,
  CheckCircle,
  Trash2,
  Eye,
  Home
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import Link from 'next/link'
import { supabase } from '@/lib/database/supabase'
import { useAuth } from '@/lib/auth/AuthContext'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  student_id?: string
  employee_id?: string
  department?: string
  created_at: string
  last_login?: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, userProfile, isLoading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  // Check if user is super_admin, redirect regular admins to their organization
  useEffect(() => {
    const checkRole = async () => {
      try {
        // Wait for auth to finish loading
        if (authLoading) {
          return
        }
        
        if (!user || !userProfile) {
          router.replace('/auth/login')
          return
        }
        
        // Regular admins should use organization-scoped user management
        if (userProfile.role === 'admin' && userProfile.organization_id) {
          router.replace(`/admin/organizations/${userProfile.organization_id}/users`)
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
  }, [router, user, userProfile, authLoading])

  useEffect(() => {
    if (!checkingAuth) {
      fetchUsers()
    }
  }, [roleFilter, statusFilter, pagination.page, checkingAuth])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (search) params.append('search', search)

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      logger.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 })
    fetchUsers()
  }

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: suspend ? 'suspend' : 'activate' })
      })

      if (!response.ok) throw new Error('Failed to update user')
      
      await fetchUsers()
    } catch (error) {
      logger.error('Error updating user:', error)
      alert('Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('⚠️ WARNING: This will permanently delete the user and ALL their associated content (courses, exams, questions, submissions, etc.).\n\nThis action cannot be undone!\n\nAre you absolutely sure?')) {
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
      
      await fetchUsers()
      alert('✅ User and all associated content deleted successfully')
    } catch (error: any) {
      logger.error('Error deleting user:', error)
      alert('❌ ' + (error.message || 'Failed to delete user'))
    }
  }

  // Show loading while checking authorization
  if (checkingAuth) {
    return <LoadingSpinner message="Loading..." />
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
              Manage students and teachers across your organization
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Suspended</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'student').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'teacher').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Showing {users.length} users (Page {pagination.page} of {pagination.totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.full_name}</h3>
                      <Badge variant={user.role === 'teacher' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      {user.is_active ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Suspended</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                      {user.student_id && (
                        <span>Student ID: {user.student_id}</span>
                      )}
                      {user.employee_id && (
                        <span>Employee ID: {user.employee_id}</span>
                      )}
                      {user.department && (
                        <span>Dept: {user.department}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(user.created_at).toLocaleDateString()}
                      {user.last_login && ` • Last login: ${new Date(user.last_login).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSuspendUser(user.id, user.is_active)}
                    >
                      {user.is_active ? (
                        <Ban className="h-4 w-4 text-orange-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchUsers()
          }}
        />
      )}
    </div>
  )
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'student' as 'student' | 'teacher' | 'admin',
    password: '',
    student_id: '',
    employee_id: '',
    department: '',
    specialization: '',
    organization_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [organizations, setOrganizations] = useState<Array<{id: string, name: string}>>([])
  const [currentUserRole, setCurrentUserRole] = useState<string>('')

  useEffect(() => {
    // Fetch organizations if super admin
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      }
    } catch (error) {
      logger.error('Error fetching organizations:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      const data = await response.json()
      
      // Show the generated password
      if (data.generatedPassword) {
        setGeneratedPassword(data.generatedPassword)
      } else {
        onSuccess()
      }
    } catch (error: any) {
      logger.error('Error creating user:', error)
      alert(error.message || 'Failed to create user')
      setLoading(false)
    }
  }

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword)
      alert('Password copied to clipboard!')
    }
  }

  const handleFinish = () => {
    setGeneratedPassword(null)
    onSuccess()
  }

  // If password was generated, show it
  if (generatedPassword) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-green-600">✅ User Created Successfully!</CardTitle>
            <CardDescription>
              Save this password - it will only be shown once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                ⚠️ IMPORTANT: Copy this password now!
              </p>
              <p className="text-xs text-yellow-700">
                This is the only time you will see this password. The user will need this to log in.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={formData.email} readOnly className="mt-1" />
            </div>

            <div>
              <label className="text-sm font-medium">Generated Password</label>
              <div className="flex gap-2 mt-1">
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={generatedPassword} 
                  readOnly 
                  className="font-mono"
                />
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleCopyPassword}
                >
                  📋 Copy
                </Button>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Next steps:</strong>
              <ol className="list-decimal ml-4 mt-2 space-y-1">
                <li>Copy the password above</li>
                <li>Share it with the user securely (email, message, etc.)</li>
                <li>User should change it after first login</li>
              </ol>
            </div>

            <Button onClick={handleFinish} className="w-full">
              Done - I've Saved the Password
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>Add a new student or teacher to your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password (Optional)</label>
                <Input
                  type="password"
                  placeholder="Leave empty to auto-generate"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If left empty, a secure random password will be generated
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {organizations.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Organization</label>
                  <select
                    value={formData.organization_id}
                    onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="">Use current organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Super admins can assign users to any organization
                  </p>
                </div>
              )}
              {formData.role === 'student' && (
                <div>
                  <label className="text-sm font-medium">Student ID</label>
                  <Input
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  />
                </div>
              )}
              {formData.role === 'teacher' && (
                <>
                  <div>
                    <label className="text-sm font-medium">Employee ID</label>
                    <Input
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Specialization</label>
                    <Input
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="text-sm font-medium">Department</label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
