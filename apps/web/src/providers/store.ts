import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Example store - can be extended or split into feature-specific stores
interface AppStore {
  // Add your global state here
  // Example:
  // theme: 'light' | 'dark'
  // setTheme: (theme: 'light' | 'dark') => void
}

export const useAppStore = create<AppStore>()(
  devtools(
    (set) => ({
      // Initialize state here
    }),
    {
      name: 'app-store',
    }
  )
)
