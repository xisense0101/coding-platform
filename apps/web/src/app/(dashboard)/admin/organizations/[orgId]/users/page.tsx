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
  Trash2,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2
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
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulkUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
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

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <BulkUploadModal
          organizationId={organizationId}
          organizationName={organization.name}
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={() => {
            setShowBulkUploadModal(false)
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

function BulkUploadModal({
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
  const [file, setFile] = useState<File | null>(null)
  const [sendEmails, setSendEmails] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
      } else {
        alert('Please upload a CSV file')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const downloadTemplate = () => {
    const template = `full_name,email,role,student_id,employee_id,department,specialization
John Doe,john@example.com,student,STU001,,Computer Science,Software Engineering
Jane Smith,jane@example.com,teacher,,EMP001,Mathematics,"Algebra, Calculus"
Admin User,admin@example.com,admin,,,,`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-users-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      alert('Please select a CSV file')
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sendEmails', sendEmails.toString())

      const response = await fetch(`/api/admin/organizations/${organizationId}/users/bulk`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed validation errors if available
        if (data.validationErrors && data.validationErrors.length > 0) {
          const errorMessages = data.validationErrors.join('\n')
          alert(`❌ CSV Validation Failed:\n\n${errorMessages}`)
        } else {
          alert('❌ ' + (data.error || 'Failed to upload users'))
        }
        setUploading(false)
        return
      }

      setResult(data)
    } catch (error: any) {
      logger.error('Error uploading users:', error)
      alert('❌ ' + (error.message || 'Failed to upload users'))
    } finally {
      setUploading(false)
    }
  }

  const handleFinish = () => {
    setResult(null)
    setFile(null)
    onSuccess()
  }

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <span className="text-green-600">Bulk Upload Complete</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-6 w-6 text-red-600" />
                      <span className="text-red-600">Bulk Upload Failed</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription>Results of the bulk user creation</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{result.total}</div>
                <div className="text-sm text-blue-800">Total Rows</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{result.created}</div>
                <div className="text-sm text-green-800">Created</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-red-800">Failed</div>
              </div>
              {sendEmails && (
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{result.emailsSent}</div>
                  <div className="text-sm text-purple-800">Emails Sent</div>
                </div>
              )}
            </div>

            {/* Email status */}
            {sendEmails && result.emailsSent > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <strong>Credentials sent via email</strong>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  {result.emailsSent} user(s) received their login credentials via email.
                  {result.emailsFailed > 0 && ` ${result.emailsFailed} email(s) failed to send.`}
                </p>
              </div>
            )}

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div>
                <h3 className="font-medium text-red-600 mb-2">Errors ({result.errors.length})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.errors.map((error: any, index: number) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                      <div className="font-medium text-red-800">Row {error.row}: {error.email}</div>
                      <div className="text-red-600">{error.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation errors */}
            {result.validationErrors && result.validationErrors.length > 0 && (
              <div>
                <h3 className="font-medium text-red-600 mb-2">Validation Errors</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.validationErrors.map((error: string, index: number) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleFinish} className="w-full">
              {result.success ? 'Done' : 'Close'}
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
              <CardTitle>Bulk Upload Users</CardTitle>
              <CardDescription>Upload a CSV file to create multiple users at once</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">📋 Instructions:</h3>
              <ol className="list-decimal ml-4 space-y-1 text-sm text-blue-800">
                <li>Download the CSV template below</li>
                <li>Fill in user details following the format</li>
                <li>Upload the completed CSV file</li>
                <li>Choose whether to send email notifications</li>
                <li>Click "Upload Users" to process</li>
              </ol>
            </div>

            {/* CSV Format */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium mb-2">CSV Format:</h3>
              <div className="text-sm space-y-2">
                <p><strong>Required columns:</strong> full_name, email, role</p>
                <p><strong>Optional columns:</strong> student_id, employee_id, department, specialization</p>
                <p><strong>Valid roles:</strong> student, teacher, admin</p>
                <ul className="list-disc ml-5 mt-2 space-y-1 text-gray-600">
                  <li><strong>Students:</strong> Can include student_id, department, specialization</li>
                  <li><strong>Teachers:</strong> Can include employee_id, department, specialization</li>
                  <li><strong>Admins:</strong> Only need full_name, email, and role</li>
                  <li><strong>Specialization:</strong> For multiple values, separate with commas</li>
                </ul>
              </div>
            </div>

            {/* Download Template */}
            <Button type="button" variant="outline" onClick={downloadTemplate} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>

            {/* File Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Upload CSV File</label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                {file ? (
                  <div>
                    <p className="font-medium text-green-600">✓ {file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="mt-2"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload">
                      <Button type="button" variant="secondary" size="sm" asChild>
                        <span>Browse Files</span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Email Option */}
            <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <input
                type="checkbox"
                id="sendEmails"
                checked={sendEmails}
                onChange={(e) => setSendEmails(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="sendEmails" className="text-sm flex-1 cursor-pointer">
                <strong className="text-purple-900">Send credentials via email</strong>
                <p className="text-purple-700 mt-1">
                  If enabled, each user will receive an email with their login credentials and a temporary password.
                  They will be prompted to change their password on first login.
                </p>
              </label>
            </div>

            {/* Important Note */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="text-yellow-900">Important:</strong>
                  <p className="text-yellow-800 mt-1">
                    Random passwords will be generated for all users. If you don't enable email notifications,
                    you won't be able to see the passwords after creation. Make sure email notifications are
                    enabled or have another way to communicate credentials to users.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading || !file}>
                {uploading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Users
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
