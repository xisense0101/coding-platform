# ADR 0001: State Management Strategy

**Status**: Accepted

**Date**: 2024-11-18

**Context**: Defining the client-side and server-side state management approach

## Decision

We have adopted a **Context API-based** approach for client state management in the current implementation, with plans to potentially introduce Zustand and React Query for more complex state needs in the future.

## Context and Problem Statement

Modern React applications require efficient state management for:
1. **Authentication State**: User sessions, profiles, permissions
2. **Server Data**: Courses, exams, submissions, statistics
3. **UI State**: Modals, forms, loading states
4. **Client State**: User preferences, temporary data

The challenge is selecting the right tools for different types of state while maintaining:
- Performance
- Developer experience
- Type safety
- Bundle size efficiency
- Scalability

## Considered Options

### Option 1: React Context API (Current Choice)

**Pros:**
- ✅ Built into React (zero dependencies)
- ✅ Simple for authentication state
- ✅ Good TypeScript support
- ✅ Familiar to most React developers
- ✅ Minimal bundle impact

**Cons:**
- ❌ Can cause unnecessary re-renders
- ❌ No built-in caching or optimizations
- ❌ Verbose for complex state
- ❌ No dev tools for debugging
- ❌ Manual cache management required

**Best For:**
- Authentication state
- Theme/config state
- Simple global state

### Option 2: Zustand (Recommended for Future)

**Pros:**
- ✅ Minimal API surface
- ✅ No Provider boilerplate
- ✅ Built-in selector optimization
- ✅ Excellent TypeScript support
- ✅ Small bundle size (~1KB)
- ✅ Dev tools available
- ✅ Middleware ecosystem (persist, devtools)

**Cons:**
- ❌ Additional dependency
- ❌ Learning curve for team
- ❌ Not ideal for server state

**Best For:**
- Complex client state
- UI state management
- Multi-step forms
- Shopping carts / editors

**Example Usage:**
```typescript
import { create } from 'zustand'

interface EditorStore {
  code: string
  language: string
  theme: string
  setCode: (code: string) => void
  setLanguage: (lang: string) => void
  setTheme: (theme: string) => void
}

const useEditorStore = create<EditorStore>((set) => ({
  code: '',
  language: 'javascript',
  theme: 'vs-dark',
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
}))

// Usage in component
function CodeEditor() {
  const { code, setCode } = useEditorStore()
  return <textarea value={code} onChange={(e) => setCode(e.target.value)} />
}
```

### Option 3: React Query / TanStack Query (Recommended for Future)

**Pros:**
- ✅ Built for server state
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Request deduplication
- ✅ Excellent dev tools
- ✅ TypeScript support

**Cons:**
- ❌ Larger bundle size (~15KB)
- ❌ Learning curve
- ❌ Overkill for simple apps
- ❌ Requires query key management

**Best For:**
- Server state management
- Data fetching
- Cache management
- Real-time updates

**Example Usage:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Fetch courses
function useCourses(orgId: string) {
  return useQuery({
    queryKey: ['courses', orgId],
    queryFn: () => fetch(`/api/courses?org=${orgId}`).then(r => r.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Update course
function useUpdateCourse() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (course: Course) => 
      fetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        body: JSON.stringify(course),
      }),
    onSuccess: (_, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['course', variables.id] })
    },
  })
}

// Usage in component
function CoursesPage({ orgId }: { orgId: string }) {
  const { data: courses, isLoading, error } = useCourses(orgId)
  const updateCourse = useUpdateCourse()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      {courses.map(course => (
        <CourseCard 
          key={course.id} 
          course={course}
          onUpdate={(updates) => updateCourse.mutate({ ...course, ...updates })}
        />
      ))}
    </div>
  )
}
```

### Option 4: Redux / Redux Toolkit

**Pros:**
- ✅ Mature ecosystem
- ✅ Excellent dev tools
- ✅ Predictable state updates
- ✅ Time-travel debugging
- ✅ Large community

**Cons:**
- ❌ Verbose (even with RTK)
- ❌ Large bundle size (~15KB+)
- ❌ Steep learning curve
- ❌ Over-engineered for our needs
- ❌ Lots of boilerplate

**Decision**: Not selected due to complexity overhead

### Option 5: Recoil / Jotai

**Pros:**
- ✅ Atomic state management
- ✅ Minimal boilerplate
- ✅ Good performance

**Cons:**
- ❌ Smaller community
- ❌ Less mature than alternatives
- ❌ Learning curve for atomic patterns

**Decision**: Not selected due to smaller ecosystem

## Current Implementation

### Authentication State (React Context)

**Location**: `lib/auth/AuthContext.tsx`

**Features:**
- User authentication state
- User profile with role
- Session management
- Profile caching (5-minute TTL)
- Sign in/out/up methods

**Structure:**
```typescript
interface AuthContextType {
  user: User | null
  userProfile: DatabaseUser | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise
  signUp: (email: string, password: string, name: string) => Promise
  signOut: () => Promise
  resetPassword: (email: string) => Promise
  updatePassword: (password: string) => Promise
  refreshProfile: () => Promise
}
```

**Caching Strategy:**
```typescript
// In-memory cache with TTL
const profileCache = new Map<string, { 
  profile: DatabaseUser
  expiresAt: number 
}>()

