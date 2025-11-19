'use client'

/**
 * App Providers - Centralized provider configuration
 * Wraps the app with QueryClientProvider, Hydration, and devtools
 */

import { useState } from 'react'
import { QueryClient, QueryClientProvider, HydrationBoundary, DehydratedState } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

interface ProvidersProps {
  children: React.ReactNode
  dehydratedState?: DehydratedState
}

/**
 * Create QueryClient with sensible defaults
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: 5 minutes (data is fresh for this duration)
        staleTime: 5 * 60 * 1000,
        
        // Garbage collection time: 10 minutes (cached data kept for this duration)
        gcTime: 10 * 60 * 1000,
        
        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          // Retry up to 2 times for other errors
          return failureCount < 2
        },
        
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch on window focus only if data is stale
        refetchOnWindowFocus: false,
        
        // Refetch on reconnect only if data is stale
        refetchOnReconnect: 'always',
        
        // Don't refetch on mount by default (use stale data)
        refetchOnMount: false,
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        
        // Retry delay for mutations
        retryDelay: 1000,
      },
    },
  })
}

// Browser client instance (singleton)
let browserQueryClient: QueryClient | undefined = undefined

/**
 * Get or create QueryClient for browser
 */
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return makeQueryClient()
  } else {
    // Browser: create client once and reuse
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
  }
}

/**
 * Providers component that wraps the app
 */
export function Providers({ children, dehydratedState }: ProvidersProps) {
  // NOTE: Avoid useState to ensure same client is used across renders
  // This prevents client recreation which would cause issues
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        {children}
        {/* Only show devtools in development */}
        {process.env.NODE_ENV !== 'production' && (
          <ReactQueryDevtools
            initialIsOpen={false}
            position="bottom"
            buttonPosition="bottom-right"
          />
        )}
      </HydrationBoundary>
    </QueryClientProvider>
  )
}
