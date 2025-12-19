// Temporary module declarations to satisfy TypeScript in the editor
declare module '@/lib/firebase' {
  export const auth: any
  export const db: any
  export const storage: any
  export const googleProvider: any
  export const onAuthStateChanged: any
  export const signOut: any
  export const signInWithPhoneNumber: any
  export const PhoneAuthProvider: any
  export const signInWithCredential: any
  export const setPersistence: any
  export const browserLocalPersistence: any
  export default any
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

// `@/types` is provided by `src/types/index.ts`; avoid shadowing its exports here.

// removed store module fallbacks so real store types are used

declare module '@/services/whatsappService' {
  export function sendOrderNotification(...args: any[]): Promise<any>
}
