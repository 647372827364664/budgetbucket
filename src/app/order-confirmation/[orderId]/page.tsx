'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  CheckCircle, 
  Package, 
  MapPin, 
  CreditCard, 
  Truck,
  Phone,
  ArrowLeft,
  Share2,
  Clock,
  ShoppingBag
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  category?: string
}

interface OrderData {
  orderId: string
  userId: string
  customerInfo: {
    name: string
    email?: string
    phone: string
  }
  items: OrderItem[]
  address: {
    id?: string
    name: string
    phone: string
    street: string
    city: string
    state: string
    pincode: string
  }
  summary: {
    subtotal: number
    tax: number
    shipping: number
    total: number
  }
  paymentMethod: string
  orderDate: string
  status: string
  paymentStatus: string
  paymentId?: string
  createdAt: any
  estimatedDelivery: string
}

interface PageProps {
  params: Promise<{ orderId: string }>
}

export default function OrderConfirmationPage({ params }: PageProps) {
  const { orderId } = use(params)
  
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

  const fetchOrderDetails = async (retryCount = 0) => {
    const maxRetries = 5
    const retryDelay = 1500

    try {
      setLoading(true)
      setError(null)
      
      console.log(`Fetching order: ${orderId} (attempt ${retryCount + 1})`)
      
      // Fetch order data directly from Firebase
      const orderRef = doc(db, 'orders', orderId)
      const orderSnap = await getDoc(orderRef)
      
      if (!orderSnap.exists()) {
        if (retryCount < maxRetries) {
          console.log(`Order not found, retrying in ${retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return fetchOrderDetails(retryCount + 1)
        }
        
        setError('Order not found. Please check your order ID.')
        setLoading(false)
        return
      }
      
      const data = orderSnap.data()
      console.log('Order data fetched:', data)
      
      // Calculate estimated delivery (5 working days)
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + 5)
      
      const orderData: OrderData = {
        orderId: orderSnap.id,
        userId: data.userId || '',
        customerInfo: data.customerInfo || { name: 'Customer', phone: '' },
        items: Array.isArray(data.items) ? data.items : [],
        address: data.address || { name: '', phone: '', street: '', city: '', state: '', pincode: '' },
        summary: data.summary || { subtotal: 0, tax: 0, shipping: 0, total: 0 },
        paymentMethod: data.paymentMethod || 'cod',
        orderDate: data.orderDate || new Date().toISOString(),
        status: data.status || 'pending',
        paymentStatus: data.paymentStatus || 'pending',
        paymentId: data.paymentId,
        createdAt: data.createdAt,
        estimatedDelivery: deliveryDate.toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      
      setOrder(orderData)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching order:', err)
      setError('Failed to load order details. Please try again.')
      setLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Order #${orderId}`,
          text: `I just placed an order on Budget Bucket!`,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } catch (err) {
      console.error('Share failed:', err)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading order details...</p>
          <p className="text-sm text-slate-400 mt-2">Order ID: {orderId}</p>
        </div>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h1>
          <p className="text-slate-600 mb-4">{error || 'Unable to load order details.'}</p>
          <p className="text-sm text-slate-400 mb-6">Order ID: {orderId}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => fetchOrderDetails()}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/orders"
              className="w-full py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors text-center"
            >
              View All Orders
            </Link>
            <Link
              href="/"
              className="w-full py-3 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors text-center"
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const isPaymentComplete = order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
  const isCOD = order.paymentMethod === 'cod'

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Continue Shopping</span>
            </Link>
            <h1 className="text-lg font-bold text-slate-900">Order Confirmation</h1>
            <button onClick={handleShare} className="p-2 text-slate-500 hover:text-slate-700">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {isCOD ? 'Order Placed Successfully!' : isPaymentComplete ? 'Payment Successful!' : 'Order Confirmed!'}
          </h2>
          <p className="text-green-100">
            {isCOD 
              ? 'Your order has been placed. Pay on delivery.' 
              : 'Thank you for your purchase!'
            }
          </p>
        </div>

        {/* Order ID Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Order ID</p>
              <p className="text-xl font-bold text-slate-900 font-mono">{order.orderId}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-slate-500 mb-1">Order Date</p>
              <p className="font-medium text-slate-900">
                {new Date(order.orderDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Delivery Address</h3>
            </div>
            <div className="text-slate-600 space-y-1">
              <p className="font-medium text-slate-900">{order.address.name}</p>
              <p>{order.address.street}</p>
              <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
              {order.address.phone && (
                <p className="flex items-center gap-2 text-slate-500 mt-2">
                  <Phone className="w-4 h-4" />
                  {order.address.phone}
                </p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Payment Details</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Method</span>
                <span className="font-medium text-slate-900 capitalize">
                  {isCOD ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isPaymentComplete ? 'bg-green-100 text-green-700' :
                  isCOD ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {isPaymentComplete ? 'Paid' : isCOD ? 'Pay on Delivery' : 'Pending'}
                </span>
              </div>
              {order.paymentId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment ID</span>
                  <span className="font-mono text-sm text-slate-700">{order.paymentId.slice(0, 15)}...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estimated Delivery */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Estimated Delivery</h3>
              <p className="text-green-600 font-medium">{order.estimatedDelivery}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>You will receive updates via SMS and email</span>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Order Items ({order.items.length})</h3>
          </div>
          
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                <div className="relative w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{item.name}</p>
                  <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.summary.subtotal)}</span>
            </div>
            {order.summary.tax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span>{formatCurrency(order.summary.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span>{order.summary.shipping === 0 ? 'Free' : formatCurrency(order.summary.shipping)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span className="text-purple-600">{formatCurrency(order.summary.total)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/orders"
            className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium text-center hover:bg-purple-700 transition-colors"
          >
            View All Orders
          </Link>
          <Link
            href="/products"
            className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium text-center hover:bg-slate-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  )
}
