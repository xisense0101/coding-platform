'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/database/client'
import type { User as DatabaseUser } from '@/lib/database/types'
import { AuthStoreSync } from './AuthStoreSync'

import { logger } from '@/lib/utils/logger'

// Client-side cache for user profiles
const profileCache = new Map<string, { profile: DatabaseUser; expiresAt: number }>()
const PROFILE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface AuthContextType {
  user: User | null
  userProfile: DatabaseUser | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string, nextPath?: string) => Promise<{ data?: any; error?: AuthError | null }>
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<{ data?: any; error?: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error?: AuthError | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<DatabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  const supabase = createClient()

  // Get user profile from database with caching
  const getUserProfile = async (userId: string, forceRefresh = false): Promise<DatabaseUser | null> => {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = profileCache.get(userId)
        if (cached && cached.expiresAt > Date.now()) {
          logger.log('✅ Using cached profile for user:', userId)
          return cached.profile
        }
      }

      logger.log('📡 Fetching fresh profile from database for user:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        // If profile doesn't exist, return null instead of throwing error
        if (error.code === 'PGRST116') {
          logger.log('User profile not found, user might be in the process of registration')
          return null
        }
        logger.error('Error fetching user profile:', error)
        return null
      }
      
      // Cache the profile
      if (data) {
        profileCache.set(userId, {
          profile: data,
          expiresAt: Date.now() + PROFILE_CACHE_TTL
        })
        logger.log('💾 Cached profile for user:', userId)
      }
      
      return data
    } catch (error) {
      logger.error('Unexpected error fetching user profile:', error)
      return null
    }
  }

  const loadUserProfile = async (userId: string) => {
    const profile = await getUserProfile(userId)
    
    // Check if account is suspended
    if (profile && !profile.is_active) {
      logger.warn('Suspended account detected, signing out user')
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setUserProfile(null)
      router.replace('/auth/login?error=suspended')
      return
    }
    
    setUserProfile(profile)
  }

  const refreshProfile = async () => {
    if (user) {
      // Clear cache and force refresh
      profileCache.delete(user.id)
      await loadUserProfile(user.id)
    }
  }

  // Get initial session
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          logger.error('Error getting initial session:', error)
          setIsLoading(false)
          return
        }

        setSession(initialSession)
        setUser(initialSession?.user ?? null)

        if (initialSession?.user) {
          await loadUserProfile(initialSession.user.id)
        }
        
        setIsLoading(false)
      } catch (error) {
        logger.error('Error in getInitialSession:', error)
        setIsLoading(false)
      }
    }

    getInitialSession()
  }, [])

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: Session | null) => {
        // Only log significant events, not initial session loads
        if (event !== 'INITIAL_SESSION') {
          logger.log('Auth state changed:', event, session?.user?.id)
        }
        
        // Handle different auth events
        if (event === 'SIGNED_IN') {
          // Don't process SIGNED_IN here if we're in the middle of our own signIn
          // This prevents double-loading the profile
          return
        }
        
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setUserProfile(null)
          profileCache.clear()
          router.replace('/auth/login')
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            await loadUserProfile(session.user.id)
          }
          return
        }

        if (event === 'USER_UPDATED' && session) {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            await loadUserProfile(session.user.id)
          }
          return
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string, nextPath?: string) => {
    try {
      logger.log('🔐 Starting sign in process...')
      setIsLoading(true)
      
      // Clear any existing state first
      setUser(null)
      setUserProfile(null)
      setSession(null)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logger.error('❌ Sign in error:', error)
        setIsLoading(false)
        return { error }
      }

      if (data.user && data.session) {
        logger.log('✅ Authentication successful, setting session...')
        
        // Set session and user immediately
        setSession(data.session)
        setUser(data.user)
        
        // Get user profile for role-based redirect
        const userProfile = await getUserProfile(data.user.id)
        
        if (userProfile) {
          // Check if account is suspended
          if (!userProfile.is_active) {
            logger.warn('⚠️ Account is suspended')
            // Sign out the user immediately
            await supabase.auth.signOut()
            setSession(null)
            setUser(null)
            setUserProfile(null)
            setIsLoading(false)
            return { error: { message: 'Your account has been suspended. Please contact your administrator for assistance.' } as AuthError }
          }

          setUserProfile(userProfile)
          logger.log('✅ User profile set:', userProfile.role)
          
          // Update last login (don't wait for it)
          supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id)
            .then(() => logger.log('Last login updated'))

          // Determine redirect path
          let redirectPath: string
          
          // If a nextPath was provided and is a safe internal path, prefer it
          const isSafeNext = !!nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
          if (isSafeNext) {
            redirectPath = nextPath!
          } else {
            // Otherwise redirect based on user role
            const roleRedirects = {
              'teacher': '/teacher/dashboard',
              'admin': '/admin/dashboard', 
              'student': '/student/dashboard',
              'super_admin': '/admin/dashboard'
            } as const
            
            redirectPath = roleRedirects[userProfile.role] || '/student/dashboard'
          }
          
          logger.log('🚀 Redirecting to:', redirectPath)
          
          // Stop loading BEFORE navigation
          setIsLoading(false)
          
          // Small delay to ensure state is propagated
          await new Promise(resolve => setTimeout(resolve, 50))
          
          // Use replace to avoid back button issues
          router.replace(redirectPath)
          
          return { data }
        } else {
          // Profile not found, redirect to login
          logger.error('❌ User profile not found')
          setIsLoading(false)
          return { error: { message: 'User profile not found' } as AuthError }
        }
      }

      setIsLoading(false)
      return { data }
    } catch (error) {
      logger.error('❌ Sign in error:', error)
      setIsLoading(false)
      return { error: error as AuthError }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: string = 'student') => {
    try {
      setIsLoading(true)
      
      // First, get or create a default organization
      let organizationId: string
      
      try {
        // Try to get the default organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', 'default')
          .single()
        
        if (orgError || !orgData) {
          // Create default organization if it doesn't exist
          const { data: newOrg, error: createOrgError } = await supabase
            .from('organizations')
            .insert({
              name: 'Default Organization',
              slug: 'default',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select('id')
            .single()
          
          if (createOrgError || !newOrg) {
            throw new Error('Failed to create default organization')
          }
          
          organizationId = newOrg.id
        } else {
          organizationId = orgData.id
        }
      } catch (orgError) {
        logger.error('Error handling organization:', orgError)
        throw new Error('Failed to setup organization')
      }
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          }
        }
      })

      if (authError) {
        return { error: authError }
      }

      if (authData.user) {
        // Create user profile with organization_id
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            organization_id: organizationId,
            email: authData.user.email!,
            full_name: fullName,
            role: role as any,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (profileError) {
          logger.error('Error creating user profile:', profileError)
          return { error: { message: profileError.message } as AuthError }
        }
      }

      return { data: authData }
    } catch (error) {
      logger.error('Sign up error:', error)
      return { error: error as AuthError }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      logger.log('🚪 Starting logout process...')
      setIsLoading(true)
      
      const currentUserId = user?.id
      
      // Clear client-side cache FIRST
      if (currentUserId) {
        profileCache.delete(currentUserId)
        logger.log('🗑️ Cleared profile cache')
      }
      
      // Clear local state immediately to prevent UI flickering
      setUser(null)
      setUserProfile(null)
      setSession(null)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      
      if (error) {
        logger.error('⚠️ Supabase sign out error:', error)
        // Continue with logout even if there's an error
      } else {
        logger.log('✅ Successfully signed out from Supabase')
      }
      
      // Clear localStorage session data
      try {
        if (typeof window !== 'undefined') {
          const supabaseKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('sb-') || key.includes('supabase')
          )
          supabaseKeys.forEach(key => localStorage.removeItem(key))
          logger.log('🗑️ Cleared localStorage session data')
        }
      } catch (storageError) {
        logger.error('⚠️ Error clearing localStorage:', storageError)
      }
      
      // Force navigation with a small delay to ensure state is cleared
      logger.log('↪️ Redirecting to login page...')
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push('/auth/login')
      
    } catch (error) {
      logger.error('❌ Sign out error:', error)
      // Even if there's an error, ensure state is cleared
      setUser(null)
      setUserProfile(null)
      setSession(null)
      if (user?.id) profileCache.delete(user.id)
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (!error && user) {
        await supabase
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', user.id)
      }

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const value: AuthContextType = {
    user,
    userProfile,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      <AuthStoreSync />
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
