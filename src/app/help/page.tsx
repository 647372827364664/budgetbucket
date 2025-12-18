import { Search, MessageCircle, Package, CreditCard, RotateCcw, Truck, Shield, HelpCircle } from 'lucide-react';

export default function HelpPage() {
  const faqs = [
    {
      category: 'Orders & Shipping',
      icon: Package,
      questions: [
        {
          q: 'How do I track my order?',
          a: 'You can track your order by visiting the Track Order page and entering your order number. You\'ll also receive tracking updates via email and SMS.'
        },
        {
          q: 'What are the shipping charges?',
          a: 'We offer free shipping on orders above ₹499. For orders below ₹499, a flat shipping charge of ₹49 applies.'
        },
        {
          q: 'How long does delivery take?',
          a: 'Most orders are delivered within 3-7 business days. Express delivery options are available for select products.'
        }
      ]
    },
    {
      category: 'Payments',
      icon: CreditCard,
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept Credit/Debit Cards, UPI, Net Banking, Wallets, and Cash on Delivery (COD) for eligible orders.'
        },
        {
          q: 'Is it safe to use my card on Budget Bucket?',
          a: 'Yes, absolutely! We use industry-standard encryption and secure payment gateways (Razorpay) to protect your information.'
        },
        {
          q: 'Can I pay cash on delivery?',
          a: 'Yes, COD is available for orders up to ₹50,000. A small COD fee may apply depending on the order value.'
        }
      ]
    },
    {
      category: 'Returns & Refunds',
      icon: RotateCcw,
      questions: [
        {
          q: 'What is your return policy?',
          a: 'We offer a 7-day return policy for most products. Items must be unused, in original packaging, and with all tags intact.'
        },
        {
          q: 'How do I initiate a return?',
          a: 'Go to My Orders, select the item you want to return, and click on "Return". Our team will arrange a pickup from your address.'
        },
        {
          q: 'When will I receive my refund?',
          a: 'Refunds are processed within 5-7 business days after we receive and verify the returned item. The amount will be credited to your original payment method.'
        }
      ]
    },
    {
      category: 'Account & Security',
      icon: Shield,
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click on the Sign Up button, enter your phone number, verify with OTP, and complete your profile. It takes less than a minute!'
        },
        {
          q: 'I forgot my password. What should I do?',
          a: 'We use phone number + OTP login system, so you don\'t need a password. Simply enter your phone number and verify with OTP to log in.'
        },
        {
          q: 'How is my personal information protected?',
          a: 'We follow strict security protocols and never share your personal information with third parties without your consent. Read our Privacy Policy for more details.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-16">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-lg text-purple-100 mb-8">How can we help you today?</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles, FAQs, guides..."
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-300 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <a href="/track-order" className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-100">
            <Truck className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Track Order</h3>
            <p className="text-sm text-gray-600">Check your order status and delivery updates</p>
          </a>
          <a href="/returns" className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-100">
            <RotateCcw className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Returns</h3>
            <p className="text-sm text-gray-600">Initiate a return or exchange request</p>
          </a>
          <a href="/contact" className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-100">
            <MessageCircle className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Contact Us</h3>
            <p className="text-sm text-gray-600">Get in touch with our support team</p>
          </a>
          <a href="#faqs" className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-100">
            <HelpCircle className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">FAQs</h3>
            <p className="text-sm text-gray-600">Find answers to common questions</p>
          </a>
        </div>

        {/* FAQs */}
        <div id="faqs">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {faqs.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.category} className="bg-white rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{category.category}</h3>
                  </div>
                  <div className="space-y-6">
                    {category.questions.map((faq, index) => (
                      <div key={index} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                        <h4 className="font-medium text-gray-900 mb-2">{faq.q}</h4>
                        <p className="text-gray-600">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
          <p className="text-purple-100 mb-6">Our customer support team is here to assist you</p>
          <a href="/contact" className="inline-block px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
