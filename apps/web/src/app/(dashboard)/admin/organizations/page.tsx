'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/common/LoadingStates'
import {
  Building2,
  Plus,
  Search,
  Users,
  BookOpen,
  Home,
  Edit,
  Trash2,
  LogOut
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import Link from 'next/link'
import { supabase } from '@/lib/database/supabase'
import { useAuth } from '@/lib/auth/AuthContext'

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
  userCount?: number
  courseCount?: number
}

export default function AdminOrganizationsPage() {
  const router = useRouter()
  const { signOut, user, userProfile, isLoading: authLoading } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user is super_admin, redirect regular admins to their organization
  useEffect(() => {
    let isMounted = true
    
    const checkRole = async () => {
      try {
        // Wait for auth to finish loading
        if (authLoading) {
          logger.log('🔍 Waiting for auth to load...')
          return
        }
        
        logger.log('🔍 Checking user role for organizations page...')
        
        if (!user) {
          logger.warn('No user found, redirecting to login')
          if (isMounted) {
            setCheckingAuth(false)
            router.replace('/auth/login')
          }
          return
        }

        logger.log('✓ User authenticated:', user.email)
        
        if (!userProfile) {
          logger.error('No user profile found')
          if (isMounted) {
            setError('User profile not found. Please try logging in again.')
            setCheckingAuth(false)
          }
          return
        }

        logger.log('✓ User role:', userProfile.role)
        
        // Regular admins should view their own organization
        if (userProfile.role === 'admin' && userProfile.organization_id) {
          logger.log('Regular admin detected, redirecting to organization page')
          if (isMounted) {
            router.replace(`/admin/organizations/${userProfile.organization_id}`)
          }
          return
        }
        
        // Only super_admin can access organization list
        if (userProfile.role !== 'super_admin') {
          logger.warn('User is not super_admin, redirecting to dashboard')
          if (isMounted) {
            router.replace('/admin/dashboard')
          }
          return
        }

        logger.log('✅ Super admin verified, proceeding to load organizations')
        if (isMounted) {
          setCheckingAuth(false)
        }
      } catch (error) {
        logger.error('Error checking role:', error)
        if (isMounted) {
          setError('An unexpected error occurred: ' + (error as Error).message)
          setCheckingAuth(false)
        }
      }
    }
    
    checkRole()
    
    // Cleanup
    return () => {
      isMounted = false
    }
  }, [router, user, userProfile, authLoading])

  useEffect(() => {
    if (!checkingAuth) {
      logger.log('Auth check complete, fetching organizations...')
      fetchOrganizations()
    }
  }, [checkingAuth])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      setError(null)
      logger.log('📡 Fetching organizations from API...')
      
      const response = await fetch('/api/admin/organizations')
      logger.log('API response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        logger.error('API error response:', errorData)
        throw new Error(errorData.error || 'Failed to fetch organizations')
      }

      const data = await response.json()
      logger.log('✅ Organizations loaded:', data.organizations?.length || 0)
      setOrganizations(data.organizations || [])
    } catch (error: any) {
      logger.error('Error fetching organizations:', error)
      setError(error.message || 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.slug.toLowerCase().includes(search.toLowerCase())
  )

  // Show loading while checking authentication
  if (checkingAuth) {
    return <LoadingSpinner message="Checking permissions..." />
  }

  // Show error if authentication or permissions failed
  if (error && !loading) {
    return (
      <div className="flex-1 p-8 pt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-600 font-semibold mb-2">⚠️ Error</p>
              <p className="text-muted-foreground">{error}</p>
              <Button 
                className="mt-4" 
                onClick={() => {
                  setError(null)
                  setCheckingAuth(true)
                  window.location.reload()
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
            <h2 className="text-3xl font-bold tracking-tight">Organization Management</h2>
            <p className="text-muted-foreground">
              Create and manage organizations across the platform
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              await signOut()
              router.push('/auth/login')
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search organizations by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter(o => o.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((sum, org) => sum + (org.userCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((sum, org) => sum + (org.courseCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            Manage all organizations in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredOrgs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No organizations found</div>
          ) : (
            <div className="space-y-4">
              {filteredOrgs.map((org) => (
                <Link href={`/admin/organizations/${org.id}`} key={org.id}>
                  <div
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">{org.name}</h3>
                        <Badge variant={org.is_active ? 'default' : 'secondary'}>
                          {org.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{org.subscription_plan}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground ml-7">
                        <span>Slug: {org.slug}</span>
                        {org.contact_email && <span>Email: {org.contact_email}</span>}
                      </div>
                      <div className="flex items-center gap-6 text-sm ml-7">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{org.userCount || 0} users ({org.max_users} max)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{org.courseCount || 0} courses ({org.max_courses} max)</span>
                        </div>
                        <span>{org.max_storage_gb}GB storage</span>
                        <span>{org.max_exams_per_month} exams/month</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <Users className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchOrganizations()
          }}
        />
      )}
    </div>
  )
}

function CreateOrganizationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    subscription_plan: 'basic' as 'basic' | 'premium' | 'enterprise',
    max_users: 100,
    max_storage_gb: 10,
    max_courses: 50,
    max_exams_per_month: 100
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create organization')
      }

      alert('✅ Organization created successfully!')
      onSuccess()
    } catch (error: any) {
      logger.error('Error creating organization:', error)
      alert('❌ ' + (error.message || 'Failed to create organization'))
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create New Organization</CardTitle>
          <CardDescription>Add a new organization to the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Organization Name *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Chitkara University"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Slug *</label>
                <Input
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., chitkara-university"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Unique identifier for URLs (auto-generated from name)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Contact Email</label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="admin@organization.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contact Phone</label>
                <Input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subscription Plan *</label>
                <select
                  required
                  value={formData.subscription_plan}
                  onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Max Users *</label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Storage (GB) *</label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={formData.max_storage_gb}
                  onChange={(e) => setFormData({ ...formData, max_storage_gb: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Courses *</label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={formData.max_courses}
                  onChange={(e) => setFormData({ ...formData, max_courses: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Exams/Month *</label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={formData.max_exams_per_month}
                  onChange={(e) => setFormData({ ...formData, max_exams_per_month: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Plan Features:</strong>
              <ul className="list-disc ml-4 mt-1">
                <li><strong>Basic:</strong> Standard features for small organizations</li>
                <li><strong>Premium:</strong> Advanced analytics and proctoring</li>
                <li><strong>Enterprise:</strong> All features + SSO and custom branding</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
