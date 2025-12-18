'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ShoppingBag, Smartphone, Home, Utensils, Zap, Heart, Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  count: number
  image: string
  description?: string
  isActive: boolean
  order: number
}

// Icon mapping for dynamic icons
const iconMap = {
  Smartphone,
  ShoppingBag,
  Home,
  Utensils,
  Zap,
  Heart
}

export function PremiumCategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/categories')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Categories API response:', data)

        if (data.success && data.categories) {
          setCategories(data.categories)
        } else {
          setError(data.message || 'Failed to load categories')
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setError('Failed to load categories')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (isLoading) {
    return (
      <section className="py-12 md:py-20 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Shop by Category
            </h2>
            <p className="text-gray-600 text-lg">
              Find what you love in our curated collection
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-32 md:h-36 lg:h-40 rounded-2xl bg-gray-200 animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-12 md:py-20 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-red-800 mb-2">Failed to Load Categories</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 md:py-20 px-4 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-slideDown">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Shop by Category
          </h2>
          <p className="text-gray-600 text-lg">
            Find what you love in our curated collection
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category, index) => {
            const IconComponent = iconMap[category.icon as keyof typeof iconMap] || ShoppingBag
            return (
              <Link key={category.id} href={`/products?category=${category.slug}`}>
                <div
                  className="group h-full animate-slideUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative h-32 md:h-36 lg:h-40 rounded-2xl overflow-hidden cursor-pointer bg-white border border-gray-100 hover:border-purple-300 transition-all duration-500 hover:shadow-2xl transform hover:-translate-y-2 p-4 flex flex-col items-center justify-center text-center">
                    {/* Background gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5 group-hover:opacity-15 transition-opacity duration-500`} />
                    
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-current opacity-20"></div>
                      <div className="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-current opacity-30"></div>
                      <div className="absolute top-1/2 left-1/4 w-2 h-2 rounded-full bg-current opacity-40"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      {/* Icon Container */}
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500 transform group-hover:-rotate-3`}>
                        <IconComponent className="w-6 h-6 md:w-7 md:h-7" />
                      </div>

                      {/* Name */}
                      <h3 className="font-bold text-gray-900 text-xs md:text-sm leading-tight group-hover:text-purple-600 transition-colors duration-300">
                        {category.name}
                      </h3>

                      {/* Count */}
                      <p className="text-xs text-gray-500 group-hover:text-purple-500 transition-colors duration-300 font-medium">
                        {category.count.toLocaleString()} products
                      </p>

                      {/* Hover indicator */}
                      <div className="mt-1 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                        <div className="flex items-center gap-1 text-purple-600">
                          <span className="text-xs font-semibold">Shop Now</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out"></div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* View All Categories Link */}
        {categories.length >= 6 && (
          <div className="text-center mt-8">
            <Link 
              href="/categories"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <span>View All Categories</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
