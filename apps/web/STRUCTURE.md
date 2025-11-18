# Apps/Web Folder Structure

This document describes the reorganized folder structure of the Next.js web application.

## Overview

The application now follows a feature-first, scalable folder structure that separates concerns and makes the codebase easier to navigate and maintain.

## Directory Structure

```
apps/web/src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── (dashboard)/       # Dashboard route group  
│   ├── (public)/          # Public routes
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout with Providers
│   └── page.tsx           # Home page
│
├── components/            # Shared UI components
│   ├── ui/               # Reusable primitives (Button, Input, Select, Dialog, etc.)
│   ├── feedback/         # User feedback components (Toast, Alert, Skeleton, EmptyState)
│   ├── data/             # Data display components (Table, Card abstractions)
│   └── layout/           # Layout wrapper components
│
├── features/             # Feature-specific code
│   ├── auth/            # Authentication forms and logic
│   ├── coding/          # Coding editor and related components
│   └── exam/            # Exam-related components
│
├── providers/           # App-level providers
│   ├── index.tsx       # Main Providers component
│   ├── query-provider.tsx  # React Query provider
│   └── store.ts        # Zustand store configuration
│
├── lib/                # Utility libraries
│   ├── auth/          # Authentication utilities
│   ├── database/      # Database clients and utilities
│   ├── utils/         # General utilities
│   └── utils.ts       # Utility functions
│
└── hooks/             # Shared React hooks

## Path Aliases

The following TypeScript path aliases are configured in `tsconfig.json`:

- `@/*` - Root src directory
- `@/components/*` - Components directory
- `@/features/*` - Features directory
- `@/providers/*` - Providers directory
- `@/lib/*` - Lib directory
- `@/hooks/*` - Hooks directory

## Key Principles

1. **Feature-First Organization**: Related functionality is grouped together in the `features/` directory
2. **Reusable Components**: Shared UI primitives live in `components/ui/`
3. **Clear Separation**: Business logic is separated from presentation
4. **Type Safety**: All code is fully typed with TypeScript
5. **Provider Pattern**: Global state and data fetching is managed through providers

## Providers

The app uses the following providers (wrapped in `src/providers/index.tsx`):

- **QueryProvider**: React Query for server state management
- **AuthProvider**: Authentication context and user session management
- **Zustand Store**: Available via `useAppStore` hook (no provider component needed)

## Migration Notes

All imports have been updated to use the new paths:
- `@/components/forms/*` → `@/features/auth/*`
- `@/components/coding/*` → `@/features/coding/*`
- `@/components/exam/*` → `@/features/exam/*`
- `@/components/editors/*` → `@/features/coding/*`
- `@/components/layouts/*` → `@/components/layout/*`
- `@/components/common/LoadingStates` → `@/components/feedback/LoadingStates`
- `@/components/common/UIComponents` → `@/components/data/UIComponents`

## Best Practices

1. Keep components focused and single-purpose
2. Use barrel exports (index.ts) for cleaner imports
3. Colocate related files (components, hooks, types) within features
4. Extract reusable UI components to `components/ui/`
5. Use TypeScript for all new code
6. Follow existing naming conventions
