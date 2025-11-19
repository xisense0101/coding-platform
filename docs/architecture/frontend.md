# Frontend Architecture

## Overview

The frontend is built with Next.js 14 using the App Router architecture, React 18 with Server Components, and TypeScript for type safety. The application follows a feature-first structure with role-based layouts and a design system built on Radix UI and Tailwind CSS.

## Technology Stack

### Core Technologies

- **Next.js 14.2.5**: React framework with App Router
- **React 18.3.1**: UI library with Server Components
- **TypeScript 5.5.3**: Type-safe JavaScript
- **Tailwind CSS 3.4.0**: Utility-first CSS framework

### UI & Styling

- **Radix UI**: Accessible, unstyled component primitives
- **Lucide React**: Icon library (400+ icons)
- **Tailwind Merge**: Merge Tailwind classes
- **Class Variance Authority**: Component variants
- **Tailwind Animate**: Animation utilities
- **Tailwind Typography**: Typography plugin

### Form & Validation

- **React Hook Form 7.52.1**: Form state management
- **Zod 3.23.8**: Schema validation
- **@hookform/resolvers**: Zod resolver for React Hook Form

### Rich Content

- **Monaco Editor**: Code editor component
- **React Quill**: Rich text editor
- **React Day Picker**: Date picker component

### Utilities

- **date-fns**: Date manipulation
- **uuid**: Unique ID generation
- **clsx**: Conditional class names

## Directory Structure

```
apps/web/src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   └── layout.tsx           # Minimal auth layout
│   ├── (dashboard)/              # Dashboard route group
│   │   ├── admin/               # Admin dashboard
│   │   ├── teacher/             # Teacher dashboard
│   │   ├── student/             # Student dashboard
│   │   └── layout.tsx           # Dashboard layout with sidebar
│   ├── (public)/                # Public route group
│   │   ├── page.tsx             # Landing page
│   │   └── layout.tsx           # Public layout
│   ├── api/                     # API route handlers
│   │   ├── admin/               # Admin endpoints
│   │   ├── teacher/             # Teacher endpoints
│   │   ├── student/             # Student endpoints
│   │   └── auth/                # Auth endpoints
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # React components
│   ├── ui/                      # UI primitives (Radix based)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── forms/                   # Form components
│   ├── layouts/                 # Layout components
│   ├── common/                  # Shared components
│   ├── coding/                  # Coding exercise components
│   ├── exam/                    # Exam components
│   └── editors/                 # Editor components
├── hooks/                       # Custom React hooks
│   ├── useData.ts              # Data fetching hook
│   └── useElectronMonitoring.ts
├── lib/                         # Utilities and services
│   ├── auth/                   # Auth utilities
│   │   └── AuthContext.tsx     # Auth context provider
│   ├── database/               # Database clients
│   ├── utils/                  # Helper functions
│   └── utils.ts                # Utility functions
└── middleware.ts               # Next.js middleware
```

## Feature-First Structure

The application is organized by route groups rather than by technical layers. This provides:

1. **Clear Boundaries**: Each feature group is isolated
2. **Easy Navigation**: Related pages grouped together
3. **Layout Inheritance**: Shared layouts per feature group
4. **Role-based Access**: Clear separation by user role

### Route Groups

#### 1. Auth Group `(auth)`

**Purpose**: Authentication pages with minimal layout

**Pages:**
- `/auth/login` - User login
- `/auth/register` - User registration
- `/auth/forgot-password` - Password reset

**Layout Features:**
- No sidebar/navigation
- Centered content
- Brand header
- Minimal footer

#### 2. Dashboard Group `(dashboard)`

**Purpose**: Authenticated user dashboards

**Roles:**
- **Admin**: `/admin/*` - Organization management
- **Teacher**: `/teacher/*` - Course and exam management
- **Student**: `/student/*` - Learning and assignments

**Layout Features:**
- Sidebar navigation
- Header with user menu
- Breadcrumbs
- Role-specific nav items

#### 3. Public Group `(public)`

**Purpose**: Publicly accessible pages

**Pages:**
- `/` - Landing page
- `/about` - About page (if exists)
- `/contact` - Contact page (if exists)

**Layout Features:**
- Public header/nav
- Footer with links
- No authentication required

## Component Architecture

### UI System (Radix UI + Tailwind)

All UI components follow this pattern:

```typescript
// Example: Button component
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground...",
        destructive: "bg-destructive text-destructive-foreground...",
        outline: "border border-input...",
        // ... more variants
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Component Categories

#### 1. UI Primitives (`components/ui`)

- **Purpose**: Reusable, accessible UI components
- **Based on**: Radix UI primitives
- **Styled with**: Tailwind CSS
- **Characteristics**: 
  - Fully typed
  - Accessible (ARIA compliant)
  - Composable
  - Themeable

**Available Components:**
- `button`, `input`, `textarea` - Form controls
- `dialog`, `popover`, `tooltip` - Overlays
- `select`, `checkbox`, `radio-group` - Form inputs
- `table`, `card`, `badge` - Display
- `tabs`, `separator`, `scroll-area` - Layout
- `alert`, `progress`, `avatar` - Feedback

#### 2. Feature Components

- **Coding Components** (`components/coding`): Code editor, test runners
- **Exam Components** (`components/exam`): Exam interface, question types
- **Editor Components** (`components/editors`): Monaco editor wrapper
- **Form Components** (`components/forms`): Complex form compositions
- **Layout Components** (`components/layouts`): Sidebars, headers, footers

#### 3. Common Components

Shared components used across features:
- Navigation components
- Search bars
- User menus
- Breadcrumbs

## State Management

### Client State (AuthContext)

**Location**: `lib/auth/AuthContext.tsx`

**Purpose**: Manage authentication state across the app

**State:**
```typescript
interface AuthContextType {
  user: User | null              // Supabase user
  userProfile: DatabaseUser | null  // App user profile
  session: Session | null        // Supabase session
  isLoading: boolean             // Loading state
  signIn: (email, password) => Promise
  signUp: (email, password, fullName, role?) => Promise
  signOut: () => Promise
  resetPassword: (email) => Promise
  updatePassword: (password) => Promise
  refreshProfile: () => Promise
}
```

**Features:**
- Profile caching (5-minute TTL)
- Automatic session refresh
- Navigation after auth actions
- Error handling

**Usage:**
```typescript
'use client'

