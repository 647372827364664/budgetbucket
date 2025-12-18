'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import {
  Truck,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Package,
  CheckCircle,
  MapPin,
  ExternalLink,
  Copy,
  Calendar,
  Phone,
  PackageCheck,
  Navigation,
  Sparkles
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { toast } from 'react-hot-toast'

interface TrackingUpdate {
  status: string
  timestamp: string
  location: string
  message: string
}

interface Order {
  id: string
  orderNumber: string
  userId: string
  awbCode?: string
  courierName?: string
  trackingUrl?: string
  estimatedDelivery?: string
  status: string
  shippingAddress?: {
    name: string
    phone: string
    street: string
    city: string
    state: string
    pincode: string
  }
  createdAt: string
}

interface TrackingData {
  orderId: string
  orderNumber: string
  trackingNumber: string
  carrierName: string
  currentStatus: string
  currentLocation: string
  estimatedDelivery: string
  trackingUrl?: string
  updates: TrackingUpdate[]
}

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [tracking, setTracking] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const orderId = params.id as string

  const fetchOrderAndTracking = useCallback(async (isRefresh = false) => {
    if (!user) return

    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      // Fetch order from Firebase
      const orderRef = doc(db, 'orders', orderId)
      const orderDoc = await getDoc(orderRef)

      if (!orderDoc.exists()) {
        setError('Order not found')
        return
      }

      const data = orderDoc.data()
      
      if (data.userId !== user.id) {
        setError('You do not have permission to view this order')
        return
      }

      const orderData: Order = {
        id: orderDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        estimatedDelivery: data.estimatedDelivery?.toDate?.()?.toISOString() || data.estimatedDelivery
      } as Order

      setOrder(orderData)

      if (!data.awbCode) {
        setError('')
        setTracking(null)
        return
      }

      // Build tracking data from order
      const trackingData: TrackingData = {
        orderId: orderDoc.id,
        orderNumber: data.orderNumber,
        trackingNumber: data.awbCode,
        carrierName: data.courierName || 'Courier Partner',
        currentStatus: getStatusLabel(data.status),
        currentLocation: data.status === 'delivered' 
          ? `${data.shippingAddress?.city || 'Destination'}`
          : 'In Transit',
        estimatedDelivery: data.estimatedDelivery?.toDate?.()?.toISOString() || data.estimatedDelivery || '',
        trackingUrl: data.trackingUrl,
        updates: generateTrackingUpdates(data)
      }

      setTracking(trackingData)
      setLastRefresh(new Date())
      setError('')
    } catch (err) {
      console.error('Error fetching tracking:', err)
      setError('Failed to fetch tracking information')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user, orderId])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/orders')
      return
    }

    fetchOrderAndTracking()
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchOrderAndTracking(true), 60000)
    return () => clearInterval(interval)
  }, [isAuthenticated, router, fetchOrderAndTracking])

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'Delivered'
      case 'shipped': return 'In Transit'
      case 'processing': return 'Order Confirmed'
      case 'pending': return 'Order Placed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const generateTrackingUpdates = (data: Record<string, unknown>): TrackingUpdate[] => {
    const updates: TrackingUpdate[] = []
    const createdAt = (data.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString() || new Date().toISOString()
    const updatedAt = (data.updatedAt as { toDate?: () => Date })?.toDate?.()?.toISOString() || createdAt
    const address = data.shippingAddress as Order['shippingAddress']

    // Always add order placed
    updates.push({
      status: 'Order Placed',
      timestamp: createdAt,
      location: 'Online',
      message: 'Your order has been placed successfully'
    })

    if (['processing', 'shipped', 'delivered'].includes(data.status as string)) {
      updates.push({
        status: 'Order Confirmed',
        timestamp: createdAt,
        location: 'Warehouse',
        message: 'Order has been confirmed and is being prepared'
      })
    }

    if (['shipped', 'delivered'].includes(data.status as string)) {
      updates.push({
        status: 'Shipped',
        timestamp: updatedAt,
        location: 'Dispatch Center',
        message: `Package picked up by ${data.courierName || 'courier partner'}`
      })

      updates.push({
        status: 'In Transit',
        timestamp: updatedAt,
        location: 'Transit Hub',
        message: 'Package is on the way to your location'
      })
    }

    if (data.status === 'delivered') {
      const deliveredAt = (data.deliveredAt as { toDate?: () => Date })?.toDate?.()?.toISOString() || updatedAt
      updates.push({
        status: 'Out for Delivery',
        timestamp: deliveredAt,
        location: address?.city || 'Your City',
        message: 'Package is out for delivery'
      })

      updates.push({
        status: 'Delivered',
        timestamp: deliveredAt,
        location: address?.city || 'Your City',
        message: 'Package has been delivered successfully'
      })
    }

    if (data.status === 'cancelled') {
      updates.push({
        status: 'Cancelled',
        timestamp: updatedAt,
        location: 'N/A',
        message: 'Order has been cancelled'
      })
    }

    return updates.reverse() // Most recent first
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const getStatusIcon = (status: string) => {
    if (status.toLowerCase().includes('delivered')) return CheckCircle
    if (status.toLowerCase().includes('transit') || status.toLowerCase().includes('out for')) return Truck
    if (status.toLowerCase().includes('shipped') || status.toLowerCase().includes('picked')) return Package
    if (status.toLowerCase().includes('confirmed')) return PackageCheck
    if (status.toLowerCase().includes('cancelled')) return AlertCircle
    return Clock
  }

  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes('delivered')) return 'text-emerald-600'
    if (status.toLowerCase().includes('transit')) return 'text-blue-600'
    if (status.toLowerCase().includes('out for')) return 'text-indigo-600'
    if (status.toLowerCase().includes('shipped')) return 'text-purple-600'
    if (status.toLowerCase().includes('confirmed')) return 'text-amber-600'
    if (status.toLowerCase().includes('cancelled')) return 'text-red-600'
    return 'text-slate-600'
  }

  const getStatusBg = (status: string) => {
    if (status.toLowerCase().includes('delivered')) return 'bg-emerald-500'
    if (status.toLowerCase().includes('transit')) return 'bg-blue-500'
    if (status.toLowerCase().includes('out for')) return 'bg-indigo-500'
    if (status.toLowerCase().includes('shipped')) return 'bg-purple-500'
    if (status.toLowerCase().includes('confirmed')) return 'bg-amber-500'
    if (status.toLowerCase().includes('cancelled')) return 'bg-red-500'
    return 'bg-slate-500'
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (!isAuthenticated) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
            <Truck className="absolute inset-0 m-auto w-8 h-8 text-purple-600" />
          </div>
          <p className="text-slate-600 font-medium text-lg">Loading tracking information...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Order Not Found</h2>
          <p className="text-slate-600 mb-8">{error || 'We could not find this order.'}</p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  if (!tracking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60">
          <div className="container-custom py-5">
            <Link
              href={`/orders/${orderId}`}
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Order Details
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent mt-4">
              Order Tracking
            </h1>
          </div>
        </div>

        <div className="container-custom py-12">
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Tracking Not Available Yet</h2>
              <p className="text-slate-600 mb-6">
                Your order is being processed. Tracking details will be available once it&apos;s shipped.
              </p>
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="text-slate-600 text-sm">Order Number</p>
                <p className="font-mono font-bold text-slate-900 text-lg">{order.orderNumber}</p>
              </div>
              <Link
                href={`/orders/${orderId}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 font-semibold"
              >
                View Order Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CurrentStatusIcon = getStatusIcon(tracking.currentStatus)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
        <div className="container-custom py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link
                href={`/orders/${orderId}`}
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Order Details
              </Link>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent mt-3">
                Track Your Package
              </h1>
              <p className="text-slate-600 mt-1">Order #{tracking.orderNumber}</p>
            </div>
            <button
              onClick={() => fetchOrderAndTracking(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Current Status Hero Card */}
          <div className={`${getStatusBg(tracking.currentStatus)} rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden`}>
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
            </div>
            
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <CurrentStatusIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{tracking.currentStatus}</h2>
                      <p className="text-white/80 flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4" />
                        {tracking.currentLocation}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-6">
                    <div className="bg-white/20 rounded-xl px-4 py-3">
                      <p className="text-white/70 text-xs uppercase tracking-wide">Tracking Number</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono font-bold text-lg">{tracking.trackingNumber}</span>
                        <button
                          onClick={() => copyToClipboard(tracking.trackingNumber)}
                          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-white/20 rounded-xl px-4 py-3">
                      <p className="text-white/70 text-xs uppercase tracking-wide">Carrier</p>
                      <p className="font-bold text-lg mt-1 flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        {tracking.carrierName}
                      </p>
                    </div>
                  </div>
                </div>

                {tracking.trackingUrl && (
                  <a
                    href={tracking.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl hover:bg-slate-50 transition-colors font-bold shadow-lg"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Track on Courier Site
                  </a>
                )}
              </div>

              {tracking.estimatedDelivery && !tracking.currentStatus.toLowerCase().includes('delivered') && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-white/70" />
                    <div>
                      <p className="text-white/70 text-sm">Expected Delivery</p>
                      <p className="font-bold text-xl">{formatDate(tracking.estimatedDelivery)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          {order.shippingAddress && (
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Delivering To</h3>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</span>
                </div>
                {order.shippingAddress.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{order.shippingAddress.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tracking Timeline */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50/30">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Shipment Updates
              </h3>
            </div>

            <div className="p-6">
              {tracking.updates && tracking.updates.length > 0 ? (
                <div className="space-y-1">
                  {tracking.updates.map((update, index) => {
                    const UpdateIcon = getStatusIcon(update.status)
                    const isFirst = index === 0
                    const isLast = index === tracking.updates.length - 1
                    
                    return (
                      <div key={index} className="flex gap-5">
                        {/* Timeline */}
                        <div className="flex flex-col items-center">
                          <div className={`relative flex items-center justify-center w-10 h-10 rounded-full ${
                            isFirst 
                              ? `${getStatusBg(update.status)} text-white ring-4 ring-slate-100 shadow-lg` 
                              : 'bg-slate-200 text-slate-500'
                          }`}>
                            <UpdateIcon className="w-5 h-5" />
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 h-20 my-2 ${isFirst ? getStatusBg(update.status) : 'bg-slate-200'}`}></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-6">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h4 className={`font-bold text-lg ${isFirst ? getStatusColor(update.status) : 'text-slate-700'}`}>
                                {update.status}
                              </h4>
                              <p className="text-slate-600 mt-1 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {update.location}
                              </p>
                              {update.message && update.message !== update.status && (
                                <p className="text-slate-500 text-sm mt-2">{update.message}</p>
                              )}
                            </div>
                            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                              {formatDateTime(update.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-medium">No tracking updates available yet</p>
                  <p className="text-slate-500 text-sm mt-1">Check back soon for updates</p>
                </div>
              )}
            </div>
          </div>

          {/* Last Updated */}
          {lastRefresh && (
            <div className="text-center">
              <p className="text-sm text-slate-500">
                Last updated: {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                <span className="text-slate-400 mx-2">•</span>
                Auto-refreshes every minute
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
