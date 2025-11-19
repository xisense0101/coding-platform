# Architecture Overview

## Introduction

The Coding Platform is an enterprise educational platform built as a monorepo using Next.js 14 (App Router) with Turbo workspaces. The platform provides a comprehensive learning management system for educational institutions with features for course management, coding exercises, exams, and user administration.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            Next.js 14 App Router (React 18)              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────────┐    │   │
│  │  │ UI System  │  │   Pages    │  │  Client State   │    │   │
│  │  │ (Radix UI) │  │ (App Dir)  │  │  (Context API)  │    │   │
│  │  └────────────┘  └────────────┘  └─────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Server (Node.js)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Server Components                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────────┐    │   │
│  │  │ Middleware │  │   Layouts  │  │  Server Pages   │    │   │
│  │  │ (Auth)     │  │            │  │                 │    │   │
│  │  └────────────┘  └────────────┘  └─────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   API Route Handlers                      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────────┐    │   │
│  │  │Controllers │  │  Services  │  │  Repositories   │    │   │
│  │  │ (Routes)   │→ │  (Logic)   │→ │  (Data Access)  │    │   │
│  │  └────────────┘  └────────────┘  └─────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ↓                    ↓                    ↓
     ┌──────────┐        ┌──────────┐        ┌──────────┐
     │ Supabase │        │  Redis   │        │ Judge0   │
     │ (Postgres)        │(Upstash) │        │   API    │
     │   + Auth │        │ (Cache)  │        │          │
     └──────────┘        └──────────┘        └──────────┘
