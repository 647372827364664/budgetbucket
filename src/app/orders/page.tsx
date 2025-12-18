'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/store/authStore'
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  ShoppingBag,
  RefreshCw,
  Copy,
  ExternalLink,
  Star,
  RotateCcw,
  HelpCircle,
  ArrowRight
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
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
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod?: string
  awbCode?: string
  courierName?: string
  trackingUrl?: string
  estimatedDelivery?: string
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
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTime, setFilterTime] = useState<string>('all')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/orders')
      return
    }
    fetchOrders()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router])

  const fetchOrders = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const ordersRef = collection(db, 'orders')
      
      try {
        const q = query(
          ordersRef,
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc')
        )
        const snapshot = await getDocs(q)
        const userOrders: Order[] = snapshot.docs.map(doc => {
          const data = doc.data()
          // Handle different data structures
          const pricing = data.pricing || {}
          const rawItems = data.items || data.products || []
          const parsedItems = rawItems.map((item: any) => ({
            productId: item.productId || item.id || '',
            name: item.name || item.productName || 'Product',
            price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
            quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1,
            image: item.image || item.imageUrl || ''
          }))
          const calculatedTotal = parsedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
          const total = data.total ?? pricing.total ?? data.totalAmount ?? calculatedTotal
          const status = data.status || data.orderStatus || 'pending'
          
          return {
            id: doc.id,
            orderNumber: data.orderNumber || data.orderId || doc.id.slice(0, 12).toUpperCase(),
            userId: data.userId,
            items: parsedItems,
            total: typeof total === 'number' && !isNaN(total) ? total : calculatedTotal,
            status: status as Order['status'],
            paymentStatus: data.paymentStatus || 'pending',
            paymentMethod: data.paymentMethod,
            awbCode: data.awbCode || data.trackingNumber,
            courierName: data.courierName,
            trackingUrl: data.trackingUrl,
            estimatedDelivery: data.estimatedDelivery?.toDate?.()?.toISOString() || data.estimatedDelivery || null,
            shippingAddress: data.shippingAddress || data.address,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
            deliveredAt: data.deliveredAt?.toDate?.()?.toISOString() || null
          } as Order
        })
        setOrders(userOrders)
      } catch {
        const snapshot = await getDocs(ordersRef)
        const userOrders: Order[] = []
        
        snapshot.docs.forEach(doc => {
          const data = doc.data()
          if (data.userId === user?.id) {
            // Handle different data structures
            const pricing = data.pricing || {}
            const rawItems = data.items || data.products || []
            const parsedItems = rawItems.map((item: any) => ({
              productId: item.productId || item.id || '',
              name: item.name || item.productName || 'Product',
              price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
              quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1,
              image: item.image || item.imageUrl || ''
            }))
            const calculatedTotal = parsedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
            const total = data.total ?? pricing.total ?? data.totalAmount ?? calculatedTotal
            const status = data.status || data.orderStatus || 'pending'
            
            userOrders.push({
              id: doc.id,
              orderNumber: data.orderNumber || data.orderId || doc.id.slice(0, 12).toUpperCase(),
              userId: data.userId,
              items: parsedItems,
              total: typeof total === 'number' && !isNaN(total) ? total : calculatedTotal,
              status: status as Order['status'],
              paymentStatus: data.paymentStatus || 'pending',
              paymentMethod: data.paymentMethod,
              awbCode: data.awbCode || data.trackingNumber,
              courierName: data.courierName,
              trackingUrl: data.trackingUrl,
              estimatedDelivery: data.estimatedDelivery?.toDate?.()?.toISOString() || data.estimatedDelivery || null,
              shippingAddress: data.shippingAddress || data.address,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
              deliveredAt: data.deliveredAt?.toDate?.()?.toISOString() || null
            } as Order)
          }
        })

        userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setOrders(userOrders)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      setOrders([])
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
        return { 
          icon: CheckCircle, 
          color: 'text-emerald-600', 
          bg: 'bg-gradient-to-r from-emerald-50 to-green-50', 
          border: 'border-emerald-200',
          badge: 'bg-emerald-500',
          label: 'Delivered',
          description: 'Your order has been delivered'
        }
      case 'shipped':
        return { 
          icon: Truck, 
          color: 'text-blue-600', 
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50', 
          border: 'border-blue-200',
          badge: 'bg-blue-500',
          label: 'Shipped',
          description: 'Your order is on the way'
        }
      case 'processing':
        return { 
          icon: Package, 
          color: 'text-amber-600', 
          bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', 
          border: 'border-amber-200',
          badge: 'bg-amber-500',
          label: 'Processing',
          description: 'Your order is being prepared'
        }
      case 'cancelled':
        return { 
          icon: AlertCircle, 
          color: 'text-red-600', 
          bg: 'bg-gradient-to-r from-red-50 to-rose-50', 
          border: 'border-red-200',
          badge: 'bg-red-500',
          label: 'Cancelled',
          description: 'This order was cancelled'
        }
      default:
        return { 
          icon: Clock, 
          color: 'text-orange-600', 
          bg: 'bg-gradient-to-r from-orange-50 to-amber-50', 
          border: 'border-orange-200',
          badge: 'bg-orange-500',
          label: 'Pending',
          description: 'Waiting for confirmation'
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    
    let matchesTime = true
    if (filterTime !== 'all') {
      const orderDate = new Date(order.createdAt)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
      
      switch (filterTime) {
        case '30days': matchesTime = daysDiff <= 30; break
        case '6months': matchesTime = daysDiff <= 180; break
        case '1year': matchesTime = daysDiff <= 365; break
      }
    }
    
    return matchesSearch && matchesStatus && matchesTime
  })

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Premium Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
        <div className="container-custom py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                Your Orders
              </h1>
              <p className="text-slate-600 mt-1">Track, return, or buy things again</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/products"
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
              >
                <ShoppingBag className="w-4 h-4" />
                Continue Shopping
              </Link>
              <button
                onClick={fetchOrders}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Search & Filters Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order ID, product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1.5">
                <Filter className="w-4 h-4 text-slate-400 ml-2" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-transparent border-none focus:ring-0 text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Time Filter */}
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1.5">
                <Calendar className="w-4 h-4 text-slate-400 ml-2" />
                <select
                  value={filterTime}
                  onChange={(e) => setFilterTime(e.target.value)}
                  className="px-3 py-2 bg-transparent border-none focus:ring-0 text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="30days">Last 30 days</option>
                  <option value="6months">Last 6 months</option>
                  <option value="1year">Last year</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-slate-600">
              Showing <span className="font-bold text-slate-900">{filteredOrders.length}</span> of {orders.length} orders
            </p>
            {(filterStatus !== 'all' || filterTime !== 'all' || searchTerm) && (
              <button
                onClick={() => { setFilterStatus('all'); setFilterTime('all'); setSearchTerm(''); }}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-slate-600 font-medium">Loading your orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">No orders found</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {orders.length === 0 
                ? "You haven't placed any orders yet. Start exploring our amazing products!" 
                : "No orders match your current filters. Try adjusting your search."}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 font-semibold"
            >
              <Package className="w-5 h-5" />
              Start Shopping
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              const StatusIcon = statusInfo.icon

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 group"
                >
                  {/* Order Header */}
                  <div className={`px-6 py-4 ${statusInfo.bg} ${statusInfo.border} border-b`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div>
                          <span className="text-slate-500 uppercase text-xs tracking-wide font-medium">Order Placed</span>
                          <p className="font-semibold text-slate-900 mt-0.5">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="hidden sm:block w-px h-10 bg-slate-300/60"></div>
                        <div>
                          <span className="text-slate-500 uppercase text-xs tracking-wide font-medium">Total</span>
                          <p className="font-bold text-slate-900 text-lg mt-0.5">{formatCurrency(order.total)}</p>
                        </div>
                        <div className="hidden md:block w-px h-10 bg-slate-300/60"></div>
                        <div className="hidden md:block">
                          <span className="text-slate-500 uppercase text-xs tracking-wide font-medium">Ship To</span>
                          <p className="font-semibold text-slate-900 mt-0.5">{order.shippingAddress?.name || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-slate-500 uppercase text-xs tracking-wide font-medium">Order #</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="font-mono font-bold text-slate-900">{order.orderNumber}</p>
                            <button
                              onClick={() => copyToClipboard(order.orderNumber)}
                              className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-6">
                    <div className="flex flex-col xl:flex-row gap-6">
                      {/* Status & Items */}
                      <div className="flex-1 space-y-5">
                        {/* Status Badge */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className={`flex items-center gap-2 px-4 py-2 ${statusInfo.bg} rounded-full border ${statusInfo.border}`}>
                            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                            <span className={`font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                          </div>
                          {order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <span className="text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-medium">
                              Expected by {formatDate(order.estimatedDelivery)}
                            </span>
                          )}
                          {order.deliveredAt && order.status === 'delivered' && (
                            <span className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-sm font-medium">
                              ✓ Delivered on {formatDate(order.deliveredAt)}
                            </span>
                          )}
                        </div>

                        {/* AWB Tracking */}
                        {order.awbCode && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Tracking Number</p>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-slate-900 text-lg">{order.awbCode}</span>
                                  <button
                                    onClick={() => copyToClipboard(order.awbCode!)}
                                    className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
                                  >
                                    <Copy className="w-4 h-4 text-blue-600" />
                                  </button>
                                </div>
                                {order.courierName && (
                                  <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                                    <Truck className="w-3.5 h-3.5" />
                                    {order.courierName}
                                  </p>
                                )}
                              </div>
                              {order.trackingUrl && (
                                <a
                                  href={order.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg shadow-blue-500/25"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Track Package
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Items Preview */}
                        <div className="flex flex-wrap gap-3">
                          {order.items?.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 pr-5 border border-slate-100 hover:border-slate-200 transition-colors">
                              <div className="w-16 h-16 bg-white rounded-lg overflow-hidden relative border border-slate-200 flex-shrink-0">
                                {item.image ? (
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                                    <Package className="w-6 h-6 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.name || 'Product'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Qty: {item.quantity || 1}</p>
                                <p className="text-sm font-bold text-purple-600 mt-1">{formatCurrency(item.price || 0)}</p>
                              </div>
                            </div>
                          ))}
                          {order.items?.length > 3 && (
                            <div className="flex items-center justify-center px-5 py-3 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-sm text-slate-600 font-medium">+{order.items.length - 3} more</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row xl:flex-col gap-3 xl:w-52">
                        <Link
                          href={`/orders/${order.id}`}
                          className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 font-semibold group-hover:scale-[1.02]"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                        
                        {order.status === 'delivered' && (
                          <>
                            <button className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold">
                              <Star className="w-4 h-4" />
                              Rate Order
                            </button>
                            <button className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold">
                              <RotateCcw className="w-4 h-4" />
                              Buy Again
                            </button>
                          </>
                        )}
                        
                        {order.status === 'shipped' && order.trackingUrl && (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-3 border-2 border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all font-semibold"
                          >
                            <Truck className="w-4 h-4" />
                            Track
                          </a>
                        )}
                        
                        <Link
                          href="/contact"
                          className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold"
                        >
                          <HelpCircle className="w-4 h-4" />
                          Help
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
