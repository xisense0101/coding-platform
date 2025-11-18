/**
 * Example Component - Demonstrates new state management patterns
 * This is a reference implementation showing how to use React Query and Zustand
 * 
 * NOTE: This file is for reference only and is not used in the app
 */

'use client'

import { useState } from 'react'
import { useUsers, useCreateUser, useUpdateUser } from '@/features/users'
import { useAuth, useUserProfile, useUiActions } from '@/lib/store'
import { apiClient } from '@/lib/api/client'

/**
 * Example 1: Basic Query Usage
 * Fetching a list of users with filters
 */
export function UserListExample() {
  const [page, setPage] = useState(1)
  const [role, setRole] = useState<'student' | 'teacher' | undefined>(undefined)

  // Single hook replaces all fetch logic
  const { data, isLoading, error } = useUsers({
    role,
    page,
    limit: 50,
  })

  if (isLoading) return <div>Loading users...</div>
  if (error) return <div>Error: {error.message}</div>

  const users = data?.users ?? []
  const pagination = data?.pagination

  return (
    <div>
      <h1>Users List</h1>
      
      {/* Filter controls */}
      <select value={role} onChange={(e) => setRole(e.target.value as any)}>
        <option value="">All Roles</option>
        <option value="student">Students</option>
        <option value="teacher">Teachers</option>
      </select>

      {/* User list */}
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.full_name} - {user.email}</li>
        ))}
      </ul>

      {/* Pagination */}
      <button 
        onClick={() => setPage(page - 1)} 
        disabled={page === 1}
      >
        Previous
      </button>
      <span>Page {page} of {pagination?.totalPages}</span>
      <button 
        onClick={() => setPage(page + 1)}
        disabled={page === pagination?.totalPages}
      >
        Next
      </button>
    </div>
  )
}

/**
 * Example 2: Mutation Usage
 * Creating and updating users
 */
export function UserFormExample() {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'student' as 'student' | 'teacher' | 'admin',
  })

  // Mutation hooks
  const createUser = useCreateUser()
  const updateUser = useUpdateUser('user-id-here')

  const handleCreate = async () => {
    try {
      await createUser.mutateAsync(formData)
      alert('User created successfully!')
      // Query cache is automatically invalidated
      // User list will refetch automatically
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }

  const handleUpdate = async () => {
    try {
      await updateUser.mutateAsync(formData)
      alert('User updated successfully!')
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  return (
    <div>
      <h1>User Form</h1>
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      
      <input
        type="text"
        placeholder="Full Name"
        value={formData.full_name}
        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
      />

      <button 
        onClick={handleCreate}
        disabled={createUser.isPending}
      >
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </button>

      <button 
        onClick={handleUpdate}
        disabled={updateUser.isPending}
      >
        {updateUser.isPending ? 'Updating...' : 'Update User'}
      </button>

      {/* Show mutation errors */}
      {createUser.error && (
        <div>Error: {createUser.error.message}</div>
      )}
    </div>
  )
}

/**
 * Example 3: Zustand Store Usage
 * Accessing and updating global state
 */
export function GlobalStateExample() {
  // Access auth state
  const { isAuthenticated, userId } = useAuth()
  const userProfile = useUserProfile()
  
  // Access UI actions
  const { toggleSidebar, openModal, closeModal } = useUiActions()

  return (
    <div>
      <h1>Global State Example</h1>
      
      {/* Auth state */}
      <div>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        <p>User ID: {userId}</p>
        <p>User Name: {userProfile?.full_name}</p>
        <p>User Role: {userProfile?.role}</p>
      </div>

      {/* UI controls */}
      <button onClick={toggleSidebar}>
        Toggle Sidebar
      </button>

      <button onClick={() => openModal('user-form')}>
        Open User Form Modal
      </button>

      <button onClick={() => closeModal('user-form')}>
        Close User Form Modal
      </button>
    </div>
  )
}

/**
 * Example 4: Direct API Client Usage
 * For one-off requests or custom endpoints
 */
export function DirectApiExample() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchCustomData = async () => {
    setLoading(true)
    try {
      // Use API client for consistent error handling
      const result = await apiClient.get('/api/custom-endpoint', {
        params: { filter: 'value' },
        timeout: 10000, // 10 seconds
      })
      setData(result)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const postCustomData = async () => {
    try {
      await apiClient.post('/api/custom-endpoint', {
        key: 'value',
      })
      alert('Posted successfully!')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div>
      <h1>Direct API Client Example</h1>
      
      <button onClick={fetchCustomData} disabled={loading}>
        {loading ? 'Fetching...' : 'Fetch Data'}
      </button>

      <button onClick={postCustomData}>
        Post Data
      </button>

      {data && (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  )
}

/**
 * Example 5: Request Cancellation
 * How to cancel ongoing requests
 */
export function CancellableRequestExample() {
  const [controller, setController] = useState<AbortController | null>(null)
  const [data, setData] = useState<any>(null)

  const startLongRequest = async () => {
    // Create abort controller
    const abortController = new AbortController()
    setController(abortController)

    try {
      const result = await apiClient.get('/api/slow-endpoint', {
        signal: abortController.signal,
      })
      setData(result)
    } catch (error: any) {
      if (error.code === 'CANCELLED') {
        console.log('Request was cancelled')
      } else {
        console.error('Error:', error)
      }
    } finally {
      setController(null)
    }
  }

  const cancelRequest = () => {
    if (controller) {
      controller.abort()
      setController(null)
    }
  }

  return (
    <div>
      <h1>Cancellable Request Example</h1>
      
      <button onClick={startLongRequest} disabled={!!controller}>
        Start Long Request
      </button>

      <button onClick={cancelRequest} disabled={!controller}>
        Cancel Request
      </button>

      {controller && <p>Request in progress...</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}

/**
 * Example 6: Optimistic Updates (Advanced)
 * Update UI immediately before server confirms
 */
export function OptimisticUpdateExample() {
  const { data } = useUsers()
  const updateUser = useUpdateUser('user-id')

  const handleQuickUpdate = async () => {
    // TODO: Implement optimistic update
    // This would update the UI immediately before the server confirms
    // See React Query documentation for implementation details
    await updateUser.mutateAsync({ full_name: 'New Name' })
  }

  return (
    <div>
      <h1>Optimistic Update Example</h1>
      <p>See React Query docs for optimistic updates implementation</p>
      <button onClick={handleQuickUpdate}>Quick Update</button>
    </div>
  )
}

export default function ExamplesPage() {
  return (
    <div>
      <h1>State Management Examples</h1>
      <p>This page demonstrates various state management patterns</p>
      
      <UserListExample />
      <UserFormExample />
      <GlobalStateExample />
      <DirectApiExample />
      <CancellableRequestExample />
      <OptimisticUpdateExample />
    </div>
  )
}
