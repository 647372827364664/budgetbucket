'use client'

import { Truck, RefreshCw, Award, Headphones } from 'lucide-react'

const benefits = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'Free delivery on orders over $50. Fast and reliable shipping to your doorstep.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    description: '30-day return policy. If you are not satisfied, we make returns hassle-free.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Award,
    title: 'Premium Quality',
    description: 'All products are carefully selected and verified for quality and authenticity.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Our customer service team is always ready to help you with any questions.',
    color: 'from-orange-500 to-amber-500',
  },
]

export function PremiumBenefitsSection() {
  return (
    <section className="py-12 md:py-20 px-4 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-slideDown">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Why Shop With Us
          </h2>
          <p className="text-gray-600 text-lg">
            Experience the difference of premium shopping
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div
                key={index}
                className="group animate-slideUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 hover:border-purple-300 transition-all duration-300 h-full">
                  {/* Icon Container */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${benefit.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>

                  {/* Accent line */}
                  <div className="mt-6 h-1 w-0 bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:w-full transition-all duration-300" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
