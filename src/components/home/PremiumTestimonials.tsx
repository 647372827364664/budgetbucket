'use client'

import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Verified Buyer',
    avatar: '👩‍💼',
    rating: 5,
    comment: 'Amazing quality products and incredibly fast shipping! The customer service team was super helpful.',
    verified: true,
  },
  {
    name: 'Michael Chen',
    role: 'Verified Buyer',
    avatar: '👨‍💻',
    rating: 5,
    comment: 'Best shopping experience ever. Great prices, authentic products, and hassle-free returns.',
    verified: true,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Verified Buyer',
    avatar: '👩‍🎨',
    rating: 4,
    comment: 'Love the wide selection of products. Found exactly what I was looking for at a great price.',
    verified: true,
  },
]

export function PremiumTestimonials() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {testimonials.map((testimonial, index) => (
        <div
          key={index}
          className="group animate-slideUp"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="relative bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 hover:border-white/40 transition-all duration-300 h-full">
            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < testimonial.rating
                      ? 'fill-yellow-300 text-yellow-300'
                      : 'text-white/30'
                  }`}
                />
              ))}
            </div>

            {/* Comment */}
            <p className="text-white/90 mb-6 leading-relaxed text-lg">
              "{testimonial.comment}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 pt-6 border-t border-white/10">
              <div className="text-4xl">{testimonial.avatar}</div>
              <div>
                <h4 className="font-bold text-white">{testimonial.name}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-white/60 text-sm">{testimonial.role}</p>
                  {testimonial.verified && (
                    <span className="text-green-400 text-sm">✓ Verified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
