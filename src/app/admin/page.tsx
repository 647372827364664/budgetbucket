'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  BarChart3,
  Activity,
  Layers
} from 'lucide-react';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  lowStockProducts: number;
  revenueChange: number;
  ordersChange: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  createdAt: Date;
  itemCount: number;
}

interface TopProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  sold: number;
  revenue: number;
  category: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    lowStockProducts: 0,
    revenueChange: 0,
    ordersChange: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting dashboard data fetch...');

      // Fetch all data in parallel
      const [ordersSnapshot, productsSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'users')),
      ]);

      console.log('📥 Raw orders count:', ordersSnapshot.docs.length);
      console.log('📥 Raw products count:', productsSnapshot.docs.length);
      console.log('📥 Raw users count:', usersSnapshot.docs.length);

      // Log raw order data to see what's in Firebase
      if (ordersSnapshot.docs.length > 0) {
        console.log('🔍 RAW FIRST ORDER DATA:', JSON.stringify(ordersSnapshot.docs[0].data(), null, 2));
      } else {
        console.log('⚠️ NO ORDERS FOUND IN FIREBASE!');
      }

      // Process orders
      const orders = ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        // Map fields correctly - checkout saves total in summary.total, API saves as data.total
        const orderTotal = Number(data.total) || Number(data.summary?.total) || Number(data.grandTotal) || 0;
        const orderStatus = data.orderStatus || data.status || 'pending';
        const customerName = data.customerName || data.customerInfo?.name || data.address?.name || data.shippingAddress?.name || 'Guest';
        const customerEmail = data.customerEmail || data.customerInfo?.email || data.address?.email || data.email || '';
        
        return {
          id: doc.id,
          ...data,
          total: orderTotal,
          status: orderStatus,
          paymentStatus: data.paymentStatus || 'pending',
          paymentMethod: data.paymentMethod || 'cod',
          customerName,
          customerEmail,
          items: Array.isArray(data.items) ? data.items : [],
          createdAt: data.createdAt,
        };
      });

      console.log('📦 Total orders fetched:', orders.length);
      if (orders.length > 0) {
        console.log('📊 Sample order data:', JSON.stringify(orders[0], null, 2));
      }

      let totalRevenue = 0;
      let pendingOrders = 0;
      let completedOrders = 0;
      let cancelledOrders = 0;

      orders.forEach((order: any) => {
        const orderTotal = Number(order.total) || 0;
        const status = (order.status || 'pending').toLowerCase();
        
        console.log(`Order ${order.id}: status=${status}, total=${orderTotal}`);
        
        // Count order statuses
        if (status === 'delivered' || status === 'completed') {
          completedOrders++;
        } else if (status === 'pending' || status === 'processing' || status === 'confirmed' || status === 'shipped') {
          pendingOrders++;
        } else if (status === 'cancelled') {
          cancelledOrders++;
        } else {
          // Any other status counts as pending
          pendingOrders++;
        }
        
        // Count revenue for all non-cancelled orders
        if (status !== 'cancelled' && orderTotal > 0) {
          totalRevenue += orderTotal;
        }
      });

      console.log('💰 Revenue calculation:', {
        totalRevenue,
        totalOrders: orders.length,
        completed: completedOrders,
        pending: pendingOrders,
        cancelled: cancelledOrders
      });

      // Process products
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      let lowStockProducts = 0;
      const productSales: { [key: string]: TopProduct } = {};

      // First, initialize products with zero sales
      products.forEach((product: any) => {
        if ((product.stock || product.inventory || 0) <= 10) {
          lowStockProducts++;
        }
        productSales[product.id] = {
          id: product.id,
          name: product.name || product.title || 'Unknown Product',
          image: product.image || product.images?.[0] || '',
          price: product.price || 0,
          sold: 0,
          revenue: 0,
          category: product.category || 'General',
        };
      });

      // Calculate actual sales from orders
      orders.forEach((order: any) => {
        const orderStatus = (order.status || '').toLowerCase();
        // Only count non-cancelled orders
        if (orderStatus !== 'cancelled') {
          const orderItems = order.items || [];
          orderItems.forEach((item: any) => {
            const productId = item.productId || item.id;
            const quantity = Number(item.quantity) || 1;
            const itemPrice = Number(item.price) || 0;
            
            if (productSales[productId]) {
              productSales[productId].sold += quantity;
              productSales[productId].revenue += quantity * itemPrice;
            } else {
              // Product from order that might not exist in products collection
              productSales[productId] = {
                id: productId,
                name: item.name || 'Unknown Product',
                image: item.image || '',
                price: itemPrice,
                sold: quantity,
                revenue: quantity * itemPrice,
                category: item.category || 'General',
              };
            }
          });
        }
      });

      console.log('📊 Product sales calculated:', Object.values(productSales).filter(p => p.sold > 0));

      // Get top products by sold count (only products with sales)
      const sortedProducts = Object.values(productSales)
        .filter(p => p.sold > 0)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      console.log('🏆 Top products:', sortedProducts);

      // Get recent orders
      const sortedOrders = orders
        .filter((order: any) => order.createdAt) // Filter out orders without timestamp
        .sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5)
        .map((order: any) => ({
          id: order.id,
          customerName: order.customerName || 'Guest Customer',
          customerEmail: order.customerEmail || 'N/A',
          total: Number(order.total) || 0,
          status: order.status || 'pending',
          createdAt: order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt),
          itemCount: order.items?.length || 0,
        }));

      console.log('📋 Recent orders:', sortedOrders);

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalUsers: usersSnapshot.docs.length,
        totalProducts: products.length,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        lowStockProducts,
        revenueChange: 12.5,
        ordersChange: 8.3,
      });

      setRecentOrders(sortedOrders);
      setTopProducts(sortedProducts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'shipped':
        return 'bg-purple-100 text-purple-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 h-36">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 h-96"></div>
              <div className="bg-white rounded-2xl p-6 h-96"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <button 
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Refresh
            </button>
            <Link
              href="/admin/reports"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              View Reports
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />
                <span>+{stats.revenueChange}%</span>
              </div>
            </div>
            <p className="text-purple-100 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />
                <span>+{stats.ordersChange}%</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <Link href="/admin/users" className="text-gray-400 hover:text-gray-600">
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-gray-500 text-sm mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>

          {/* Total Products */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <Link href="/admin/products" className="text-gray-400 hover:text-gray-600">
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-gray-500 text-sm mb-1">Total Products</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelledOrders}</p>
              <p className="text-sm text-gray-500">Cancelled</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
              <p className="text-sm text-gray-500">Low Stock</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <p className="text-sm text-gray-500">Latest customer orders</p>
              </div>
              <Link 
                href="/admin/orders" 
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No orders yet</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {order.customerName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{order.customerName}</p>
                            <p className="text-sm text-gray-500">
                              {order.itemCount} items • {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
                <p className="text-sm text-gray-500">Best selling items</p>
              </div>
              <Link 
                href="/admin/products" 
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {topProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No products yet</p>
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg text-sm font-semibold text-gray-600">
                        #{index + 1}
                      </div>
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{product.sold} sold</p>
                        <p className="text-sm text-green-600">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/products/new"
              className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Add Product</span>
            </Link>

            <Link
              href="/admin/orders"
              className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Manage Orders</span>
            </Link>

            <Link
              href="/admin/inventory"
              className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Layers className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Inventory</span>
            </Link>

            <Link
              href="/admin/settings"
              className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
