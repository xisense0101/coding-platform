# State Management Architecture

This document describes the new production-ready client state and server state architecture implemented in the Next.js app.

## Overview

The application now uses a modern, scalable state management architecture:

- **Zustand** for client/global state management (auth, user, UI state)
- **React Query** for server state management (data fetching, caching, mutations)
- **Unified API Client** for consistent request/response handling

## Architecture Components

### 1. API Client (`src/lib/api/client.ts`)

A unified HTTP client wrapper that provides:

- **Error Handling**: Consistent error transformation and logging
- **Request Cancellation**: Built-in AbortController support
- **Timeout Management**: Configurable request timeouts (default: 30s)
- **Query Parameters**: Automatic URL building with query params
- **Type Safety**: Full TypeScript support with generics

#### Usage Example:

```typescript
import { apiClient } from '@/lib/api/client'

// GET request
const data = await apiClient.get<User[]>('/api/users', {
  params: { role: 'student' }
})

// POST request
const newUser = await apiClient.post<User>('/api/users', {
  email: 'user@example.com',
  name: 'John Doe'
})

// With custom timeout and signal
const controller = new AbortController()
const data = await apiClient.get('/api/data', {
  timeout: 5000,
  signal: controller.signal
})
```

### 2. Query Key Factory (`src/lib/api/query-keys.ts`)

Centralized query key management for React Query:

- **Hierarchical Keys**: Organized by domain (users, exams, courses, etc.)
- **Type Safety**: Const assertions for autocomplete and type checking
- **Consistency**: Ensures cache invalidation works correctly

#### Usage Example:

```typescript
import { queryKeys } from '@/lib/api/query-keys'

// Access keys
queryKeys.users.all          // ['users']
queryKeys.users.list(filters) // ['users', 'list', filters]
queryKeys.users.detail(id)   // ['users', 'detail', id]
```

### 3. Zustand Store (`src/lib/store/`)

Slice-based global state management:

#### Slices:
- **Auth Slice** (`auth-slice.ts`): Authentication state
- **User Slice** (`user-slice.ts`): User profile data
- **UI Slice** (`ui-slice.ts`): UI state (sidebar, modals, loading)

#### Usage Example:

```typescript
import { useAuth, useAuthActions, useUserProfile, useUiActions } from '@/lib/store'

function MyComponent() {
  // Access state
  const { isAuthenticated, userId } = useAuth()
  const userProfile = useUserProfile()
  const sidebarOpen = useSidebarOpen()
  
  // Access actions
  const { setAuthState, clearAuthState } = useAuthActions()
  const { toggleSidebar } = useUiActions()
  
  return (
    <div>
      {isAuthenticated && <p>Welcome {userProfile?.full_name}</p>}
      <button onClick={toggleSidebar}>Toggle Sidebar</button>
    </div>
  )
}
```

### 4. React Query Providers (`src/app/providers.tsx`)

Wraps the app with QueryClientProvider and hydration boundary:

- **Sensible Defaults**: Configured retry, stale time, and GC time
- **DevTools**: React Query DevTools in development mode
- **SSR Support**: Proper hydration for server-rendered pages

### 5. Feature-based API Hooks (`src/features/*/api/`)

React Query hooks organized by feature:

- `features/users/api/use-users.ts` - User management hooks
- `features/organizations/api/use-organizations.ts` - Organization hooks
- `features/courses/api/use-courses.ts` - Course management hooks
- `features/exams/api/use-exams.ts` - Exam management hooks

#### Usage Example:

```typescript
import { useUsers, useCreateUser } from '@/features/users'

function UsersList() {
  // Fetch users with filters
  const { data, isLoading, error } = useUsers({
    role: 'student',
    page: 1,
    limit: 50
  })
  
  // Create user mutation
  const createUser = useCreateUser()
  
  const handleCreate = async (userData: any) => {
    try {
      await createUser.mutateAsync(userData)
      // Success! Query cache is automatically invalidated
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      {data?.users.map(user => (
        <div key={user.id}>{user.full_name}</div>
      ))}
    </div>
  )
}
```

## Configuration

### React Query Default Options

```typescript
{
  queries: {
    staleTime: 5 * 60 * 1000,        // 5 minutes
    gcTime: 10 * 60 * 1000,          // 10 minutes
    retry: 2,                         // Retry failed requests twice
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
    refetchOnMount: false,
  },
  mutations: {
    retry: 1,
  }
}
```

### API Client Default Options

```typescript
{
  timeout: 30000,                     // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
}
```

## Migration Guide

### Migrating from Direct Fetch Calls

**Before:**
```typescript
const [users, setUsers] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function fetchUsers() {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data.users)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  fetchUsers()
}, [])
```

**After:**
```typescript
import { useUsers } from '@/features/users'

const { data, isLoading, error } = useUsers()
const users = data?.users ?? []
```

### Migrating from Supabase Direct Calls

**Before:**
```typescript
const [data, setData] = useState([])

useEffect(() => {
  async function fetchData() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
    setData(data)
  }
  fetchData()
}, [])
```

**After:**
```typescript
import { useUsers } from '@/features/users'

const { data } = useUsers({ role: 'student' })
const users = data?.users ?? []
```

### Creating New Query Hooks

1. Add query key to `src/lib/api/query-keys.ts`
2. Create hook in appropriate feature folder
3. Use `apiClient` for data fetching
4. Export from feature index

Example:
```typescript
// src/features/lessons/api/use-lessons.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/query-keys'

export function useLessons(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courses.lessons(courseId),
    queryFn: () => apiClient.get(`/api/courses/${courseId}/lessons`),
    enabled: !!courseId,
  })
}
```

## Best Practices

### 1. Use Query Keys Consistently
Always use the query key factory to ensure cache invalidation works:

```typescript
// ✅ Good
queryKeys.users.detail(userId)

// ❌ Bad
['users', userId]
```

### 2. Handle Loading and Error States
React Query provides built-in loading and error states:

```typescript
const { data, isLoading, error } = useUsers()

if (isLoading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
```

### 3. Use Mutations for Data Changes
Always use mutations for POST, PUT, PATCH, DELETE:

```typescript
const createUser = useCreateUser()

// ✅ Good - automatic cache invalidation
await createUser.mutateAsync(userData)

// ❌ Bad - manual cache management needed
await apiClient.post('/api/users', userData)
```

### 4. Optimize with Selectors
Use Zustand selectors to prevent unnecessary re-renders:

```typescript
// ✅ Good - only re-renders when userId changes
const userId = useUserId()

// ❌ Bad - re-renders on any auth state change
const { userId } = useAuth()
```

### 5. Leverage Placeholder Data
Use `placeholderData` for better UX during pagination:

```typescript
const { data } = useUsers({ page }, {
  placeholderData: (previousData) => previousData
})
```

## Troubleshooting

### Query Not Refetching
- Check `enabled` option
- Verify `staleTime` configuration
- Use `queryClient.invalidateQueries()` after mutations

### Type Errors
- Ensure API response types match hook generics
- Use `unknown` type and narrow with type guards if needed

### DevTools Not Showing
- Verify `NODE_ENV !== 'production'`
- Check browser console for errors
- Ensure providers are wrapped correctly

## Future Enhancements

- [ ] Add optimistic updates for better UX
- [ ] Implement request deduplication
- [ ] Add offline support with persistence
- [ ] Create custom hooks for complex queries
- [ ] Add error boundaries for query errors
- [ ] Implement query prefetching on hover
- [ ] Add monitoring and analytics

## References

- [React Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Next.js App Router](https://nextjs.org/docs/app)
