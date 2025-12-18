import { create } from 'zustand'

interface UIStore {
  isMobileMenuOpen: boolean
  isCartOpen: boolean
  isSearchOpen: boolean
  selectedCategory: string | null
  toggleMobileMenu: () => void
  toggleCart: () => void
  toggleSearch: () => void
  setCategory: (category: string | null) => void
  closeAll: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  isMobileMenuOpen: false,
  isCartOpen: false,
  isSearchOpen: false,
  selectedCategory: null,

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  toggleCart: () =>
    set((state) => ({ isCartOpen: !state.isCartOpen })),

  toggleSearch: () =>
    set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  setCategory: (category) =>
    set({ selectedCategory: category }),

  closeAll: () =>
    set({
      isMobileMenuOpen: false,
      isCartOpen: false,
      isSearchOpen: false,
    }),
}))
