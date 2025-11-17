import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'student' | 'teacher' | 'admin' | 'super_admin'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  organization_id: string
  is_active: boolean
  avatar_url?: string
}

interface UserState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'user-storage',
    }
  )
)
