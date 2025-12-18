// Temporary module declarations to satisfy TypeScript in the editor
declare module '@/lib/firebase' {
  import type { Firestore } from 'firebase/firestore'
  export const db: any
  export default db
}

declare module '@/components/layout/Header' {
  import type { FC } from 'react'
  export const Header: FC<any>
}

declare module '@/components/layout/Footer' {
  import type { FC } from 'react'
  export const Footer: FC<any>
}

declare module '@/components/products/ProductCard' {
  import type { FC } from 'react'
  const ProductCard: FC<any>
  export default ProductCard
}

declare module '@/components/products/ProductReviews' {
  import type { FC } from 'react'
  export const ProductReviews: FC<any>
}

declare module '@/types' {
  export type Product = any
  export type Review = any
}

declare module '@/store/cartStore' {
  export const useCartStore: any
}

declare module '@/store/wishlistStore' {
  export const useWishlistStore: any
}

declare module '@/store/authStore' {
  export const useAuthStore: any
}

declare module '@/services/whatsappService' {
  export function sendOrderNotification(...args: any[]): Promise<any>
}
