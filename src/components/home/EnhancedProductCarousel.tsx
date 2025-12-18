'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Star } from 'lucide-react'

interface ProductCarouselProps {
  variant?: 'featured' | 'new'
}

const products = [
  {
    id: 1,
    name: 'Premium Wireless Headphones',
    price: 129.99,
    originalPrice: 199.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    rating: 4.8,
    reviews: 324,
    inStock: true,
    badge: 'Best Seller',
  },
  {
    id: 2,
    name: 'Smart Watch Pro',
    price: 199.99,
    originalPrice: 299.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    rating: 4.9,
    reviews: 512,
    inStock: true,
    badge: 'New',
  },
  {
    id: 3,
    name: 'Ultra HD Camera',
    price: 449.99,
    originalPrice: 599.99,
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&h=500&fit=crop',
    rating: 4.7,
    reviews: 189,
    inStock: true,
    badge: 'Premium',
  },
  {
    id: 4,
    name: 'Portable SSD 1TB',
    price: 99.99,
    originalPrice: 149.99,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&h=500&fit=crop',
    rating: 4.8,
    reviews: 278,
    inStock: true,
    badge: 'Deal',
  },
]

export function EnhancedProductCarousel({ variant: _variant = 'featured' }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [itemsPerView, setItemsPerView] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Handle responsive items per view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(4)
      } else if (window.innerWidth >= 768) {
        setItemsPerView(2)
      } else {
        setItemsPerView(1)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-slide effect
  useEffect(() => {
    if (!autoPlay) return

    const interval = setInterval(() => {
      setIsTransitioning(true)
      setCurrentIndex((prev) => {
        const maxIndex = Math.ceil(products.length - itemsPerView)
        return prev >= maxIndex ? 0 : prev + 1
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [autoPlay, itemsPerView])

  const scroll = (direction: 'left' | 'right') => {
    setAutoPlay(false)
    setIsTransitioning(true)

    setCurrentIndex((prev) => {
      const maxIndex = Math.ceil(products.length - itemsPerView)
      if (direction === 'left') {
        return prev === 0 ? maxIndex : prev - 1
      } else {
        return prev >= maxIndex ? 0 : prev + 1
      }
    })

    // Resume autoplay after 5 seconds of inactivity
    setTimeout(() => setAutoPlay(true), 5000)
  }

  const handleDotClick = (index: number) => {
    setAutoPlay(false)
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setAutoPlay(true), 5000)
  }

  const translateValue = -(currentIndex * (100 / itemsPerView))

  return (
    <div className="w-full">
      {/* Navigation Buttons */}
      <div className="flex justify-between md:justify-end gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => scroll('left')}
          className="group w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white hover:shadow-lg transition-all duration-300 flex items-center justify-center hover:scale-110 transform active:scale-95"
          aria-label="Previous products"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="group w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white hover:shadow-lg transition-all duration-300 flex items-center justify-center hover:scale-110 transform active:scale-95"
          aria-label="Next products"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* Products Container with Scroll */}
      <div className="relative overflow-hidden">
        <div
          className={`flex gap-3 sm:gap-4 md:gap-6 transition-transform duration-500 ${isTransitioning ? 'ease-out' : 'ease-linear'}`}
          style={{
            transform: `translateX(${translateValue}%)`,
          }}
          onTransitionEnd={() => setIsTransitioning(false)}
        >
          {products.map((product, _index) => (
            <div key={product.id} className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 animate-fadeIn">
              <div className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-purple-300 hover:shadow-2xl transition-all duration-500 h-full flex flex-col transform hover:-translate-y-2">
                {/* Image Container with Overlay */}
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden w-full aspect-square">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Badge */}
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
                    {product.badge}
                  </div>

                  {/* Discount Badge */}
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-2.5 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </div>

                  {/* Quick Actions Overlay */}
                  <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          // Handle wishlist
                        }}
                        className="flex-1 bg-white/95 backdrop-blur-sm text-gray-700 hover:text-red-600 font-semibold py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:bg-white hover:scale-105 shadow-lg"
                      >
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">Wish</span>
                      </button>
                      <Link 
                        href={`/products/${product.id}`}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:scale-105"
                      >
                        <span className="text-sm">View</span>
                      </Link>
                    </div>
                  </div>

                  {/* Stock Badge */}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="bg-white/95 rounded-full px-4 py-2">
                        <span className="text-gray-900 font-bold text-sm">Out of Stock</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col">
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 transition-colors ${
                            i < Math.floor(product.rating) 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-sm text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors leading-snug">
                    {product.name}
                  </h3>

                  {/* Price Section */}
                  <div className="mt-auto">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-lg font-black text-gray-900">
                        ₹{Math.round(product.price * 83)} {/* Convert to INR */}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        ₹{Math.round(product.originalPrice * 83)}
                      </span>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        // Handle add to cart
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-700 text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot Navigation */}
      <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
        {Array.from({ length: Math.max(1, products.length - itemsPerView + 1) }).map(
          (_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'bg-purple-600 w-6 sm:w-8 md:w-10'
                  : 'bg-gray-300 hover:bg-gray-400 w-2 sm:w-2.5 md:w-3'
              } h-2 sm:h-2.5 md:h-3`}
              aria-label={`Go to slide ${index + 1}`}
            />
          )
        )}
      </div>
    </div>
  )
}