```

## Major Components

### 1. Frontend Layer (Next.js App Router)

**Technology Stack:**
- Next.js 14 with App Router
- React 18 with Server Components
- TypeScript for type safety
- Tailwind CSS for styling
- Radix UI for accessible components

**Key Features:**
- Server-side rendering (SSR) for initial page loads
- Client-side navigation for fast transitions
- Feature-first directory structure in `src/app`
- Role-based layouts (Admin, Teacher, Student)
- Responsive design with mobile-first approach

### 2. State Management

**Client State:**
- React Context API for authentication state (`AuthProvider`)
- Session caching with in-memory cache (5-minute TTL)
- Profile caching to reduce database calls

**Server State:**
- Server Components fetch data directly
- No global state management library (Zustand/React Query not currently used)
- Data fetching at route handler level

### 3. Backend Layer (API Route Handlers)

**Architecture Pattern:**
- Controllers: Route handlers in `app/api/**/*.ts`
- Services: Business logic (inline in route handlers currently)
- Repositories: Data access via Supabase client

**Key Features:**
- RESTful API endpoints organized by resource
- Server-only code execution
- Built-in validation with Zod schemas
- Standardized error responses
- Request logging via custom logger

### 4. Data Layer

**Primary Database: Supabase (PostgreSQL)**
- User management and authentication
- Course and exam data
- Enrollments and submissions
- Organization hierarchies
- Row-level security (RLS) policies

**Caching: Redis (Upstash)**
- User profile caching
- Course and exam data caching
- Organization statistics
- Configurable TTL (1-60 minutes)
- Graceful degradation if Redis unavailable

**External Services:**
- Judge0 API: Code execution and testing
- Mailjet: Email notifications
- Supabase Storage: File uploads

### 5. Authentication & Authorization

**Authentication Flow:**
- Supabase Auth for user authentication
- JWT tokens stored in HTTP-only cookies
- Session validation in middleware
- 5-minute session cache for performance

**Authorization:**
- Role-based access control (RBAC)
- Roles: super_admin, admin, teacher, student
- Route protection via middleware
- API endpoint authorization checks

### 6. Middleware Layer

**Location:** `src/middleware.ts`

**Responsibilities:**
- Session validation and caching
- Role-based route protection
- Redirect authenticated users from auth pages
- Cookie management for Supabase auth
- Skip static assets and API routes

### 7. CI/CD Workflow

**Current State:**
- No GitHub Actions workflows configured
- Local development with Turbo
- Type checking with TypeScript
- Linting with ESLint

**Build Process:**
- Turbo for monorepo task orchestration
- Next.js build for production
- Type checking across all packages
- Lint checks before deployment

## Technology Decisions

### Why Next.js 14 App Router?

1. **Server Components**: Reduce client bundle size
2. **Improved Performance**: Built-in optimizations
3. **Better SEO**: Server-side rendering by default
4. **Simplified Data Fetching**: Async components
5. **File-based Routing**: Intuitive structure

### Why Turbo Monorepo?

1. **Build Caching**: Faster rebuilds
2. **Task Orchestration**: Parallel execution
3. **Workspace Management**: Multiple apps/packages
4. **Incremental Adoption**: Easy to scale

### Why Supabase?

1. **PostgreSQL**: Robust relational database
2. **Built-in Auth**: Reduce custom code
3. **Real-time**: WebSocket support
4. **Storage**: File upload solution
5. **RLS**: Database-level security

### Why Radix UI?

1. **Accessibility**: ARIA compliant
2. **Unstyled**: Full styling control
3. **Composable**: Flexible components
4. **Well-maintained**: Active development
5. **TypeScript**: Full type support

## Security Architecture

### Defense in Depth

1. **Network Layer**
   - HTTPS only in production
   - CORS configuration
   - Rate limiting (via Upstash Redis)

2. **Application Layer**
   - Input validation (Zod schemas)
   - Output encoding
   - CSRF protection (Next.js built-in)
   - Security headers

3. **Data Layer**
   - Row-level security (RLS)
   - Prepared statements (SQL injection prevention)
   - Encrypted credentials
   - Secure cookie flags

4. **Authentication Layer**
   - JWT tokens
   - HTTP-only cookies
   - Secure session management
   - Password hashing (Supabase)

## Performance Considerations

### Caching Strategy

1. **Server-side Cache**: Redis for database queries
2. **Client-side Cache**: In-memory for sessions/profiles
3. **Static Generation**: For public pages
4. **Incremental Static Regeneration**: For dynamic content

### Optimization Techniques

1. **Code Splitting**: Automatic with Next.js
2. **Image Optimization**: Next.js Image component
3. **Font Optimization**: Next.js font loading
4. **Bundle Analysis**: Available via npm scripts
5. **Database Query Optimization**: Selective field retrieval

## Scalability

### Horizontal Scaling

- Stateless Next.js servers
- Session storage in Supabase
- Redis for distributed caching
- CDN for static assets

### Vertical Scaling

- Database connection pooling
- Efficient queries with indexes
- Caching layer reduces DB load
- Async operations where possible

## Monitoring & Observability

### Logging

- Custom logger utility (`lib/utils/logger.ts`)
- Development vs. production modes
- Structured log format
- Error tracking capabilities

### Health Checks

- Basic endpoint availability
- Database connectivity
- Redis connectivity (optional)
- External service status

## Future Enhancements

1. **State Management**: Consider adding Zustand/React Query for complex client state
2. **CI/CD**: Implement GitHub Actions workflows
3. **Testing**: Add unit, integration, and E2E tests
4. **Monitoring**: Add APM solution (Sentry, DataDog)
5. **CDN**: Implement for static assets
6. **Internationalization**: Add i18n support
7. **Progressive Web App**: Add PWA capabilities

## Directory Structure

```
coding-platform/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/           # App Router pages and layouts
│       │   │   ├── (auth)/    # Auth route group
│       │   │   ├── (dashboard)/  # Dashboard route group
│       │   │   ├── (public)/  # Public route group
│       │   │   └── api/       # API route handlers
│       │   ├── components/    # React components
│       │   │   ├── ui/        # UI primitives (Radix)
│       │   │   ├── forms/     # Form components
│       │   │   ├── layouts/   # Layout components
│       │   │   └── ...        # Feature components
│       │   ├── hooks/         # Custom React hooks
│       │   ├── lib/           # Utilities and services
│       │   │   ├── auth/      # Authentication utilities
│       │   │   ├── database/  # Database clients
│       │   │   ├── redis/     # Redis client
│       │   │   └── utils/     # Helper functions
│       │   └── middleware.ts  # Next.js middleware
│       ├── public/            # Static assets
│       ├── package.json
│       └── next.config.js
├── docs/                      # Documentation
│   ├── architecture/          # Architecture docs
│   ├── adr/                   # Architecture Decision Records
│   └── runbooks/              # Operational runbooks
├── package.json               # Root package.json
└── turbo.json                 # Turbo configuration
```

## Related Documentation

- [Frontend Architecture](./frontend.md)
- [Backend Architecture](./backend.md)
- [State Management ADR](../adr/0001-state-management.md)
- [Backend Hardening ADR](../adr/0002-backend-hardening.md)
- [UI System ADR](../adr/0003-ui-system.md)
- [Local Development Guide](../runbooks/local-development.md)