import { useAuth } from '@/lib/auth/AuthContext'

function MyComponent() {
  const { user, userProfile, signOut } = useAuth()
  
  if (!user) return <div>Not logged in</div>
  
  return (
    <div>
      <h1>Welcome {userProfile?.full_name}</h1>
      <button onClick={signOut}>Logout</button>
    </div>
  )
}
```

### Server State

- **Fetched in**: Server Components
- **Pattern**: Fetch at render time
- **Caching**: Via Redis (optional)
- **Revalidation**: Automatic with Next.js

**Example:**
```typescript
// app/courses/page.tsx
import { createSupabaseServerClient } from '@/lib/database/supabase-server'

async function CoursesPage() {
  const supabase = createSupabaseServerClient()
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
  
  return <CourseList courses={courses} />
}
```

### Form State (React Hook Form)

**Usage Pattern:**
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

function LoginForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  
  const onSubmit = async (data) => {
    // Handle submission
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

## Styling & Theming

### Tailwind CSS Configuration

**Location**: `tailwind.config.js`

**Key Features:**
- Design tokens (colors, spacing, typography)
- Dark mode support (class-based)
- Custom animations
- Typography plugin
- Container utilities

### CSS Variables (Design Tokens)

**Location**: `app/globals.css`

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... more tokens */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode tokens */
}
```

### Utility Functions

**Location**: `lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage**: Merge Tailwind classes safely
```typescript
<div className={cn("base-class", conditional && "conditional-class")} />
```

## Routing & Navigation

### App Router Features

1. **File-based Routing**: Pages defined by directory structure
2. **Layouts**: Shared UI between routes
3. **Loading States**: `loading.tsx` for suspense
4. **Error Boundaries**: `error.tsx` for error handling
5. **Route Groups**: `(groupName)` for organization without URL segments

### Navigation

**Programmatic:**
```typescript
'use client'

import { useRouter } from 'next/navigation'

function MyComponent() {
  const router = useRouter()
  
  const handleClick = () => {
    router.push('/dashboard')
    // router.back()
    // router.refresh()
  }
}
```

**Declarative:**
```typescript
import Link from 'next/link'

<Link href="/courses">View Courses</Link>
```

## Data Fetching Patterns

### Server Components (Recommended)

```typescript
// Async server component
async function CoursePage({ params }) {
  const course = await fetchCourse(params.id)
  return <CourseDetail course={course} />
}
```

### Client Components (When Needed)

```typescript
'use client'

import { useEffect, useState } from 'react'

function ClientComponent() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
  }, [])
  
  return <div>{/* Render data */}</div>
}
```

## Responsiveness & Accessibility

### Responsive Design

**Approach**: Mobile-first with Tailwind breakpoints

**Breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Example:**
```typescript
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Responsive width */}
</div>
```

### Accessibility

**Standards**: WCAG 2.1 AA compliance

**Best Practices:**
1. **Semantic HTML**: Use appropriate elements
2. **ARIA Attributes**: Provided by Radix UI
3. **Keyboard Navigation**: Full keyboard support
4. **Focus Management**: Visible focus indicators
5. **Screen Reader Support**: Descriptive labels
6. **Color Contrast**: Meets AA standards

**Example:**
```typescript
<Button aria-label="Close dialog" onClick={onClose}>
  <X className="h-4 w-4" />
</Button>
```

## Performance Optimization

### Code Splitting

- **Automatic**: Next.js splits by route
- **Manual**: `dynamic()` for heavy components

```typescript
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
)
```

### Image Optimization

```typescript
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // Above the fold
/>
```

### Font Optimization

```typescript
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

<body className={inter.className}>
  {children}
</body>
```

## Error Handling

### Error Boundaries

```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### Loading States

```typescript
// app/loading.tsx
export default function Loading() {
  return <Spinner />
}
```

## Testing Strategy

### Current State
- No automated frontend tests
- Manual testing for features
- TypeScript for type safety

### Recommended Additions
1. **Unit Tests**: Jest + React Testing Library
2. **Integration Tests**: Playwright/Cypress
3. **Visual Regression**: Chromatic/Percy
4. **Accessibility**: Axe/Pa11y

## Related Documentation

- [Architecture Overview](./overview.md)
- [Backend Architecture](./backend.md)
- [UI System ADR](../adr/0003-ui-system.md)
- [State Management ADR](../adr/0001-state-management.md)
