'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, Truck, Home, Phone } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

interface OrderDetails {
  id: string
  invoiceId: string
  invoiceUrl?: string
  orderStatus: string
  paymentStatus: string
  paymentId?: string
  razorpayOrderId?: string
  total: number
  subtotal: number
  tax: number
  shippingCost: number
  items: Array<{
    productId: string
    name: string
    quantity: number
    price: number
  }>
  address: {
    name: string
    street: string
    city: string
    state: string
    postalCode: string
    phone: string
  }
  createdAt: string
  estimatedDelivery?: string
}

export default function OrderSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const { clearCart } = useCartStore()

  const orderId = searchParams.get('orderId')
  const paymentId = searchParams.get('paymentId')
  const razorpayOrderId = searchParams.get('razorpayOrderId')
  
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!orderId) {
      router.push('/products')
      return
    }

    // Fetch order details
    fetchOrderDetails()
    clearCart()
  }, [user, orderId, router, clearCart])

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/orders/${orderId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch order details')
      }

      const data = await response.json()
      
      // Merge payment details from URL parameters if available
      if (paymentId || razorpayOrderId) {
        setOrder({
          ...data,
          paymentId: paymentId || data.paymentId,
          razorpayOrderId: razorpayOrderId || data.razorpayOrderId
        })
      } else {
        setOrder(data)
      }
      
      setError(null)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load order')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading order details...</p>
        </div>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container-custom py-16 text-center">
          <p className="text-red-600 mb-6">{error || 'Order not found'}</p>
          <Link href="/products" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </main>
    )
  }

  const paymentStatus = order.paymentStatus === 'completed' ? 'Paid' : 'Pending'
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Success Header */}
      <div className="bg-white border-b">
        <div className="container-custom py-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Order Confirmed!</h1>
          <p className="text-slate-600 mb-4">Thank you for your purchase. Your order has been received.</p>
          <p className="text-sm text-slate-500">Order ID: <span className="font-mono font-semibold">{order.invoiceId}</span></p>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Order Status</h2>

              <div className="flex items-center gap-4 mb-8">
                {/* Status Timeline */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 text-white font-bold">
                      ✓
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">Order Placed</p>
                      <p className="text-sm text-slate-600">{orderDate}</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-4 mb-6 ${order.orderStatus !== 'pending' ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${order.orderStatus !== 'pending' ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-600'} font-bold`}>
                      {order.orderStatus !== 'pending' ? '✓' : '◦'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">Order Confirmed</p>
                      <p className="text-sm text-slate-600">We'll prepare your items</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-4 mb-6 ${['shipped', 'delivered'].includes(order.orderStatus) ? 'opacity-100' : 'opacity-50'}`}>
                    <Truck className={`w-12 h-12 p-2 rounded-full ${['shipped', 'delivered'].includes(order.orderStatus) ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-600'}`} />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">Shipped</p>
                      <p className="text-sm text-slate-600">Order on the way</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-4 ${order.orderStatus === 'delivered' ? 'opacity-100' : 'opacity-50'}`}>
                    <Package className={`w-12 h-12 p-2 rounded-full ${order.orderStatus === 'delivered' ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-600'}`} />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">Delivered</p>
                      <p className="text-sm text-slate-600">{order.estimatedDelivery || 'Arriving soon'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">{order.items.length}</p>
                  <p className="text-sm text-slate-600">Items</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">₹{order.total.toFixed(2)}</p>
                  <p className="text-sm text-slate-600">Total Amount</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{paymentStatus}</p>
                  <p className="text-sm text-slate-600">Payment</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="card p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center pb-4 border-b last:border-b-0">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="card p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Home size={20} />
                Delivery Address
              </h3>
              <div className="text-slate-700">
                <p className="font-semibold text-slate-900">{order.address.name}</p>
                <p>{order.address.street}</p>
                <p>{order.address.city}, {order.address.state} {order.address.postalCode}</p>
                <p className="flex items-center gap-2 mt-3">
                  <Phone size={16} />
                  {order.address.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4 pb-4 border-b">
                <div className="flex justify-between text-slate-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Tax (18%)</span>
                  <span className="font-semibold">₹{order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Shipping</span>
                  <span className="font-semibold">{order.shippingCost === 0 ? 'Free' : `₹${order.shippingCost.toFixed(2)}`}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-2xl font-bold text-purple-600">₹{order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment & Invoice Details */}
            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Payment Details</h3>
              <div className="space-y-3 border-b pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Order ID:</span>
                  <span className="font-mono font-semibold text-slate-900">{order.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Invoice ID:</span>
                  <span className="font-mono font-semibold text-slate-900">{order.invoiceId}</span>
                </div>
                {order.paymentId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Payment ID:</span>
                    <span className="font-mono font-semibold text-slate-900">{order.paymentId}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Status:</span>
                  <span className={`font-semibold ${order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {order.paymentStatus === 'completed' ? '✓ Paid' : 'Pending'}
                  </span>
                </div>
              </div>
              {order.invoiceUrl && (
                <a 
                  href={order.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full text-center text-sm"
                >
                  📄 Download Invoice (PDF)
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="card p-6 space-y-3">
              <Link href={`/orders/${order.id}`} className="btn-primary w-full text-center">
                Track Order
              </Link>
              <Link href="/products" className="btn-outline w-full text-center">
                Continue Shopping
              </Link>
            </div>

            {/* Support */}
            <div className="card p-6 bg-blue-50 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Need Help?</h4>
              <p className="text-sm text-blue-800 mb-4">If you have any questions about your order, our support team is here to help.</p>
              <a href="mailto:sale.raghavinfratech@gmail.com\" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-white border-t py-8">
        <div className="container-custom text-center">
          <p className="text-slate-600 mb-4">Thank you for shopping with Budget Bucket!</p>
          <Link href="/products" className="text-purple-600 hover:text-purple-700 font-semibold">
            Explore More Products →
          </Link>
        </div>
      </div>
    </main>
  )
}
