'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Users,
  Search,
  Eye,
  UserX,
  CheckCircle,
  Plus,
  Copy,
  X,
  Building2,
  Trash2
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import Link from 'next/link'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

interface Organization {
  id: string
  name: string
  slug: string
}

// Generate a secure random password
function generateRandomPassword(length = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  const allChars = uppercase + lowercase + numbers + symbols
  
  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export default function OrganizationUsersPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const organizationId = params.orgId as string
  const roleFromQuery = searchParams.get('role')

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>(roleFromQuery || 'all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  useEffect(() => {
    fetchOrganization()
    fetchUsers()
  }, [organizationId, page, roleFilter, statusFilter, searchTerm])

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setOrganization(data.organization)
      }
    } catch (error) {
      logger.error('Error fetching organization:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/api/admin/organizations/${organizationId}/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      logger.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: suspend ? 'suspend' : 'activate' })
      })

      if (!response.ok) throw new Error('Failed to update user')
      
      await fetchUsers()
      alert(`✅ User ${suspend ? 'suspended' : 'activated'} successfully`)
    } catch (error) {
      logger.error('Error updating user:', error)
      alert('❌ Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
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
      
      await fetchUsers()
      alert('✅ User and all associated content deleted successfully')
    } catch (error: any) {
      logger.error('Error deleting user:', error)
      alert('❌ ' + (error.message || 'Failed to delete user'))
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  if (!organization) {
    return <div className="flex-1 p-8 pt-6">Loading...</div>
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/organizations/${organizationId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organization
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            </div>
            <p className="text-muted-foreground">
              {organization.name} • Manage users, create accounts, and control access
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Suspended</option>
            </select>
            <Button variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({total})</CardTitle>
          <CardDescription>
            All users in {organization.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <>
              <div className="space-y-2">
                {users.map((user) => (
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSuspendUser(user.id, user.is_active)}
                        title={user.is_active ? 'Suspend user' : 'Activate user'}
                      >
                        {user.is_active ? (
                          <UserX className="h-4 w-4 text-orange-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          organizationId={organizationId}
          organizationName={organization.name}
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

function CreateUserModal({ 
  organizationId, 
  organizationName,
  onClose, 
  onSuccess 
}: { 
  organizationId: string
  organizationName: string
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'student' as 'student' | 'teacher' | 'admin',
    student_id: '',
    employee_id: '',
    department: '',
    specialization: ''
  })
  const [loading, setLoading] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      const data = await response.json()
      setGeneratedPassword(data.password)
    } catch (error: any) {
      logger.error('Error creating user:', error)
      alert('❌ ' + (error.message || 'Failed to create user'))
      setLoading(false)
    }
  }

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword)
      alert('✅ Password copied to clipboard!')
    }
  }

  const handleFinish = () => {
    setGeneratedPassword(null)
    onSuccess()
  }

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>Add a new user to {organizationName}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., john@example.com"
                />
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

              {/* Only show ID field for students and teachers */}
              {formData.role !== 'admin' && (
                <div>
                  <label className="text-sm font-medium">
                    {formData.role === 'teacher' ? 'Employee ID' : 'Student ID'}
                  </label>
                  <Input
                    value={formData.role === 'teacher' ? formData.employee_id : formData.student_id}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      [formData.role === 'teacher' ? 'employee_id' : 'student_id']: e.target.value 
                    })}
                    placeholder={formData.role === 'teacher' ? 'e.g., EMP001' : 'e.g., STU001'}
                  />
                </div>
              )}

              {/* Only show department for students and teachers */}
              {formData.role !== 'admin' && (
                <div>
                  <label className="text-sm font-medium">Department</label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Computer Science"
                  />
                </div>
              )}

              {/* Only show specialization for students and teachers */}
              {formData.role !== 'admin' && (
                <div>
                  <label className="text-sm font-medium">
                    {formData.role === 'teacher' ? 'Specialization' : 'Major/Stream'}
                  </label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder={formData.role === 'teacher' ? 'e.g., Data Science, AI' : 'e.g., Computer Science'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For multiple values, separate with commas
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Note:</strong> A secure random password will be generated automatically. 
              You will see it only once after creation.
              {formData.role === 'admin' && (
                <div className="mt-2 pt-2 border-t border-blue-300">
                  <strong>Admin User:</strong> This admin will have full access to manage users, courses, and exams for <strong>{organizationName}</strong>.
                </div>
              )}
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
