import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client for browser
export const createClient = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Set session timeout to 3 hours (10800 seconds)
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: {
        // Custom storage implementation to handle session timeout
        getItem: (key: string) => {
          const item = localStorage.getItem(key)
          if (!item) return null
          
          try {
            const parsed = JSON.parse(item)
            // Check if session has expired (3 hours = 10800 seconds)
            if (parsed.expires_at && Date.now() / 1000 > parsed.expires_at) {
              localStorage.removeItem(key)
              return null
            }
            return item
          } catch {
            return item
          }
        },
        setItem: (key: string, value: string) => {
          try {
            const parsed = JSON.parse(value)
            // Set expiration time to 3 hours from now
            if (parsed.access_token && !parsed.expires_at) {
              parsed.expires_at = Math.floor(Date.now() / 1000) + 10800 // 3 hours
              value = JSON.stringify(parsed)
            }
          } catch {
            // If not JSON, store as is
          }
          localStorage.setItem(key, value)
        },
        removeItem: (key: string) => {
          localStorage.removeItem(key)
        }
      }
    }
  })
}

export default createClient
