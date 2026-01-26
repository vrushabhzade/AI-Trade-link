import { create } from 'zustand'

interface UIState {
  isLoading: boolean
  error: string | null
  successMessage: string | null
  isMobileMenuOpen: boolean
  isOffline: boolean
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSuccessMessage: (message: string | null) => void
  clearMessages: () => void
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  setOffline: (offline: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  error: null,
  successMessage: null,
  isMobileMenuOpen: false,
  isOffline: false,

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ error, successMessage: null }),
  
  setSuccessMessage: (message: string | null) => set({ successMessage: message, error: null }),
  
  clearMessages: () => set({ error: null, successMessage: null }),
  
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  
  setOffline: (offline: boolean) => set({ isOffline: offline }),
}))
