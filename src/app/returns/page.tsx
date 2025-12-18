import { RotateCcw, CheckCircle, Clock, Package, Truck, XCircle } from 'lucide-react';

export default function ReturnsPage() {
  const returnSteps = [
    {
      title: 'Select Item',
      description: 'Go to My Orders and select the item you want to return',
      icon: Package
    },
    {
      title: 'Choose Reason',
      description: 'Tell us why you\'re returning the product',
      icon: RotateCcw
    },
    {
      title: 'Schedule Pickup',
      description: 'We\'ll arrange a free pickup from your address',
      icon: Truck
    },
    {
      title: 'Get Refund',
      description: 'Refund will be processed within 5-7 business days',
      icon: CheckCircle
    }
  ];

  const eligibleItems = [
    'Products must be unused and in original packaging',
    'All tags and labels should be intact',
    'Return initiated within 7 days of delivery',
    'Invoice or order confirmation required'
  ];

  const nonReturnableItems = [
    'Perishable goods (food, flowers)',
    'Intimate or sanitary goods',
    'Customized or personalized items',
    'Digital products or gift cards'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-16">
        <div className="container-custom text-center">
          <RotateCcw className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Returns & Exchanges</h1>
          <p className="text-lg text-purple-100 max-w-2xl mx-auto">
            We want you to be completely satisfied with your purchase. If you&apos;re not happy, we&apos;re here to help.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        {/* Return Policy Highlights */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">7-Day Returns</h3>
              <p className="text-sm text-gray-600">Easy returns within 7 days of delivery</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Free Pickup</h3>
              <p className="text-sm text-gray-600">We arrange free pickup from your doorstep</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick Refunds</h3>
              <p className="text-sm text-gray-600">Refund processed in 5-7 business days</p>
            </div>
          </div>
        </div>

        {/* How to Return */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How to Return an Item</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {returnSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-sm font-semibold text-purple-600 mb-2">Step {index + 1}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Eligible vs Non-Returnable */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Eligible Items */}
            <div className="bg-white rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Eligible for Return</h3>
              </div>
              <ul className="space-y-3">
                {eligibleItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Non-Returnable Items */}
            <div className="bg-white rounded-xl p-6 border border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Non-Returnable Items</h3>
              </div>
              <ul className="space-y-3">
                {nonReturnableItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Refund Information */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Refund Information</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Online Payments</h3>
                <p>Refunds for online payments (UPI, Credit/Debit Card, Net Banking) will be credited to your original payment method within 5-7 business days.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Cash on Delivery</h3>
                <p>For COD orders, refund will be processed to your bank account. Please provide your bank details when initiating the return.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Partial Returns</h3>
                <p>If you return only some items from your order, we&apos;ll refund the amount for those specific items. Shipping charges may not be refundable in case of partial returns.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Damaged or Defective Products</h3>
                <p>If you receive a damaged or defective product, please contact us immediately with photos. We&apos;ll arrange a replacement or full refund including shipping charges.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Policy */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Exchange Policy</h2>
            <p className="text-gray-700 mb-4">
              We currently don&apos;t offer direct exchanges. If you want a different size, color, or product, please:
            </p>
            <ol className="space-y-2 text-gray-700 ml-6 list-decimal">
              <li>Return the original item following our return process</li>
              <li>Place a new order for the desired item</li>
              <li>Your refund will be processed once we receive the returned item</li>
            </ol>
            <p className="text-gray-700 mt-4">
              This ensures you get your preferred item quickly without waiting for the return to complete.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Common Questions</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel my order before it ships?</h3>
              <p className="text-gray-600">Yes! You can cancel your order before it&apos;s shipped from My Orders section. Once shipped, you&apos;ll need to return it after delivery.</p>
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How long does the pickup take?</h3>
              <p className="text-gray-600">We usually schedule pickups within 2-3 business days of your return request. You&apos;ll receive pickup confirmation via SMS and email.</p>
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">What if I miss the pickup?</h3>
              <p className="text-gray-600">You can reschedule the pickup from your order page or contact our support team. We&apos;ll arrange another pickup at your convenience.</p>
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Is there a restocking fee?</h3>
              <p className="text-gray-600">No, we don&apos;t charge any restocking fee for returns. The full product amount will be refunded.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Need to Return Something?</h3>
            <p className="text-purple-100 mb-6">Go to your orders page to initiate a return</p>
            <div className="flex items-center justify-center gap-4">
              <a href="/orders" className="inline-block px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                My Orders
              </a>
              <a href="/contact" className="inline-block px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-400 transition-colors">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
