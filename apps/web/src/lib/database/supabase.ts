import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

import { logger } from '@/lib/utils/logger'

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client (for use in components)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'enterprise-edu-platform'
    }
  }
})

// Client component client (for use in client components with SSR)
export const createBrowserClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Types for common operations
export type SupabaseClient = typeof supabase

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  logger.error('Supabase error:', error)
  
  if (error?.message) {
    return error.message
  }
  
  if (error?.error_description) {
    return error.error_description
  }
  
  return 'An unexpected error occurred'
}

// Helper function to check if user is authenticated
export const checkAuth = async (client: any) => {
  try {
    const { data: { user }, error } = await client.auth.getUser()
    
    if (error) {
      logger.error('Auth check error:', error)
      return null
    }
    
    return user
  } catch (error) {
    logger.error('Auth check failed:', error)
    return null
  }
}

// Helper function to get user profile
export const getUserProfile = async (
  client: any, 
  userId: string
) => {
  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      logger.error('Error fetching user profile:', error)
      return null
    }
    
    return data
  } catch (error) {
    logger.error('Error fetching user profile:', error)
    return null
  }
}

// Helper function to get organization details
export const getOrganization = async (
  client: any,
  organizationId: string
) => {
  try {
    const { data, error } = await client
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()
    
    if (error) {
      logger.error('Error fetching organization:', error)
      return null
    }
    
    return data
  } catch (error) {
    logger.error('Error fetching organization:', error)
    return null
  }
}

export default supabase
