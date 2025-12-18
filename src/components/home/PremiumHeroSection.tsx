'use client'

import { ArrowRight, Zap, Star, ShoppingBag, TrendingUp, Gift } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export function PremiumHeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const slides = [
    {
      title: "Premium Shopping Experience",
      subtitle: "Discover exclusive deals on curated products with lightning-fast delivery",
      cta: "Shop Now",
      bg: "from-purple-600 via-purple-700 to-indigo-800",
      accent: "yellow-400"
    },
    {
      title: "Trending Electronics",
      subtitle: "Latest gadgets and tech accessories with up to 70% off this week",
      cta: "Explore Tech",
      bg: "from-blue-600 via-cyan-600 to-teal-700",
      accent: "orange-400"
    },
    {
      title: "Fashion Forward",
      subtitle: "Stay ahead of trends with our exclusive fashion collection",
      cta: "Shop Fashion",
      bg: "from-pink-600 via-purple-600 to-indigo-700",
      accent: "pink-400"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  return (
    <section className="relative min-h-[80vh] md:min-h-[90vh] overflow-hidden">
      {/* Dynamic Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].bg} transition-all duration-1000`} />
      
      {/* Animated geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-32 h-32 bg-white/10 rounded-full animate-float" />
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-white/10 rounded-full animate-float-delayed" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 transform rotate-45 animate-spin-slow" />
        <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-white/10 transform rotate-12 animate-pulse" />
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-4 py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="text-white space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 animate-fadeIn">
                <Zap className={`w-4 h-4 text-${slides[currentSlide].accent}`} />
                <span className="text-sm font-semibold">Limited Time • Up to 70% OFF</span>
              </div>

              {/* Main Content */}
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight animate-slideUp">
                  {slides[currentSlide].title}
                </h1>
                
                <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-lg animate-slideUp" style={{ animationDelay: '0.1s' }}>
                  {slides[currentSlide].subtitle}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                <Link href="/products">
                  <button className={`group px-8 py-4 bg-${slides[currentSlide].accent} hover:bg-opacity-90 text-gray-900 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl hover:shadow-3xl hover:scale-105 transform min-w-[180px]`}>
                    {slides[currentSlide].cta}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="/products">
                  <button className="group px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/30 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2 min-w-[180px]">
                    Browse All
                    <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 pt-4 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">4.9 • 50K+ Reviews</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold">Trending #1 Store</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                  <Gift className="w-4 h-4 text-pink-400" />
                  <span className="text-sm font-semibold">Free Shipping ₹500+</span>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="hidden lg:block relative">
              <div className="relative">
                {/* Main visual container */}
                <div className="relative w-full h-[500px] rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                  
                  {/* Floating product cards */}
                  <div className="absolute top-8 left-8 w-32 h-40 bg-white rounded-2xl shadow-xl animate-float transform rotate-3 overflow-hidden">
                    <div className="h-24 bg-gradient-to-br from-purple-400 to-pink-400"></div>
                    <div className="p-3">
                      <div className="h-2 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  
                  <div className="absolute top-20 right-12 w-28 h-36 bg-white rounded-2xl shadow-xl animate-float-delayed transform -rotate-2 overflow-hidden">
                    <div className="h-20 bg-gradient-to-br from-blue-400 to-cyan-400"></div>
                    <div className="p-2.5">
                      <div className="h-1.5 bg-gray-200 rounded mb-2"></div>
                      <div className="h-1.5 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-12 left-12 w-36 h-44 bg-white rounded-2xl shadow-xl animate-float transform rotate-1 overflow-hidden">
                    <div className="h-28 bg-gradient-to-br from-green-400 to-teal-400"></div>
                    <div className="p-3">
                      <div className="h-2 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>

                  {/* Central feature */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto backdrop-blur-md">
                        <ShoppingBag className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Premium Collection</h3>
                      <p className="text-white/80">Curated just for you</p>
                    </div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide 
                ? 'bg-white w-8 h-3' 
                : 'bg-white/40 w-3 h-3 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
