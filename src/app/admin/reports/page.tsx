'use client'

import { useState, useEffect } from 'react'
import { 
  Download, 
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  RefreshCw,
  FileText,
  PieChart,
  Activity,
  ArrowUpRight,
  Boxes,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { collection, getDocs, Timestamp } from 'firebase/firestore'

interface ReportData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalCustomers: number
  newCustomersThisMonth: number
  
  ordersByStatus: {
    pending: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
  }
  
  topProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
    image: string
  }>
  
  topCategories: Array<{
    name: string
    count: number
    revenue: number
  }>
  
  recentOrders: Array<{
    id: string
    customer: string
    amount: number
    status: string
    date: string
  }>
  
  monthlyRevenue: Array<{
    month: string
    revenue: number
    orders: number
  }>
}

// Firebase document types
interface OrderDocument {
  id: string
  createdAt?: Timestamp | string
  total?: number
  totalAmount?: number
  status?: string
  items?: Array<{
    productId?: string
    name?: string
    quantity?: number
    price?: number
    image?: string
    category?: string
  }>
  customerName?: string
  userName?: string
}

interface ProductDocument {
  id: string
  stock?: number
  minStockLevel?: number
  category?: string
}

interface UserDocument {
  id: string
  createdAt?: Timestamp | string
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [selectedPeriod])

  const fetchReports = async () => {
    try {
      setIsLoading(true)
      
      // Get date range based on selected period
      const now = new Date()
      let startDate = new Date()
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1)
          break
        default:
          startDate = new Date(2020, 0, 1) // All time
      }

      // Fetch all data in parallel
      const [ordersSnapshot, productsSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'users'))
      ])

      // Process orders with proper typing
      const orders: OrderDocument[] = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as OrderDocument))

      // Process products with proper typing
      const products: ProductDocument[] = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProductDocument))

      // Process users with proper typing
      const users: UserDocument[] = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserDocument))

      // Filter orders by date range
      const filteredOrders = orders.filter(order => {
        const orderDate = order.createdAt instanceof Timestamp 
          ? order.createdAt.toDate() 
          : new Date(order.createdAt || 0)
        return orderDate >= startDate
      })

      // Calculate metrics
      const totalRevenue = filteredOrders.reduce((sum, order) => {
        const amount = typeof order.total === 'number' ? order.total : 
                       typeof order.totalAmount === 'number' ? order.totalAmount : 0
        return sum + amount
      }, 0)

      const totalOrders = filteredOrders.length
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Order status breakdown
      const ordersByStatus = {
        pending: filteredOrders.filter(o => o.status === 'pending').length,
        processing: filteredOrders.filter(o => o.status === 'processing').length,
        shipped: filteredOrders.filter(o => o.status === 'shipped').length,
        delivered: filteredOrders.filter(o => o.status === 'delivered').length,
        cancelled: filteredOrders.filter(o => o.status === 'cancelled').length
      }

      // Product metrics
      const lowStockProducts = products.filter(p => {
        const stock = typeof p.stock === 'number' ? p.stock : 0
        const minStock = typeof p.minStockLevel === 'number' ? p.minStockLevel : 10
        return stock > 0 && stock <= minStock
      }).length

      const outOfStockProducts = products.filter(p => {
        const stock = typeof p.stock === 'number' ? p.stock : 0
        return stock === 0
      }).length

      // Top products by sales (from order items)
      const productSales: Record<string, { name: string, sales: number, revenue: number, image: string }> = {}
      filteredOrders.forEach(order => {
        const items = Array.isArray(order.items) ? order.items : []
        items.forEach((item: { productId?: string, name?: string, quantity?: number, price?: number, image?: string }) => {
          const productId = item.productId || 'unknown'
          if (!productSales[productId]) {
            productSales[productId] = {
              name: item.name || 'Unknown Product',
              sales: 0,
              revenue: 0,
              image: item.image || ''
            }
          }
          productSales[productId].sales += item.quantity || 1
          productSales[productId].revenue += (item.price || 0) * (item.quantity || 1)
        })
      })

      const topProducts = Object.entries(productSales)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Category performance
      const categoryStats: Record<string, { count: number, revenue: number }> = {}
      products.forEach(product => {
        const category = product.category || 'Uncategorized'
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, revenue: 0 }
        }
        categoryStats[category].count++
      })

      filteredOrders.forEach(order => {
        const items = Array.isArray(order.items) ? order.items : []
        items.forEach((item: { category?: string, price?: number, quantity?: number }) => {
          const category = item.category || 'Other'
          if (categoryStats[category]) {
            categoryStats[category].revenue += (item.price || 0) * (item.quantity || 1)
          }
        })
      })

      const topCategories = Object.entries(categoryStats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)

      // New customers this month
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      const newCustomersThisMonth = users.filter(user => {
        const createdAt = user.createdAt instanceof Timestamp 
          ? user.createdAt.toDate() 
          : new Date(user.createdAt || 0)
        return createdAt >= thisMonth
      }).length

      // Recent orders
      const recentOrders = filteredOrders
        .sort((a, b) => {
          const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt || 0)
          const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt || 0)
          return dateB.getTime() - dateA.getTime()
        })
        .slice(0, 5)
        .map(order => ({
          id: order.id,
          customer: order.customerName || order.userName || 'Customer',
          amount: order.total || order.totalAmount || 0,
          status: order.status || 'pending',
          date: order.createdAt instanceof Timestamp 
            ? order.createdAt.toDate().toLocaleDateString()
            : new Date(order.createdAt || 0).toLocaleDateString()
        }))

      // Monthly revenue (last 6 months)
      const monthlyRevenue: Array<{ month: string, revenue: number, orders: number }> = []
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date()
        monthDate.setMonth(monthDate.getMonth() - i)
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
        
        const monthOrders = orders.filter(order => {
          const orderDate = order.createdAt instanceof Timestamp 
            ? order.createdAt.toDate() 
            : new Date(order.createdAt || 0)
          return orderDate >= monthStart && orderDate <= monthEnd
        })

        const monthRevenue = monthOrders.reduce((sum, order) => {
          const amount = typeof order.total === 'number' ? order.total : 
                         typeof order.totalAmount === 'number' ? order.totalAmount : 0
          return sum + amount
        }, 0)

        monthlyRevenue.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthRevenue,
          orders: monthOrders.length
        })
      }

      setReportData({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalProducts: products.length,
        lowStockProducts,
        outOfStockProducts,
        totalCustomers: users.length,
        newCustomersThisMonth,
        ordersByStatus,
        topProducts,
        topCategories,
        recentOrders,
        monthlyRevenue
      })

      toast.success('Reports loaded successfully')
    } catch (err) {
      console.error('Error fetching reports:', err)
      toast.error('Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleExportReport = async () => {
    if (!reportData) return
    
    setIsExporting(true)
    try {
      const report = `
BUDGET BUCKET - ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}
Period: ${selectedPeriod === 'all' ? 'All Time' : `Last ${selectedPeriod}`}

═══════════════════════════════════════════════════════════════

REVENUE SUMMARY
───────────────────────────────────────────────────────────────
Total Revenue: ${formatCurrency(reportData.totalRevenue)}
Total Orders: ${reportData.totalOrders}
Average Order Value: ${formatCurrency(reportData.averageOrderValue)}

PRODUCT METRICS
───────────────────────────────────────────────────────────────
Total Products: ${reportData.totalProducts}
Low Stock Products: ${reportData.lowStockProducts}
Out of Stock Products: ${reportData.outOfStockProducts}

CUSTOMER METRICS
───────────────────────────────────────────────────────────────
Total Customers: ${reportData.totalCustomers}
New Customers This Month: ${reportData.newCustomersThisMonth}

ORDER STATUS BREAKDOWN
───────────────────────────────────────────────────────────────
Pending: ${reportData.ordersByStatus.pending}
Processing: ${reportData.ordersByStatus.processing}
Shipped: ${reportData.ordersByStatus.shipped}
Delivered: ${reportData.ordersByStatus.delivered}
Cancelled: ${reportData.ordersByStatus.cancelled}

TOP SELLING PRODUCTS
───────────────────────────────────────────────────────────────
${reportData.topProducts.map((p, i) => `${i + 1}. ${p.name} - ${p.sales} units - ${formatCurrency(p.revenue)}`).join('\n')}

CATEGORY PERFORMANCE
───────────────────────────────────────────────────────────────
${reportData.topCategories.map(c => `${c.name}: ${c.count} products - ${formatCurrency(c.revenue)} revenue`).join('\n')}

MONTHLY REVENUE TREND
───────────────────────────────────────────────────────────────
${reportData.monthlyRevenue.map(m => `${m.month}: ${formatCurrency(m.revenue)} (${m.orders} orders)`).join('\n')}

═══════════════════════════════════════════════════════════════
End of Report
      `.trim()

      const blob = new Blob([report], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `budget-bucket-report-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Report exported successfully!')
    } catch (err) {
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
      case 'shipped': return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      case 'processing': return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
      case 'pending': return 'text-slate-400 bg-slate-500/20 border-slate-500/30'
      case 'cancelled': return 'text-red-400 bg-red-500/20 border-red-500/30'
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30'
    }
  }

  // Calculate max for chart scaling
  const maxRevenue = reportData?.monthlyRevenue 
    ? Math.max(...reportData.monthlyRevenue.map(m => m.revenue), 1) 
    : 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <BarChart3 className="w-7 h-7" />
            </div>
            Analytics & Reports
          </h1>
          <p className="text-slate-400 mt-2">Comprehensive insights into your store performance</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Period Selector */}
          <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
            {[
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' },
              { value: '1y', label: '1 Year' },
              { value: 'all', label: 'All Time' }
            ].map(period => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === period.value
                    ? 'bg-violet-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchReports}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportReport}
            disabled={!reportData || isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            Export Report
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-400 text-lg">Analyzing your data...</p>
          </div>
        </div>
      ) : reportData ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="relative bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30 overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+12.5%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-emerald-300/80 uppercase tracking-wider mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(reportData.totalRevenue)}</p>
              </div>
            </div>

            {/* Total Orders */}
            <div className="relative bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30 overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <ShoppingCart className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex items-center gap-1 text-blue-400 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+8.3%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-blue-300/80 uppercase tracking-wider mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-white">{reportData.totalOrders}</p>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="relative bg-gradient-to-br from-violet-600/20 to-violet-800/20 backdrop-blur-xl rounded-2xl p-6 border border-violet-500/30 overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-violet-500/20 rounded-xl">
                    <Activity className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="flex items-center gap-1 text-violet-400 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+4.2%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-violet-300/80 uppercase tracking-wider mb-1">Avg. Order Value</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(reportData.averageOrderValue)}</p>
              </div>
            </div>

            {/* Total Customers */}
            <div className="relative bg-gradient-to-br from-amber-600/20 to-orange-800/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-500/30 overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-500/20 rounded-xl">
                    <Users className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-1 rounded-full">
                    +{reportData.newCustomersThisMonth} this month
                  </span>
                </div>
                <p className="text-sm font-medium text-amber-300/80 uppercase tracking-wider mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-white">{reportData.totalCustomers}</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Revenue Trend</h3>
                  <p className="text-sm text-slate-400">Last 6 months performance</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                    <span className="text-slate-400">Revenue</span>
                  </div>
                </div>
              </div>
              
              {/* Simple Bar Chart */}
              <div className="h-64 flex items-end justify-between gap-4 px-4">
                {reportData.monthlyRevenue.map((month, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full relative group">
                      <div 
                        className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-lg transition-all duration-300 group-hover:from-violet-500 group-hover:to-violet-300"
                        style={{ 
                          height: `${Math.max((month.revenue / maxRevenue) * 200, 8)}px`,
                          minHeight: '8px'
                        }}
                      >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700">
                          {formatCurrency(month.revenue)}
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 text-sm">{month.month}</p>
                      <p className="text-slate-500 text-xs">{month.orders} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-violet-500/20 rounded-xl">
                  <PieChart className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Order Status</h3>
                  <p className="text-sm text-slate-400">Distribution by status</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'pending', label: 'Pending', icon: Clock, color: 'slate' },
                  { key: 'processing', label: 'Processing', icon: Activity, color: 'amber' },
                  { key: 'shipped', label: 'Shipped', icon: Truck, color: 'blue' },
                  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'emerald' },
                  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'red' }
                ].map(({ key, label, icon: Icon, color }) => {
                  const count = reportData.ordersByStatus[key as keyof typeof reportData.ordersByStatus]
                  const percentage = reportData.totalOrders > 0 
                    ? Math.round((count / reportData.totalOrders) * 100) 
                    : 0
                  
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 text-${color}-400`} style={{ 
                            color: color === 'slate' ? '#94a3b8' : 
                                   color === 'amber' ? '#fbbf24' :
                                   color === 'blue' ? '#60a5fa' :
                                   color === 'emerald' ? '#34d399' : '#f87171'
                          }} />
                          <span className="text-sm text-slate-300">{label}</span>
                        </div>
                        <span className="text-sm font-semibold text-white">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: color === 'slate' ? '#94a3b8' : 
                                            color === 'amber' ? '#fbbf24' :
                                            color === 'blue' ? '#60a5fa' :
                                            color === 'emerald' ? '#34d399' : '#f87171'
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Top Products */}
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Top Products</h3>
                  <p className="text-sm text-slate-400">Best selling items</p>
                </div>
              </div>

              <div className="space-y-4">
                {reportData.topProducts.length > 0 ? (
                  reportData.topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-xl">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold ${
                        index === 0 ? 'bg-amber-500/20 text-amber-400' :
                        index === 1 ? 'bg-slate-400/20 text-slate-300' :
                        index === 2 ? 'bg-orange-600/20 text-orange-400' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.sales} units sold</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-400">{formatCurrency(product.revenue)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No sales data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Category Performance */}
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Boxes className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Categories</h3>
                  <p className="text-sm text-slate-400">Products by category</p>
                </div>
              </div>

              <div className="space-y-3">
                {reportData.topCategories.length > 0 ? (
                  reportData.topCategories.map((category, index) => {
                    const colors = ['violet', 'blue', 'emerald', 'amber', 'rose', 'cyan']
                    const color = colors[index % colors.length]
                    
                    return (
                      <div key={category.name} className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-xl">
                        <div 
                          className="w-2 h-8 rounded-full"
                          style={{
                            backgroundColor: color === 'violet' ? '#8b5cf6' :
                                           color === 'blue' ? '#3b82f6' :
                                           color === 'emerald' ? '#10b981' :
                                           color === 'amber' ? '#f59e0b' :
                                           color === 'rose' ? '#f43f5e' : '#06b6d4'
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium">{category.name}</p>
                          <p className="text-xs text-slate-500">{category.count} products</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-300">{formatCurrency(category.revenue)}</span>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Boxes className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No categories yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Recent Orders</h3>
                  <p className="text-sm text-slate-400">Latest transactions</p>
                </div>
              </div>

              <div className="space-y-3">
                {reportData.recentOrders.length > 0 ? (
                  reportData.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{order.customer}</p>
                        <p className="text-xs text-slate-500">{order.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span className="text-sm font-semibold text-white">{formatCurrency(order.amount)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No orders yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Alert */}
            <div className="bg-gradient-to-br from-amber-900/20 to-amber-950/20 backdrop-blur-xl rounded-2xl border border-amber-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Low Stock Alert</h3>
                  <p className="text-sm text-amber-300/70">{reportData.lowStockProducts} products running low</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                Consider restocking these products soon to avoid stockouts and lost sales.
              </p>
            </div>

            {/* Out of Stock Alert */}
            <div className="bg-gradient-to-br from-red-900/20 to-red-950/20 backdrop-blur-xl rounded-2xl border border-red-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-xl">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Out of Stock</h3>
                  <p className="text-sm text-red-300/70">{reportData.outOfStockProducts} products need restocking</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                These products are currently unavailable for purchase. Restock immediately.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-10 h-10 text-slate-500" />
            </div>
            <p className="text-white text-xl font-semibold mb-2">No Data Available</p>
            <p className="text-slate-400">Start adding products and orders to see analytics</p>
          </div>
        </div>
      )}
    </div>
  )
}
