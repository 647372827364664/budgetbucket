// User Types
export interface User {
  id: string
  phone: string
  name?: string
  email?: string
  profileImage?: string
  addresses: Address[]
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
  isBlocked: boolean
}

export interface Address {
  id: string
  name: string
  phone: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

// Product Types
export interface Product {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  images: string[]
  stock: number
  category: string
  tags: ProductTag[]
  specifications: Specification[]
  rating?: number
  reviews?: Review[]
  createdAt: Date
  updatedAt: Date
  variants?: Variant[]
}

export type ProductTag = 'New' | 'Trending' | 'Hot' | 'BestSeller'

export interface Specification {
  key: string
  value: string
}

export interface Variant {
  id: string
  name: string
  values: string[]
  type: 'size' | 'color' | 'custom'
}

// Cart Types
export interface CartItem {
  productId: string
  id: string // Same as productId for convenience
  name: string
  image: string
  price: number
  originalPrice?: number
  category: string
  quantity: number
  stock: number
  selectedVariants?: Record<string, string>
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}

// Wishlist Types
export interface WishlistItem {
  productId: string
  addedAt: Date
}

// Order Types
export interface Order {
  id: string
  invoiceId: string
  userId: string
  items: OrderItem[]
  address: Address
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  paymentId?: string
  total: number
  subtotal: number
  tax: number
  shippingCost: number
  shipmentDetails?: ShipmentDetails
  createdAt: Date
  updatedAt: Date
  deliveryDate?: Date
}

export interface OrderItem {
  productId: string
  title: string
  price: number
  quantity: number
  image: string
  selectedVariants?: Record<string, string>
}

export interface ShipmentDetails {
  shipmentId: string
  awbNumber: string
  courier: string
  pickupLocation: string
  trackingStatus: TrackingStatus[]
  estimatedDelivery: Date
}

export interface TrackingStatus {
  status: ShipmentStatus
  timestamp: Date
  description: string
  location?: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type ShipmentStatus = 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'rto' | 'returned' | 'delivery_attempted'

// Review Types
export interface Review {
  id: string
  userId: string
  productId: string
  rating: number
  title: string
  comment: string
  images?: string[]
  createdAt: Date
  updatedAt: Date
  helpful: number
}

// Category Types
export interface Category {
  id: string
  name: string
  slug: string
  image?: string
  description?: string
  parentId?: string
  createdAt: Date
  updatedAt: Date
}

// Payment Types
export interface PaymentOrder {
  id: string
  amount: number
  currency: string
  receipt: string
  notes: {
    userId: string
    orderSummary: string
  }
}

export interface PaymentVerification {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

// Shiprocket Types
export interface ShiprocketShipment {
  shipment_id: number
  order_id: string
  awb_code: string
  courier_company_id: number
  courier_name: string
  pickup_location: string
  status: string
}

// Auth Types
export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

// Admin Dashboard Types
export interface DashboardStats {
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  todayRevenue: number
  topProducts: Product[]
  topCategories: CategoryStats[]
  recentOrders: Order[]
}

export interface CategoryStats {
  categoryId: string
  categoryName: string
  sales: number
  revenue: number
}
