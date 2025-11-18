'use client'

import { QueryProvider } from './query-provider'
import { AuthProvider } from '@/lib/auth/AuthContext'

/**
 * Providers component that wraps the app with all necessary providers.
 * This includes:
 * - QueryProvider (React Query for data fetching)
 * - AuthProvider (Authentication context)
 * 
 * Zustand stores don't need a provider component as they can be imported directly.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryProvider>
  )
}
