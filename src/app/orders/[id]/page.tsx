'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/store/authStore'
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Copy,
  ExternalLink,
  Download,
  Home,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  MapPin,
  User,
  PackageCheck,
  ShieldCheck,
  HelpCircle,
  RotateCcw,
  Star,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { toast } from 'react-hot-toast'

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface Order {
  id: string
  orderNumber: string
  userId: string
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  discount?: number
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod?: string
  paymentId?: string
  awbCode?: string
  courierName?: string
  trackingUrl?: string
  estimatedDelivery?: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: {
    name: string
    phone: string
    street: string
    city: string
    state: string
    pincode: string
  }
  createdAt: string
  updatedAt?: string
  deliveredAt?: string
  notes?: string
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated } = useAuthStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/orders')
      return
    }
    if (params.id) {
      fetchOrderDetails()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, params.id, router])

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const orderRef = doc(db, 'orders', params.id as string)
      const orderDoc = await getDoc(orderRef)
      
      if (!orderDoc.exists()) {
        setError('Order not found')
        return
      }
      
      const data = orderDoc.data()
      
      if (data.userId !== user?.id) {
        setError('You do not have permission to view this order')
        return
      }
      
      // Helper to safely parse numbers
      const parseNumber = (val: any): number => {
        if (typeof val === 'number' && !isNaN(val)) return val
        if (typeof val === 'string') {
          const parsed = parseFloat(val)
          return isNaN(parsed) ? 0 : parsed
        }
        return 0
      }
      
      // Parse items with safe number handling
      const rawItems = data.items || data.products || []
      const parsedItems: OrderItem[] = rawItems.map((item: any) => ({
        productId: item.productId || item.id || '',
        name: item.name || item.productName || 'Product',
        price: parseNumber(item.price || item.unitPrice || item.productPrice),
        quantity: parseNumber(item.quantity || item.qty || 1),
        image: item.image || item.imageUrl || item.productImage || ''
      }))
      
      // Calculate subtotal from items if not provided
      const calculatedSubtotal = parsedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      // Handle different order data structures
      const pricing = data.pricing || {}
      const subtotal = parseNumber(data.subtotal ?? pricing.subtotal) || calculatedSubtotal
      const tax = parseNumber(data.tax ?? pricing.tax ?? data.taxAmount)
      const shipping = parseNumber(data.shipping ?? data.shippingCost ?? pricing.shipping ?? data.deliveryCharge)
      const discount = parseNumber(data.discount ?? data.discountAmount ?? pricing.discount)
      const total = parseNumber(data.total ?? data.totalAmount ?? pricing.total) || (subtotal + tax + shipping - discount)
      
      // Handle different status field names
      const status = data.status || data.orderStatus || 'pending'
      
      // Handle customer info
      const customerInfo = data.customerInfo || {}
      const customerName = data.customerName || customerInfo.name || user?.name || 'Customer'
      const customerEmail = data.customerEmail || customerInfo.email || user?.email || ''
      const customerPhone = data.customerPhone || customerInfo.phone || user?.phone || ''
      
      // Handle shipping address
      const shippingAddress = data.shippingAddress || data.address || null
      
      setOrder({
        id: orderDoc.id,
        orderNumber: data.orderNumber || data.orderId || orderDoc.id.slice(0, 12).toUpperCase(),
        userId: data.userId,
        items: parsedItems,
        subtotal,
        tax,
        shipping,
        discount,
        total,
        status: status as Order['status'],
        paymentStatus: data.paymentStatus || 'pending',
        paymentMethod: data.paymentMethod || 'N/A',
        paymentId: data.paymentId || data.razorpayPaymentId,
        awbCode: data.awbCode || data.trackingNumber,
        courierName: data.courierName || data.shippingCarrier,
        trackingUrl: data.trackingUrl,
        estimatedDelivery: data.estimatedDelivery?.toDate?.()?.toISOString() || data.estimatedDelivery || null,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress: shippingAddress ? {
          name: shippingAddress.name || shippingAddress.fullName || customerName,
          phone: shippingAddress.phone || shippingAddress.mobile || customerPhone,
          street: shippingAddress.street || shippingAddress.addressLine1 || shippingAddress.line1 || '',
          city: shippingAddress.city || '',
          state: shippingAddress.state || '',
          pincode: shippingAddress.pincode || shippingAddress.postalCode || shippingAddress.zip || ''
        } : undefined,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        deliveredAt: data.deliveredAt?.toDate?.()?.toISOString() || null,
        notes: data.notes
      })
    } catch (err) {
      console.error('Error fetching order:', err)
      setError('Failed to load order details')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500', ring: 'ring-emerald-100', label: 'Delivered' }
      case 'shipped':
        return { icon: Truck, color: 'text-blue-600', bg: 'bg-blue-500', ring: 'ring-blue-100', label: 'Shipped' }
      case 'processing':
        return { icon: Package, color: 'text-amber-600', bg: 'bg-amber-500', ring: 'ring-amber-100', label: 'Processing' }
      case 'cancelled':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-500', ring: 'ring-red-100', label: 'Cancelled' }
      default:
        return { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-500', ring: 'ring-orange-100', label: 'Pending' }
    }
  }

  const getPaymentStatusInfo = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'completed':
        return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Paid' }
      case 'failed':
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Failed' }
      case 'refunded':
        return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Refunded' }
      default:
        return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Pending' }
    }
  }

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number | undefined | null) => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(safeAmount)
  }

  const getTrackingTimeline = () => {
    if (!order) return []

    const timeline: { status: string; icon: React.ElementType; label: string; description: string; date?: string | null; completed: boolean; current: boolean }[] = [
      { 
        status: 'pending', 
        icon: ShieldCheck, 
        label: 'Order Placed', 
        description: 'Your order has been placed successfully',
        date: order.createdAt, 
        completed: true, 
        current: order.status === 'pending' 
      },
      { 
        status: 'processing', 
        icon: Package, 
        label: 'Order Confirmed', 
        description: 'Seller has processed your order',
        date: ['processing', 'shipped', 'delivered'].includes(order.status) ? order.updatedAt : null,
        completed: ['processing', 'shipped', 'delivered'].includes(order.status), 
        current: order.status === 'processing' 
      },
      { 
        status: 'shipped', 
        icon: Truck, 
        label: 'Shipped', 
        description: order.awbCode ? `Tracking: ${order.awbCode}` : 'Package is on the way',
        date: ['shipped', 'delivered'].includes(order.status) ? order.updatedAt : null,
        completed: ['shipped', 'delivered'].includes(order.status), 
        current: order.status === 'shipped' 
      },
      { 
        status: 'delivered', 
        icon: PackageCheck, 
        label: 'Delivered', 
        description: 'Package has been delivered',
        date: order.deliveredAt, 
        completed: order.status === 'delivered', 
        current: order.status === 'delivered' 
      }
    ]

    if (order.status === 'cancelled') {
      return [
        { 
          status: 'pending', 
          icon: ShieldCheck, 
          label: 'Order Placed', 
          description: 'Your order was placed',
          date: order.createdAt, 
          completed: true, 
          current: false 
        },
        { 
          status: 'cancelled', 
          icon: AlertCircle, 
          label: 'Order Cancelled', 
          description: 'This order was cancelled',
          date: order.updatedAt, 
          completed: true, 
          current: true 
        }
      ]
    }

    return timeline
  }

  if (!isAuthenticated) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
            <Package className="absolute inset-0 m-auto w-8 h-8 text-purple-600" />
          </div>
          <p className="text-slate-600 font-medium text-lg">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Oops! Something went wrong</h2>
          <p className="text-slate-600 mb-8">{error || 'Order not found'}</p>
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

  const statusInfo = getStatusInfo(order.status)
  const StatusIcon = statusInfo.icon
  const paymentInfo = getPaymentStatusInfo(order.paymentStatus)
  const timeline = getTrackingTimeline()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
        <div className="container-custom py-5">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                Order Details
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-slate-600">Order #</span>
                <span className="font-mono font-bold text-slate-900 text-lg">{order.orderNumber}</span>
                <button
                  onClick={() => copyToClipboard(order.orderNumber)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full ${statusInfo.bg} text-white shadow-lg`}>
                <StatusIcon className="w-5 h-5" />
                <span className="font-bold">{statusInfo.label}</span>
              </div>
              <button className="flex items-center gap-2 px-5 py-2.5 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold">
                <Download className="w-4 h-4" />
                Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Tracking Timeline Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50/30">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-600" />
                  Order Tracking
                </h2>
              </div>
              
              <div className="p-6">
                {/* AWB Tracking Card */}
                {order.awbCode && (
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white shadow-xl shadow-blue-500/25">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-blue-200 text-sm font-medium uppercase tracking-wide mb-2">AWB / Tracking Number</p>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-2xl font-bold">{order.awbCode}</span>
                          <button
                            onClick={() => copyToClipboard(order.awbCode!)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        </div>
                        {order.courierName && (
                          <p className="text-blue-100 mt-3 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Shipped via <span className="font-semibold">{order.courierName}</span>
                          </p>
                        )}
                      </div>
                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-bold shadow-lg"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Track on Courier Site
                        </a>
                      )}
                    </div>
                    {order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <div className="mt-5 pt-5 border-t border-white/20">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-200" />
                          <span className="text-blue-100">Expected Delivery:</span>
                          <span className="font-bold text-white text-lg">{formatDate(order.estimatedDelivery)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline */}
                <div className="relative">
                  {timeline.map((step, index) => {
                    const StepIcon = step.icon
                    const isLast = index === timeline.length - 1
                    
                    return (
                      <div key={step.status} className="flex gap-6 pb-8 last:pb-0">
                        {/* Timeline Line & Icon */}
                        <div className="flex flex-col items-center">
                          <div className={`relative flex items-center justify-center w-12 h-12 rounded-full ${
                            step.completed 
                              ? step.current 
                                ? `${statusInfo.bg} text-white ring-4 ${statusInfo.ring} shadow-lg` 
                                : 'bg-emerald-500 text-white'
                              : 'bg-slate-200 text-slate-400'
                          }`}>
                            <StepIcon className="w-5 h-5" />
                            {step.current && !['delivered', 'cancelled'].includes(step.status) && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-ping"></span>
                            )}
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 flex-1 mt-3 ${
                              step.completed && timeline[index + 1]?.completed 
                                ? 'bg-emerald-500' 
                                : 'bg-slate-200'
                            }`}></div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 pt-2">
                          <h3 className={`font-bold text-lg ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.label}
                          </h3>
                          <p className={`text-sm mt-1 ${step.completed ? 'text-slate-600' : 'text-slate-400'}`}>
                            {step.description}
                          </p>
                          {step.date && (
                            <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDateTime(step.date)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Order Items Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50/30">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Items in this Order
                  <span className="ml-2 px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                    {order.items?.length || 0}
                  </span>
                </h2>
              </div>
              
              <div className="divide-y divide-slate-100">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-5 p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden relative flex-shrink-0 border border-slate-200">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                          <Package className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-semibold text-slate-900 hover:text-purple-600 transition-colors text-lg line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <p className="text-slate-600 mt-1">Quantity: <span className="font-semibold">{item.quantity}</span></p>
                      <p className="font-bold text-purple-600 text-xl mt-2">{formatCurrency((item.price || 0) * (item.quantity || 1))}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-slate-500 text-sm">{formatCurrency(item.price || 0)} each</p>
                      {order.status === 'delivered' && (
                        <div className="mt-3 space-y-2">
                          <button className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium">
                            <Star className="w-4 h-4" />
                            Write Review
                          </button>
                          <button className="flex items-center gap-1 text-slate-600 hover:text-slate-700 text-sm font-medium">
                            <RotateCcw className="w-4 h-4" />
                            Buy Again
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50/30">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Order Summary
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className={`font-semibold ${order.shipping === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(order.tax)}</span>
                </div>
                {order.discount && order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Discount
                    </span>
                    <span className="font-semibold">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="pt-4 border-t-2 border-dashed border-slate-200 flex justify-between">
                  <span className="font-bold text-slate-900 text-lg">Grand Total</span>
                  <span className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Info Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50/30">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Payment
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Status</span>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${paymentInfo.bg} ${paymentInfo.color} ${paymentInfo.border} border`}>
                    {paymentInfo.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Method</span>
                  <span className="font-semibold text-slate-900 capitalize">{order.paymentMethod || 'N/A'}</span>
                </div>
                {order.paymentId && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Transaction</span>
                    <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded">{order.paymentId.slice(0, 16)}...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50/30">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Home className="w-5 h-5 text-purple-600" />
                  Shipping Address
                </h2>
              </div>
              <div className="p-6">
                {order.shippingAddress ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="font-bold text-slate-900 text-lg">{order.shippingAddress.name}</span>
                    </div>
                    <div className="flex items-start gap-3 pl-1">
                      <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="text-slate-600">
                        <p>{order.shippingAddress.street}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                        <p className="font-semibold text-slate-900">{order.shippingAddress.pincode}</p>
                      </div>
                    </div>
                    {order.shippingAddress.phone && (
                      <div className="flex items-center gap-3 pl-1">
                        <Phone className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-600">{order.shippingAddress.phone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500">No address provided</p>
                )}
              </div>
            </div>

            {/* Order Info Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50/30">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Order Info
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-slate-500 text-sm">Placed on</p>
                    <p className="font-semibold text-slate-900">{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>
                {order.customerEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-600">{order.customerEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Need Help Card */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-purple-500/25">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Need Help?</h3>
                  <p className="text-purple-200 text-sm">We&apos;re here for you</p>
                </div>
              </div>
              <p className="text-purple-100 text-sm mb-5">
                Have questions about your order? Our support team is ready to assist you 24/7.
              </p>
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-colors font-bold"
              >
                <Mail className="w-5 h-5" />
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
