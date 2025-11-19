/**
 * Auth Store Sync - Bridge between AuthContext and Zustand store
 * Synchronizes auth state from AuthContext to Zustand for global access
 */

'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useAppStore } from '@/lib/store'

/**
 * Component that synchronizes AuthContext with Zustand store
 * Place this inside AuthProvider but outside of main app content
 */
export function AuthStoreSync() {
  const { user, userProfile } = useAuth()
  const setAuthState = useAppStore((state) => state.setAuthState)
  const setUserProfile = useAppStore((state) => state.setUserProfile)
  const clearAuthState = useAppStore((state) => state.clearAuthState)
  const clearUserProfile = useAppStore((state) => state.clearUserProfile)

  useEffect(() => {
    if (user) {
      // Sync auth state to Zustand
      setAuthState(true, user.id)
    } else {
      // Clear auth state in Zustand
      clearAuthState()
    }
  }, [user, setAuthState, clearAuthState])

  useEffect(() => {
    if (userProfile) {
      // Sync user profile to Zustand
      setUserProfile(userProfile)
    } else {
      // Clear user profile in Zustand
      clearUserProfile()
    }
  }, [userProfile, setUserProfile, clearUserProfile])

  // This component doesn't render anything
  return null
}
