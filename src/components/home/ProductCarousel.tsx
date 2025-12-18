'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Heart } from 'lucide-react'

interface Product {
  id: string
  name: string
  image: string
  price: number
  originalPrice: number
  rating: number
  reviews: number
  stock: number
}

const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    price: 2499,
    originalPrice: 4999,
    rating: 4.8,
    reviews: 324,
    stock: 45,
  },
  {
    id: '2',
    name: 'Smart Watch Pro',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    price: 5999,
    originalPrice: 9999,
    rating: 4.6,
    reviews: 512,
    stock: 28,
  },
  {
    id: '3',
    name: 'Ultra HD Camera',
    image: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=500&h=500&fit=crop',
    price: 8999,
    originalPrice: 14999,
    rating: 4.9,
    reviews: 286,
    stock: 15,
  },
  {
    id: '4',
    name: 'Portable Charger 20000mAh',
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&h=500&fit=crop',
    price: 1299,
    originalPrice: 2499,
    rating: 4.7,
    reviews: 645,
    stock: 120,
  },
  {
    id: '5',
    name: 'Mechanical Keyboard RGB',
    image: 'https://images.unsplash.com/photo-1587829191301-4b86c5a21cb7?w=500&h=500&fit=crop',
    price: 3499,
    originalPrice: 6499,
    rating: 4.8,
    reviews: 423,
    stock: 67,
  },
]

interface ProductCarouselProps {
  title: string
  description?: string
}

export function ProductCarousel({ title, description }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    if (!autoPlay) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sampleProducts.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [autoPlay])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % sampleProducts.length)
    setAutoPlay(false)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + sampleProducts.length) % sampleProducts.length)
    setAutoPlay(false)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setAutoPlay(false)
  }

  const getVisibleProducts = () => {
    const products = []
    for (let i = 0; i < 3; i++) {
      products.push(sampleProducts[(currentIndex + i) % sampleProducts.length])
    }
    return products
  }

  const discount = (product: Product) => {
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
  }

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-10 animate-fadeIn">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{title}</h2>
          {description && <p className="text-gray-600 text-lg">{description}</p>}
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {getVisibleProducts().map((product, idx) => (
              <div
                key={product.id}
                className="animate-slideUp opacity-100 transition-all duration-500"
                style={{
                  animationDelay: `${idx * 0.1}s`,
                }}
              >
                <Link href={`/products/${product.id}`}>
                  <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-300 h-full flex flex-col">
                    {/* Image Container */}
                    <div className="relative overflow-hidden bg-gray-100 h-64">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />

                      {/* Discount Badge */}
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold">
                        -{discount(product)}%
                      </div>

                      {/* Wishlist Button */}
                      <button className="absolute top-3 left-3 bg-white rounded-full p-2.5 shadow-lg hover:bg-primary-600 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100">
                        <Heart className="w-5 h-5" />
                      </button>

                      {/* Stock Indicator */}
                      {product.stock < 20 && (
                        <div className="absolute bottom-3 left-3 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Only {product.stock} left
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-grow">
                      {/* Product Name */}
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2 h-14">
                        {product.name}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">({product.reviews})</span>
                      </div>

                      {/* Price */}
                      <div className="mb-4 flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                        <span className="text-sm text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                      </div>

                      {/* Add to Cart Button */}
                      <button className="mt-auto w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-2.5 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-95">
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevSlide}
              className="p-3 rounded-full bg-white border-2 border-gray-200 hover:border-primary-600 hover:bg-primary-50 transition-all duration-300 shadow-md hover:shadow-lg"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            {/* Dots */}
            <div className="flex gap-3 items-center">
              {sampleProducts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-8 h-3 bg-primary-600'
                      : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="p-3 rounded-full bg-white border-2 border-gray-200 hover:border-primary-600 hover:bg-primary-50 transition-all duration-300 shadow-md hover:shadow-lg"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* View All Button */}
          <div className="mt-10 text-center">
            <Link
              href="/products"
              className="inline-block px-8 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.05] active:scale-95"
            >
              View All Products
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
