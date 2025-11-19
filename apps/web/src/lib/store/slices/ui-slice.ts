/**
 * UI/App Slice - Application UI state management
 * Global UI state like sidebar, modals, themes, etc.
 */

import { StateCreator } from 'zustand'

export interface UiSlice {
  // Sidebar state
  sidebarOpen: boolean
  
  // Loading states
  globalLoading: boolean
  
  // Modal states (extensible)
  modals: {
    [key: string]: boolean
  }
  
  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setGlobalLoading: (loading: boolean) => void
  openModal: (modalId: string) => void
  closeModal: (modalId: string) => void
  toggleModal: (modalId: string) => void
}

export const createUiSlice: StateCreator<
  UiSlice,
  [],
  [],
  UiSlice
> = (set) => ({
  sidebarOpen: true,
  globalLoading: false,
  modals: {},

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) =>
    set({ sidebarOpen: open }),

  setGlobalLoading: (loading) =>
    set({ globalLoading: loading }),

  openModal: (modalId) =>
    set((state) => ({
      modals: { ...state.modals, [modalId]: true },
    })),

  closeModal: (modalId) =>
    set((state) => ({
      modals: { ...state.modals, [modalId]: false },
    })),

  toggleModal: (modalId) =>
    set((state) => ({
      modals: { ...state.modals, [modalId]: !state.modals[modalId] },
    })),
})
