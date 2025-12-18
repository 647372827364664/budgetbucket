'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import {
  ShoppingCart,
  Heart,
  Package,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  MapPin,
  Star,
  Shield,
  Sparkles,
  ArrowRight,
  Truck
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { logoutUser } from '@/services/authService'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface DashboardStats {
  totalOrders: number
  totalSpent: number
  wishlistItems: number
  addresses: number
  activeCoupons: number
  loyaltyPoints: number
  recentOrders: RecentOrder[]
  pendingOrders: number
  deliveredOrders: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  total: number
  status: string
  items: { name: string; image?: string }[]
  createdAt: any
}

interface UserProfile {
  id: string
  name?: string
  email?: string
  phone?: string
  profileImage?: string
  addresses?: any[]
  loyaltyPoints?: number
  createdAt?: any
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout: authLogout } = useAuthStore()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalSpent: 0,
    wishlistItems: 0,
    addresses: 0,
    activeCoupons: 0,
    loyaltyPoints: 0,
    recentOrders: [],
    pendingOrders: 0,
    deliveredOrders: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)

        // 1. Get user profile from Firestore
        const userDocRef = doc(db, 'users', user.id)
        const userDocSnap = await getDoc(userDocRef)

        let profileData: UserProfile = {
          id: user.id,
          name: user.name || 'User',
          email: user.email || '',
          phone: user.phone || '',
          profileImage: user.profileImage || '',
          addresses: [],
          loyaltyPoints: 0
        }

        if (userDocSnap.exists()) {
          const firestoreData = userDocSnap.data()
          profileData = {
            id: user.id,
            name: firestoreData.name || user.name || 'User',
            email: firestoreData.email || user.email || '',
            phone: firestoreData.phone || user.phone || '',
            profileImage: firestoreData.profileImage || user.profileImage || '',
            addresses: firestoreData.addresses || [],
            loyaltyPoints: firestoreData.loyaltyPoints || 0,
            createdAt: firestoreData.createdAt
          }
        }

        setUserProfile(profileData)

        // 2. Fetch orders for this user
        let totalOrdersCount = 0
        let totalSpentAmount = 0
        let pendingCount = 0
        let deliveredCount = 0
        let recentOrdersList: RecentOrder[] = []

        try {
          const ordersRef = collection(db, 'orders')
          const snapshot = await getDocs(ordersRef)
          
          snapshot.forEach((docSnap) => {
            const orderData = docSnap.data()
            if (orderData.userId === user.id) {
              totalOrdersCount++
              
              // Handle different total field structures
              const pricing = orderData.pricing || {}
              const orderTotal = orderData.total ?? pricing.total ?? orderData.totalAmount ?? 0
              const safeTotal = typeof orderTotal === 'number' && !isNaN(orderTotal) ? orderTotal : 0
              totalSpentAmount += safeTotal
              
              // Handle different status field names
              const orderStatus = orderData.status || orderData.orderStatus || 'pending'
              
              if (['pending', 'processing', 'shipped', 'confirmed'].includes(orderStatus)) {
                pendingCount++
              }
              if (orderStatus === 'delivered') {
                deliveredCount++
              }
              
              // Handle items array with different structures
              const items = orderData.items || []
              const mappedItems = items.map((item: any) => ({
                name: item.name || item.productName || 'Product',
                image: item.image || item.imageUrl || item.thumbnail || ''
              }))
              
              recentOrdersList.push({
                id: docSnap.id,
                orderNumber: orderData.orderNumber || orderData.orderId || docSnap.id.slice(0, 8).toUpperCase(),
                total: safeTotal,
                status: orderStatus,
                items: mappedItems,
                createdAt: orderData.createdAt
              })
            }
          })

          recentOrdersList = recentOrdersList
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0
              const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0
              return bTime - aTime
            })
            .slice(0, 5)
        } catch (err: any) {
          console.log('Orders fetch:', err.code || err.message)
        }

        // 3. Fetch wishlist items
        let wishlistCount = 0
        try {
          const wishlistRef = collection(db, 'wishlist')
          const snapshot = await getDocs(wishlistRef)
          
          snapshot.forEach((doc) => {
            const wishlistData = doc.data()
            if (wishlistData.userId === user.id || doc.id === user.id) {
              wishlistCount = (wishlistData.items || []).length
            }
          })
        } catch (err: any) {
          console.log('Wishlist fetch:', err.code)
        }

        setStats({
          totalOrders: totalOrdersCount,
          totalSpent: totalSpentAmount,
          wishlistItems: wishlistCount,
          addresses: profileData.addresses?.length || 0,
          activeCoupons: 0,
          loyaltyPoints: profileData.loyaltyPoints || 0,
          recentOrders: recentOrdersList,
          pendingOrders: pendingCount,
          deliveredOrders: deliveredCount
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setStats({
          totalOrders: 0,
          totalSpent: 0,
          wishlistItems: 0,
          addresses: 0,
          activeCoupons: 0,
          loyaltyPoints: 0,
          recentOrders: [],
          pendingOrders: 0,
          deliveredOrders: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.id]) // Only depend on user.id to prevent infinite loops

  const handleLogout = async () => {
    try {
      await logoutUser()
      authLogout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const formatCurrency = (amount: number | undefined | null) => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(safeAmount)
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'delivered':
        return { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Delivered' }
      case 'shipped':
        return { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Shipped' }
      case 'processing':
        return { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Processing' }
      case 'cancelled':
        return { color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelled' }
      default:
        return { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Pending' }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
            <User className="absolute inset-0 m-auto w-8 h-8 text-purple-600" />
          </div>
          <p className="text-slate-600 font-medium text-lg">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !userProfile) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-xl transition-shadow">
                <span className="text-white font-black text-xl">BB</span>
              </div>
              <div>
                <p className="font-bold text-lg text-slate-900">Budget Bucket</p>
                <p className="text-xs text-slate-600">My Account</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Continue Shopping
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Welcome Hero */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-10 mb-8 text-white shadow-2xl shadow-purple-500/30 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/3"></div>
          </div>
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white/30 shadow-xl flex-shrink-0">
                {userProfile.profileImage ? (
                  <Image
                    src={userProfile.profileImage}
                    alt={userProfile.name || 'User'}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center">
                    <span className="text-3xl font-bold">
                      {userProfile.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-purple-200 text-sm font-medium mb-1">Welcome back,</p>
                <h1 className="text-3xl md:text-4xl font-bold mb-1">{userProfile.name} 👋</h1>
                <p className="text-purple-200">{userProfile.email || userProfile.phone}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href="/profile/edit"
                className="flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-semibold border border-white/20"
              >
                <User className="w-4 h-4" />
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/20">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">{stats.totalOrders}</p>
              <p className="text-purple-200 text-sm mt-1">Total Orders</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">{formatCurrency(stats.totalSpent)}</p>
              <p className="text-purple-200 text-sm mt-1">Total Spent</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">{stats.loyaltyPoints}</p>
              <p className="text-purple-200 text-sm mt-1">Loyalty Points</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">{stats.wishlistItems}</p>
              <p className="text-purple-200 text-sm mt-1">Wishlist Items</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'My Orders', href: '/orders', icon: Package, color: 'from-blue-500 to-blue-600', stat: stats.totalOrders },
                { label: 'Wishlist', href: '/wishlist', icon: Heart, color: 'from-rose-500 to-pink-600', stat: stats.wishlistItems },
                { label: 'Cart', href: '/cart', icon: ShoppingCart, color: 'from-purple-500 to-indigo-600', stat: 0 },
                { label: 'Addresses', href: '/profile/addresses', icon: MapPin, color: 'from-emerald-500 to-green-600', stat: stats.addresses }
              ].map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-bold text-slate-900">{action.label}</p>
                    {action.stat > 0 && (
                      <p className="text-sm text-slate-500 mt-1">{action.stat} items</p>
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Order Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-4xl font-bold text-amber-600">{stats.pendingOrders}</span>
                </div>
                <h3 className="font-bold text-slate-900">Active Orders</h3>
                <p className="text-slate-600 text-sm mt-1">Orders in progress or shipping</p>
                <Link
                  href="/orders?status=pending"
                  className="inline-flex items-center gap-1 text-amber-600 font-semibold mt-4 hover:gap-2 transition-all"
                >
                  Track Orders <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-4xl font-bold text-emerald-600">{stats.deliveredOrders}</span>
                </div>
                <h3 className="font-bold text-slate-900">Delivered Orders</h3>
                <p className="text-slate-600 text-sm mt-1">Successfully delivered to you</p>
                <Link
                  href="/orders?status=delivered"
                  className="inline-flex items-center gap-1 text-emerald-600 font-semibold mt-4 hover:gap-2 transition-all"
                >
                  View History <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50/30 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Recent Orders
                </h2>
                <Link
                  href="/orders"
                  className="text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {stats.recentOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No orders yet</h3>
                  <p className="text-slate-600 mb-6">Start shopping to see your orders here</p>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 font-semibold"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.recentOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status)
                    return (
                      <Link
                        key={order.id}
                        href={`/orders/${order.id}`}
                        className="flex items-center gap-4 p-5 hover:bg-slate-50/50 transition-colors group"
                      >
                        <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          {order.items[0]?.image ? (
                            <Image
                              src={order.items[0].image}
                              alt=""
                              width={56}
                              height={56}
                              className="rounded-xl object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-slate-900">#{order.orderNumber}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusInfo.bg} ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 truncate">
                            {order.items.slice(0, 2).map(i => i.name).join(', ')}
                            {order.items.length > 2 && ` +${order.items.length - 2} more`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{formatCurrency(order.total)}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A'}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Settings Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50/30">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Account Settings
                </h2>
              </div>
              <div className="p-2">
                {[
                  { label: 'Edit Profile', href: '/profile/edit', icon: User, desc: 'Update your information' },
                  { label: 'Addresses', href: '/profile/addresses', icon: MapPin, desc: 'Manage delivery addresses' },
                  { label: 'Settings', href: '/profile/settings', icon: Settings, desc: 'Preferences & notifications' }
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <Icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{item.label}</p>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Loyalty Points Card */}
            <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-2xl p-6 text-white shadow-xl shadow-orange-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Loyalty Points</p>
                    <p className="text-3xl font-bold">{stats.loyaltyPoints}</p>
                  </div>
                </div>
                <p className="text-white/80 text-sm">
                  Earn points on every purchase and redeem for discounts!
                </p>
              </div>
            </div>

            {/* Member Since Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-bold text-slate-900">Member Status</h3>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <p className="text-sm text-slate-600 mb-1">Member Since</p>
                <p className="font-bold text-slate-900">
                  {userProfile.createdAt
                    ? new Date(userProfile.createdAt.toMillis?.() || userProfile.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Today'}
                </p>
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-purple-500/25">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Need Help?</h3>
                  <p className="text-purple-200 text-sm">We&apos;re here for you</p>
                </div>
              </div>
              <p className="text-purple-100 text-sm mb-5">
                Have questions about your orders or account? Our support team is ready to assist.
              </p>
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-colors font-bold"
              >
                Contact Support
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
