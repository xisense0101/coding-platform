/**
 * Auth Slice - Authentication state management
 * Minimal state that complements the existing AuthContext
 */

import { StateCreator } from 'zustand'

export interface AuthSlice {
  // Minimal auth state for global access
  isAuthenticated: boolean
  userId: string | null
  
  // Actions
  setAuthState: (isAuthenticated: boolean, userId: string | null) => void
  clearAuthState: () => void
}

export const createAuthSlice: StateCreator<
  AuthSlice,
  [],
  [],
  AuthSlice
> = (set) => ({
  isAuthenticated: false,
  userId: null,

  setAuthState: (isAuthenticated, userId) =>
    set({ isAuthenticated, userId }),

  clearAuthState: () =>
    set({ isAuthenticated: false, userId: null }),
})
