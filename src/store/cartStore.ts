import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Cart, CartItem } from '@/types'

interface CartStore extends Cart {
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  calculateTotal: () => void
  syncWithFirestore: (items: CartItem[]) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,

      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.productId === item.productId)
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        })
        get().calculateTotal()
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }))
        get().calculateTotal()
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }))
        get().calculateTotal()
      },

      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 })
      },

      calculateTotal: () => {
        const state = get()
        const total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const itemCount = state.items.reduce((count, item) => count + item.quantity, 0)
        set({ total, itemCount })
      },

      syncWithFirestore: (items) => {
        set({ items })
        get().calculateTotal()
      },
    }),
    {
      name: 'cart-store',
    }
  )
)
