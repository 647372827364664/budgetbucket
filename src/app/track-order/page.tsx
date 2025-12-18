'use client';

import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim()) {
      toast.error('Please enter your order number');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // For demo purposes, show sample data
      setOrderDetails({
        orderNumber: orderNumber,
        status: 'shipped',
        customerName: 'John Doe',
        phone: phone || '+91 98765 43210',
        items: 2,
        total: 2499,
        trackingSteps: [
          {
            status: 'Order Placed',
            date: '12 Dec, 2025',
            time: '10:30 AM',
            completed: true,
            icon: Package
          },
          {
            status: 'Order Confirmed',
            date: '12 Dec, 2025',
            time: '11:15 AM',
            completed: true,
            icon: CheckCircle
          },
          {
            status: 'Shipped',
            date: '13 Dec, 2025',
            time: '09:00 AM',
            completed: true,
            icon: Truck,
            details: 'Out for delivery - Expected by 5:00 PM today'
          },
          {
            status: 'Delivered',
            date: 'Expected 13 Dec, 2025',
            time: '5:00 PM',
            completed: false,
            icon: CheckCircle
          }
        ],
        shippingAddress: 'D-191, Shop No 1, West Vinod Nagar, Delhi - 110092',
        courierName: 'Delhivery',
        awbCode: 'DLV123456789'
      });
      setLoading(false);
      toast.success('Order found!');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <p className="text-gray-600 text-lg">Enter your order details to track your shipment</p>
        </div>

        {/* Track Order Form */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12">
          <form onSubmit={handleTrackOrder} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Enter your order number (e.g., ORD-123456)"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your registered phone number"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Tracking...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Track Order
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Details */}
        {orderDetails && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order #{orderDetails.orderNumber}</h2>
                  <p className="text-gray-500">Shipped via {orderDetails.courierName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-purple-600">₹{orderDetails.total.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-100 pt-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Delivery Address</p>
                    <p className="font-medium text-gray-900">{orderDetails.shippingAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-medium text-gray-900">{orderDetails.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">AWB Code</p>
                    <p className="font-medium text-gray-900 font-mono">{orderDetails.awbCode}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Tracking Timeline</h3>
              <div className="space-y-6">
                {orderDetails.trackingSteps.map((step: any, index: number) => {
                  const Icon = step.icon;
                  const isLast = index === orderDetails.trackingSteps.length - 1;
                  
                  return (
                    <div key={index} className="flex gap-4">
                      {/* Icon & Line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          step.completed ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            step.completed ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 h-16 mt-2 ${
                            step.completed ? 'bg-green-200' : 'bg-gray-200'
                          }`}></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className={`font-semibold ${
                            step.completed ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {step.status}
                          </h4>
                          {step.completed && (
                            <span className="text-sm text-green-600 font-medium">Completed</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{step.date} at {step.time}</p>
                        {step.details && (
                          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-700">{step.details}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white text-center">
              <h3 className="text-xl font-semibold mb-2">Need Help?</h3>
              <p className="text-purple-100 mb-4">Contact our customer support team for assistance</p>
              <div className="flex items-center justify-center gap-4">
                <a href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  <Mail className="w-4 h-4" />
                  Contact Us
                </a>
                <a href="/help" className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-400 transition-colors">
                  Help Center
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
