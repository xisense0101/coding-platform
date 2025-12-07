import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Server-side Supabase client (for use in server components and API routes)
export const createSupabaseServerClient = () => {
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Handle cookie setting errors in API routes
            // This can happen if cookies are set in a Server Component
          }
        },
      },
    }
  )
}

// Admin client with service role key (for admin operations)
export const createAdminClient = () => {
  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
    throw new Error('Missing Supabase service role key. Please set SUPABASE_SERVICE_ROLE_KEY in your .env.local file')
  }
  
  if (!supabaseServiceKey.startsWith('eyJ')) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY appears to be invalid (should start with "eyJ")')
    throw new Error('Invalid Supabase service role key format')
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  })
}
