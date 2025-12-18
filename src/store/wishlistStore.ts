import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { WishlistItem } from '@/types'

interface WishlistStore {
  items: WishlistItem[]
  addItem: (productId: string) => void
  removeItem: (productId: string) => void
  toggleItem: (productId: string) => void
  isFavorite: (productId: string) => boolean
  clearWishlist: () => void
  syncWithFirestore: (items: WishlistItem[]) => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (productId) => {
        set((state) => {
          const exists = state.items.some((item) => item.productId === productId)
          if (exists) return state
          return {
            items: [
              ...state.items,
              { productId, addedAt: new Date() },
            ],
          }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }))
      },

      toggleItem: (productId) => {
        const { isFavorite, addItem, removeItem } = get()
        if (isFavorite(productId)) {
          removeItem(productId)
        } else {
          addItem(productId)
        }
      },

      isFavorite: (productId) => {
        return get().items.some((item) => item.productId === productId)
      },

      clearWishlist: () => {
        set({ items: [] })
      },

      syncWithFirestore: (items) => {
        set({ items })
      },
    }),
    {
      name: 'wishlist-store',
    }
  )
)
