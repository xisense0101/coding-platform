/**
 * App Store - Combined Zustand store with all slices
 * Main store configuration with typed selectors
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createAuthSlice, AuthSlice } from './slices/auth-slice'
import { createUserSlice, UserSlice } from './slices/user-slice'
import { createUiSlice, UiSlice } from './slices/ui-slice'

// Combined store type
export type AppStore = AuthSlice & UserSlice & UiSlice

/**
 * Main application store
 * Combines all slices with devtools middleware
 */
export const useAppStore = create<AppStore>()(
  devtools(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createUserSlice(...a),
      ...createUiSlice(...a),
    }),
    {
      name: 'app-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

/**
 * Typed selectors for better performance and type safety
 * Use these instead of accessing the store directly
 */

// Auth selectors
export const useAuth = () => useAppStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  userId: state.userId,
}))

export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated)
export const useUserId = () => useAppStore((state) => state.userId)

// User selectors
export const useUserProfile = () => useAppStore((state) => state.userProfile)

// UI selectors
export const useSidebarOpen = () => useAppStore((state) => state.sidebarOpen)
export const useGlobalLoading = () => useAppStore((state) => state.globalLoading)
export const useModal = (modalId: string) => 
  useAppStore((state) => state.modals[modalId] ?? false)

// Action selectors (for components that need to dispatch actions)
export const useAuthActions = () => useAppStore((state) => ({
  setAuthState: state.setAuthState,
  clearAuthState: state.clearAuthState,
}))

export const useUserActions = () => useAppStore((state) => ({
  setUserProfile: state.setUserProfile,
  clearUserProfile: state.clearUserProfile,
}))

export const useUiActions = () => useAppStore((state) => ({
  toggleSidebar: state.toggleSidebar,
  setSidebarOpen: state.setSidebarOpen,
  setGlobalLoading: state.setGlobalLoading,
  openModal: state.openModal,
  closeModal: state.closeModal,
  toggleModal: state.toggleModal,
}))
