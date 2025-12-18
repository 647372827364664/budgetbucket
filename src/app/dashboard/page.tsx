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
  TrendingUp,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
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
  recentOrders: any[]
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
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Fetch user profile and stats from Firestore
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
          loyaltyPoints: 0,
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
            createdAt: firestoreData.createdAt,
          }
        }

        setUserProfile(profileData)

        // 2. Fetch orders for this user
        let totalOrdersCount = 0
        let totalSpentAmount = 0
        let recentOrdersList: any[] = []

        try {
          const ordersRef = collection(db, 'orders')
          // Query all docs but filter locally since we need userId matching
          const snapshot = await getDocs(ordersRef)
          
          snapshot.forEach((doc) => {
            const orderData = doc.data()
            // Check if this order belongs to current user
            if (orderData.userId === user.id) {
              totalOrdersCount++
              totalSpentAmount += orderData.totalAmount || orderData.total || 0
              
              recentOrdersList.push({
                id: doc.id,
                ...orderData,
              })
            }
          })

          // Sort by date and get recent 5
          recentOrdersList = recentOrdersList
            .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
            .slice(0, 5)
        } catch (err: any) {
          // Permission denied is expected if orders collection has no data yet
          console.log('Orders fetch (expected on first use):', err.code)
        }

        // 3. Fetch wishlist items
        let wishlistCount = 0
        try {
          const wishlistRef = collection(db, 'wishlist')
          const snapshot = await getDocs(wishlistRef)
          
          snapshot.forEach((doc) => {
            const wishlistData = doc.data()
            // Check if this belongs to current user
            if (wishlistData.userId === user.id || doc.id === user.id) {
              wishlistCount = (wishlistData.items || []).length
            }
          })
        } catch (err: any) {
          // Permission denied is expected on first use
          console.log('Wishlist fetch (expected on first use):', err.code)
        }

        // 4. Calculate stats
        setStats({
          totalOrders: totalOrdersCount,
          totalSpent: totalSpentAmount,
          wishlistItems: wishlistCount,
          addresses: profileData.addresses?.length || 0,
          activeCoupons: 0, // Will be calculated from coupons collection if exists
          loyaltyPoints: profileData.loyaltyPoints || 0,
          recentOrders: recentOrdersList,
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // Set default stats on error
        setStats({
          totalOrders: 0,
          totalSpent: 0,
          wishlistItems: 0,
          addresses: 0,
          activeCoupons: 0,
          loyaltyPoints: 0,
          recentOrders: [],
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, router])

  const handleLogout = async () => {
    try {
      await logoutUser()
      authLogout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user || !userProfile) return null

  const quickLinks = [
    {
      label: 'Orders',
      href: '/orders',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      stat: stats.totalOrders,
    },
    {
      label: 'Wishlist',
      href: '/wishlist',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      stat: stats.wishlistItems,
    },
    {
      label: 'Cart',
      href: '/cart',
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      stat: 0,
    },
    {
      label: 'Addresses',
      href: '/profile/addresses',
      icon: User,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      stat: stats.addresses,
    },
  ]

  const accountLinks = [
    {
      label: 'Edit Profile',
      href: '/profile',
      icon: User,
      description: 'Update your personal information',
    },
    {
      label: 'Addresses',
      href: '/profile/addresses',
      icon: Package,
      description: 'Manage delivery addresses',
    },
    {
      label: 'Settings',
      href: '/profile/settings',
      icon: Settings,
      description: 'Account settings and preferences',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <span className="text-white font-black text-xl">BB</span>
            </div>
            <div>
              <p className="font-black text-lg text-gray-900">Budget Bucket</p>
              <p className="text-xs text-gray-600">Dashboard</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-semibold transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">
                Welcome back, {userProfile.name}! 👋
              </h1>
              <p className="text-lg text-gray-600">Here's your account overview</p>
            </div>
          </div>
        </div>        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            {
              label: 'Total Orders',
              value: stats.totalOrders,
              icon: Package,
              color: 'from-blue-600 to-blue-400',
              suffix: '',
            },
            {
              label: 'Total Spent',
              value: `₹${(stats.totalSpent || 0).toLocaleString('en-IN')}`,
              icon: TrendingUp,
              color: 'from-green-600 to-green-400',
              suffix: '',
            },
            {
              label: 'Loyalty Points',
              value: stats.loyaltyPoints,
              icon: Clock,
              color: 'from-yellow-600 to-yellow-400',
              suffix: '',
            },
            {
              label: 'Wishlist Items',
              value: stats.wishlistItems,
              icon: Heart,
              color: 'from-red-600 to-red-400',
              suffix: '',
            },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 truncate">{stat.value}</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Links */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Quick Actions</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {quickLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`${link.bgColor} ${link.color} rounded-xl p-4 hover:shadow-lg transition-all duration-300 group`}
                    >
                      <Icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                      <p className="font-bold text-sm">{link.label}</p>
                      {link.stat > 0 && (
                        <p className="text-xs opacity-75 mt-1">{link.stat} items</p>
                      )}
                    </Link>
                  )
                })}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Account Settings</h3>
                <div className="space-y-2">
                  {accountLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <Icon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{link.label}</p>
                            <p className="text-sm text-gray-600">{link.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Profile</h3>

              {/* Profile Image */}
              <div className="flex justify-center mb-6">
                {userProfile.profileImage ? (
                  <img
                    src={userProfile.profileImage}
                    alt={userProfile.name}
                    className="w-24 h-24 rounded-full border-4 border-purple-200 object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center border-4 border-purple-200 shadow-lg">
                    <span className="text-4xl font-black text-white">
                      {userProfile.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="text-center mb-6">
                <h4 className="font-bold text-lg text-gray-900 mb-1">{userProfile.name}</h4>
                <p className="text-sm text-gray-600 break-all">{userProfile.email}</p>
                {userProfile.phone && (
                  <p className="text-sm text-gray-600 mt-1">{userProfile.phone}</p>
                )}
              </div>

              {/* Member Since */}
              <div className="text-center py-4 bg-purple-50 rounded-lg mb-6">
                <p className="text-xs text-gray-600 mb-1">Member Since</p>
                <p className="font-bold text-gray-900">
                  {userProfile.createdAt
                    ? new Date(userProfile.createdAt.toMillis?.() || userProfile.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Today'}
                </p>
              </div>

              {/* Loyalty Points Badge */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 mb-6 border border-yellow-200">
                <p className="text-xs text-yellow-700 font-bold uppercase tracking-wide mb-1">Loyalty Points</p>
                <p className="text-3xl font-black text-yellow-600">{stats.loyaltyPoints}</p>
              </div>

              {/* Edit Profile Button */}
              <Link
                href="/profile"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mb-3"
              >
                <User className="w-5 h-5" />
                Edit Profile
              </Link>

              <button
                onClick={handleLogout}
                className="w-full border border-red-200 hover:bg-red-50 text-red-600 font-bold py-3 px-4 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 inline mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Recent Orders</h2>

          {stats.totalOrders === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold mb-4">No orders yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Start shopping to see your orders here
              </p>
              <Link
                href="/"
                className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Order ID</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">{order.id?.slice(0, 8)}...</td>
                      <td className="py-3 px-4 text-gray-600">
                        {order.createdAt
                          ? new Date(order.createdAt.toMillis?.() || order.createdAt).toLocaleDateString('en-IN')
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
