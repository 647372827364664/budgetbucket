'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { 
  Search, 
  Eye, 
  Trash2, 
  RefreshCw,
  Package,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  ChevronDown,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    name?: string;
    street?: string;
    address?: string;
    city: string;
    state: string;
    pincode: string;
    phone?: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  grandTotal?: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: any;
  updatedAt?: any;
  awbCode?: string;
  courierName?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  { value: 'processing', label: 'Processing', color: 'bg-indigo-100 text-indigo-700', icon: Package },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-700', icon: Truck },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
];

const COURIERS = [
  'Shiprocket',
  'Delhivery',
  'BlueDart',
  'DTDC',
  'Ecom Express',
  'Shadowfax',
  'Xpressbees',
  'India Post',
  'FedEx',
  'Other'
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAwbModal, setShowAwbModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState('');
  const [awbCode, setAwbCode] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        // Map fields correctly - checkout saves total in summary.total, API saves as data.total
        const orderTotal = Number(data.total) || Number(data.summary?.total) || Number(data.grandTotal) || 0;
        const address = data.address || data.shippingAddress || {};
        const customerInfo = data.customerInfo || {};
        
        console.log(`Order ${doc.id}: total=${data.total}, summary.total=${data.summary?.total}, status=${data.orderStatus || data.status}`);
        
        return {
          id: doc.id,
          orderNumber: data.orderNumber || data.invoiceId || `ORD-${doc.id.slice(0, 8).toUpperCase()}`,
          customerName: data.customerName || customerInfo.name || address.name || address.fullName || 'Guest',
          customerEmail: data.customerEmail || customerInfo.email || address.email || data.email || '',
          customerPhone: data.customerPhone || customerInfo.phone || address.phone || address.mobile || '',
          shippingAddress: address,
          items: data.items || [],
          subtotal: Number(data.subtotal) || Number(data.summary?.subtotal) || 0,
          tax: Number(data.tax) || Number(data.summary?.tax) || 0,
          shipping: Number(data.shipping) || Number(data.shippingCost) || Number(data.summary?.shipping) || 0,
          total: orderTotal,
          grandTotal: orderTotal,
          status: data.orderStatus || data.status || 'pending',
          paymentStatus: data.paymentStatus || 'pending',
          paymentMethod: data.paymentMethod || 'cod',
          razorpayPaymentId: data.razorpayPaymentId || '',
          razorpayOrderId: data.razorpayOrderId || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          awbCode: data.awbCode || '',
          courierName: data.courierName || '',
          trackingUrl: data.trackingUrl || '',
          estimatedDelivery: data.estimatedDelivery || '',
        } as Order;
      });

      setOrders(ordersData);
      toast.success(`Loaded ${ordersData.length} orders`);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setUpdating(true);
      const orderRef = doc(db, 'orders', selectedOrder.id);
      // Save as 'orderStatus' to match order creation API, also update 'status' for backward compatibility
      await updateDoc(orderRef, {
        orderStatus: newStatus,
        status: newStatus,
        updatedAt: Timestamp.now(),
      });

      setOrders(orders.map(o => 
        o.id === selectedOrder.id ? { ...o, status: newStatus } : o
      ));
      
      toast.success(`Order status updated to ${newStatus}`);
      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateAwb = async () => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      const orderRef = doc(db, 'orders', selectedOrder.id);
      
      const updateData: Record<string, unknown> = {
        awbCode,
        courierName,
        trackingUrl,
        estimatedDelivery,
        updatedAt: Timestamp.now(),
      };

      // Auto-update status to shipped if AWB is added
      if (awbCode && ['pending', 'confirmed', 'processing'].includes(selectedOrder.status)) {
        updateData.orderStatus = 'shipped';
        updateData.status = 'shipped';
      }

      await updateDoc(orderRef, updateData);

      setOrders(orders.map(o => 
        o.id === selectedOrder.id 
          ? { 
              ...o, 
              awbCode, 
              courierName, 
              trackingUrl, 
              estimatedDelivery,
              status: (updateData.status as string) || o.status
            } 
          : o
      ));
      
      toast.success('AWB tracking updated successfully');
      setShowAwbModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating AWB:', error);
      toast.error('Failed to update AWB tracking');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm(`Are you sure you want to delete order ${order.orderNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      const orderRef = doc(db, 'orders', order.id);
      await deleteDoc(orderRef);
      setOrders(orders.filter(o => o.id !== order.id));
      toast.success('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowStatusModal(true);
  };

  const openAwbModal = (order: Order) => {
    setSelectedOrder(order);
    setAwbCode(order.awbCode || '');
    setCourierName(order.courierName || '');
    setTrackingUrl(order.trackingUrl || '');
    setEstimatedDelivery(order.estimatedDelivery || '');
    setShowAwbModal(true);
  };

  const openDetailsModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusInfo = (status: string) => {
    return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.awbCode || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => ['confirmed', 'processing'].includes(o.status)).length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-6 gap-4 mb-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">Manage and track customer orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Package className="w-4 h-4" />
            <span className="text-sm">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <div className="flex items-center gap-2 text-yellow-600 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Package className="w-4 h-4" />
            <span className="text-sm">Processing</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.processing}</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Truck className="w-4 h-4" />
            <span className="text-sm">Shipped</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{stats.shipped}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Delivered</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">Cancelled</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, customer, email, or AWB..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              {ORDER_STATUSES.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Showing <span className="font-medium text-gray-900">{filteredOrders.length}</span> of {orders.length} orders
        </p>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">Orders will appear here when customers place them</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Payment</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">AWB</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.id.slice(0, 8)}...</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.customerEmail || order.customerPhone}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900">{order.items?.length || 0} items</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">{formatCurrency(order.total || order.grandTotal || 0)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => openStatusModal(order)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color} hover:opacity-80 transition-opacity`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus === 'completed' || order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {order.awbCode ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-900 font-mono">{order.awbCode}</span>
                            {order.trackingUrl && (
                              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => openAwbModal(order)}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                          >
                            + Add AWB
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetailsModal(order)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openAwbModal(order)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit AWB"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-500">{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{selectedOrder.customerEmail || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">
                        {selectedOrder.shippingAddress?.street || selectedOrder.shippingAddress?.address || ''}, 
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatCurrency(item.quantity * item.price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-gray-900">{formatCurrency(selectedOrder.shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-900">{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-purple-600">{formatCurrency(selectedOrder.total || selectedOrder.grandTotal || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment & Shipping Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Payment</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Method</span>
                      <span className="text-gray-900 capitalize">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                    {selectedOrder.razorpayPaymentId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Payment ID</span>
                        <span className="text-gray-900 font-mono text-xs">{selectedOrder.razorpayPaymentId}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Shipping</h3>
                  <div className="space-y-2">
                    {selectedOrder.courierName && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Courier</span>
                        <span className="text-gray-900">{selectedOrder.courierName}</span>
                      </div>
                    )}
                    {selectedOrder.awbCode && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">AWB</span>
                        <span className="text-gray-900 font-mono">{selectedOrder.awbCode}</span>
                      </div>
                    )}
                    {selectedOrder.estimatedDelivery && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Est. Delivery</span>
                        <span className="text-gray-900">{selectedOrder.estimatedDelivery}</span>
                      </div>
                    )}
                    {!selectedOrder.awbCode && (
                      <p className="text-sm text-gray-400">No shipping info added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  openStatusModal(selectedOrder);
                }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Update Status
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  openAwbModal(selectedOrder);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update AWB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Update Status</h2>
                <p className="text-sm text-gray-500">{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select New Status</label>
              <div className="space-y-2">
                {ORDER_STATUSES.map((status) => {
                  const Icon = status.icon;
                  return (
                    <label
                      key={status.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        newStatus === status.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status.value}
                        checked={newStatus === status.value}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="hidden"
                      />
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900">{status.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update AWB Modal */}
      {showAwbModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">AWB Tracking</h2>
                <p className="text-sm text-gray-500">{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowAwbModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AWB Code / Tracking Number</label>
                <input
                  type="text"
                  value={awbCode}
                  onChange={(e) => setAwbCode(e.target.value)}
                  placeholder="Enter AWB code"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Courier Name</label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select courier</option>
                  {COURIERS.map(courier => (
                    <option key={courier} value={courier}>{courier}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking URL (Optional)</label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://tracking.example.com/..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery (Optional)</label>
                <input
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {awbCode && ['pending', 'confirmed', 'processing'].includes(selectedOrder.status) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <Truck className="w-4 h-4 inline mr-1" />
                    Adding AWB will automatically update order status to &quot;Shipped&quot;
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowAwbModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAwb}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Tracking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
