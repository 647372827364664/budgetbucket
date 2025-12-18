import { NextResponse } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET() {
  try {
    console.log('Dashboard API: Starting to fetch data from Firebase...')
    
    let orders: Record<string, unknown>[] = []
    let products: Record<string, unknown>[] = []
    let users: Record<string, unknown>[] = []

    // Fetch all orders with error handling
    try {
      const ordersRef = collection(db, 'orders')
      const ordersSnapshot = await getDocs(ordersRef)
      orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log(`Dashboard API: Found ${orders.length} orders`)
    } catch (err) {
      console.log('Could not fetch orders:', err)
    }

    // Fetch all products with error handling
    try {
      const productsRef = collection(db, 'products')
      const productsSnapshot = await getDocs(productsRef)
      products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log(`Dashboard API: Found ${products.length} products`)
    } catch (err) {
      console.log('Could not fetch products:', err)
    }

    // Fetch all users with error handling
    try {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log(`Dashboard API: Found ${users.length} users`)
    } catch (err) {
      console.log('Could not fetch users:', err)
    }

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order: any) => {
      return sum + (order.total || 0)
    }, 0)

    const completedOrders = orders.filter((order: any) => order.status === 'delivered').length
    const pendingOrders = orders.filter((order: any) => 
      ['pending', 'processing', 'shipped'].includes(order.status)
    ).length

    const activeUsers = users.filter((user: any) => !user.isBlocked).length
    const totalProducts = products.length
    const lowStockProducts = products.filter((product: any) => 
      (product.stock || 0) < 10
    ).length

    // Calculate revenue trend (last 7 days)
    const today = new Date()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    const revenueTrend = last7Days.map(date => {
      const dayOrders = orders.filter((order: any) => {
        if (!order.createdAt) return false
        const orderDate = order.createdAt.toDate 
          ? order.createdAt.toDate().toISOString().split('T')[0]
          : new Date(order.createdAt).toISOString().split('T')[0]
        return orderDate === date
      })
      
      const revenue = dayOrders.reduce((sum, order: any) => sum + (order.total || 0), 0)
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: revenue,
        orders: dayOrders.length
      }
    })

    // Calculate category sales
    const categorySales: { [key: string]: number } = {}
    orders.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        const category = item.category || 'Uncategorized'
        categorySales[category] = (categorySales[category] || 0) + (item.price * item.quantity)
      })
    })

    const topCategories = Object.entries(categorySales)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    // Top selling products
    const productSales: { [key: string]: { name: string; sales: number; revenue: number } } = {}
    orders.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.name,
            sales: 0,
            revenue: 0
          }
        }
        productSales[item.productId].sales += item.quantity
        productSales[item.productId].revenue += item.price * item.quantity
      })
    })

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    // Order status distribution
    const orderStatusCount = {
      pending: orders.filter((o: any) => o.status === 'pending').length,
      processing: orders.filter((o: any) => o.status === 'processing').length,
      shipped: orders.filter((o: any) => o.status === 'shipped').length,
      delivered: orders.filter((o: any) => o.status === 'delivered').length,
      cancelled: orders.filter((o: any) => o.status === 'cancelled').length,
    }

    // Recent orders (last 5)
    const recentOrders = orders
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 5)
      .map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber || order.id.slice(0, 8),
        customerName: order.customerName || order.shippingAddress?.name || 'Guest',
        total: order.total,
        status: order.status,
        date: order.createdAt?.toDate ? order.createdAt.toDate().toISOString() : new Date(order.createdAt).toISOString()
      }))

    return NextResponse.json({
      metrics: {
        totalRevenue,
        totalOrders: orders.length,
        completedOrders,
        pendingOrders,
        activeUsers,
        totalProducts,
        lowStockProducts,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
      },
      revenueTrend,
      topCategories,
      topProducts,
      orderStatusCount,
      recentOrders
    })
  } catch (error: unknown) {
    console.error('Dashboard API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    // Return empty data instead of error to prevent frontend crash
    return NextResponse.json({
      success: true,
      metrics: {
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        activeUsers: 0,
        totalProducts: 0,
        lowStockProducts: 0,
        averageOrderValue: 0
      },
      revenueTrend: [],
      topCategories: [],
      topProducts: [],
      orderStatusCount: {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      },
      recentOrders: [],
      message: 'Using default data - Firebase may not be configured'
    })
  }
}
