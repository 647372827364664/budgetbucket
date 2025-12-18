import { Target, Users, Award, TrendingUp, Heart, Shield, Clock, Zap } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Customer First',
      description: 'We put our customers at the heart of everything we do'
    },
    {
      icon: Shield,
      title: 'Quality Assured',
      description: 'Only authentic products with quality guarantee'
    },
    {
      icon: TrendingUp,
      title: 'Best Prices',
      description: 'Unbeatable prices on all your favorite products'
    },
    {
      icon: Zap,
      title: 'Fast Delivery',
      description: 'Quick and reliable delivery across India'
    }
  ];

  const stats = [
    { value: '1M+', label: 'Happy Customers' },
    { value: '50K+', label: 'Products' },
    { value: '500+', label: 'Brands' },
    { value: '99%', label: 'Satisfaction' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-20">
        <div className="container-custom text-center">
          <h1 className="text-5xl font-bold mb-6">About Budget Bucket</h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto">
            Your trusted destination for quality products at affordable prices. We believe everyone deserves access to great products without breaking the bank.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 text-center border border-gray-100 shadow-sm">
              <div className="text-4xl font-bold text-purple-600 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Story Section */}
      <div className="container-custom py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 md:p-12 border border-gray-100 shadow-sm">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                Budget Bucket was founded in 2024 with a simple mission: to make quality products accessible to everyone at prices that don&apos;t strain your wallet. We started as a small team passionate about e-commerce and customer satisfaction.
              </p>
              <p>
                Today, we&apos;ve grown into one of India&apos;s trusted online shopping destinations, serving over 1 million happy customers across the country. Our commitment to quality, affordability, and exceptional customer service has remained unchanged since day one.
              </p>
              <p>
                We carefully curate our product selection, partnering with trusted brands and verified sellers to ensure you receive only authentic, high-quality products. From electronics to fashion, home essentials to books, we&apos;ve got everything you need under one roof.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gray-100 py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These core values guide everything we do at Budget Bucket
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              To provide customers with a seamless online shopping experience, offering quality products at budget-friendly prices, backed by excellent customer service and fast delivery.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
            <p className="text-gray-600 leading-relaxed">
              To become India&apos;s most trusted and loved e-commerce platform, where quality meets affordability, and every customer feels valued and satisfied with their shopping experience.
            </p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <Users className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We&apos;re a diverse team of passionate individuals dedicated to making your shopping experience exceptional. From customer support to logistics, every team member plays a vital role in our success.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 max-w-3xl mx-auto border border-gray-100 shadow-sm text-center">
            <p className="text-lg text-gray-700 mb-6">
              Our team of 100+ professionals works tirelessly to ensure you get the best products, prices, and service. We&apos;re not just selling products – we&apos;re building lasting relationships with our customers.
            </p>
            <a href="/careers" className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
              Join Our Team
            </a>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="container-custom py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Budget Bucket?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Authentic Products', desc: '100% genuine products from verified sellers' },
              { title: 'Best Prices', desc: 'Competitive pricing with regular discounts and offers' },
              { title: 'Fast Delivery', desc: 'Quick delivery across India with real-time tracking' },
              { title: 'Easy Returns', desc: '7-day return policy with free pickup' },
              { title: 'Secure Payments', desc: 'Multiple payment options with encrypted transactions' },
              { title: '24/7 Support', desc: 'Dedicated customer support always ready to help' }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 py-16">
        <div className="container-custom text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
          <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
            Join millions of satisfied customers and discover quality products at unbeatable prices
          </p>
          <a href="/" className="inline-block px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors">
            Start Shopping Now
          </a>
        </div>
      </div>
    </div>
  );
}
