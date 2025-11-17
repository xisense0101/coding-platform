import { create } from 'zustand'

interface UIState {
  isSidebarOpen: boolean
  isMobileMenuOpen: boolean
  theme: 'light' | 'dark' | 'system'
  toggleSidebar: () => void
  toggleMobileMenu: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  closeMobileMenu: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  setTheme: (theme) => set({ theme }),
}))