const PROFILE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
```

### Server State (Server Components)

**Current Approach**: Fetch in Server Components

```typescript
// app/courses/page.tsx
async function CoursesPage() {
  const supabase = createSupabaseServerClient()
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
  
  return <CourseList courses={courses} />
}
```

**Pros:**
- Simple data fetching
- No client-side state management
- Built-in caching via Next.js

**Cons:**
- No automatic refetching
- Limited cache control
- Manual loading states

## Recommended Migration Path

### Phase 1: Current State (Completed)
- ✅ React Context for auth
- ✅ Server Components for data
- ✅ Manual caching in Context

### Phase 2: Add Zustand (Future)
- [ ] Client state (UI, forms, editors)
- [ ] Complex interactive features
- [ ] State persistence needs

**When to Adopt:**
- Multiple components need shared UI state
- Complex forms with multi-step flows
- Code editor state management
- Real-time collaboration features

### Phase 3: Add React Query (Future)
- [ ] Server state management
- [ ] Cache management
- [ ] Background refetching
- [ ] Optimistic updates

**When to Adopt:**
- Need automatic background refetching
- Real-time data requirements increase
- Need optimistic UI updates
- Cache management becomes complex

## State Categorization

### 1. Authentication State → Context API ✅
- User session
- User profile
- Auth methods

### 2. Server State → Server Components (Current) / React Query (Future)
- Courses, Exams, Users
- Statistics, Submissions
- Organization data

### 3. UI State → Zustand (Future)
- Modal open/close
- Sidebar collapsed
- Active tab
- Form drafts

### 4. Editor State → Zustand (Future)
- Code content
- Language selection
- Theme preference
- Editor settings

### 5. Form State → React Hook Form ✅
- Form values
- Validation state
- Submit status

## Query Key Convention (Future React Query)

```typescript
// Query key structure
const queryKeys = {
  // List queries
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.courses.lists(), filters] as const,
  },
  // Detail queries
  course: (id: string) => [...queryKeys.courses.all, id] as const,
  // Related queries
  courseEnrollments: (id: string) => [...queryKeys.courses.all, id, 'enrollments'] as const,
}

// Usage
useQuery({
  queryKey: queryKeys.courses.list('active'),
  queryFn: () => fetchCourses({ status: 'active' })
})
```

## Performance Implications

### Current Approach (Context + Server Components)
- **Bundle Size**: Minimal (built-in)
- **Performance**: Good for simple apps
- **Cache Management**: Manual

### Future Approach (Context + Zustand + React Query)
- **Bundle Size**: +16KB gzipped
- **Performance**: Excellent with optimizations
- **Cache Management**: Automatic
- **Developer Experience**: Significantly better

## Decision Drivers

1. **Start Simple**: Context API is sufficient for current needs
2. **Type Safety**: All options have good TypeScript support
3. **Performance**: Current approach is performant enough
4. **Scalability**: Clear migration path when needed
5. **Team Familiarity**: Context API is well-known
6. **Bundle Size**: Keep it minimal initially

## Consequences

### Positive
- Minimal dependencies
- Simple implementation
- Easy to understand
- Clear migration path
- Type-safe

### Negative
- Manual cache management
- No optimistic updates
- Limited dev tools
- May need refactoring as app grows

### Neutral
- Will require team training when migrating to Zustand/React Query
- Need to monitor performance as features grow

## Migration Triggers

Migrate to Zustand when:
- 3+ components need shared UI state
- Complex multi-step forms
- Editor state becomes complex

Migrate to React Query when:
- Need background refetching
- Cache invalidation becomes complex
- Real-time requirements increase
- 10+ server state queries

## References

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Context API](https://react.dev/reference/react/createContext)
- [State Management Comparison](https://leerob.io/blog/react-state-management)

## Related ADRs

- [ADR 0002: Backend Hardening](./0002-backend-hardening.md)
- [ADR 0003: UI System](./0003-ui-system.md)

## Review

This decision should be reviewed:
- When client-side state complexity increases
- When performance issues arise
- When real-time features are added
- Every 6 months or after major feature additions
