/**
 * User Slice - User profile state management
 * Minimal state for user profile data
 */

import { StateCreator } from 'zustand'
import type { User } from '@/lib/database/types'

export interface UserSlice {
  // User profile state
  userProfile: User | null
  
  // Actions
  setUserProfile: (profile: User | null) => void
  clearUserProfile: () => void
}

export const createUserSlice: StateCreator<
  UserSlice,
  [],
  [],
  UserSlice
> = (set) => ({
  userProfile: null,

  setUserProfile: (profile) =>
    set({ userProfile: profile }),

  clearUserProfile: () =>
    set({ userProfile: null }),
})
