'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, ShoppingCart, Star, Zap, TrendingUp, Award } from 'lucide-react'

interface EnhancedProductCardProps {
  id: number
  name: string
  price: number
  originalPrice: number
  image: string
  rating: number
  reviews: number
  inStock: boolean
  badge: string
  isBestseller?: boolean
  isPremium?: boolean
  discount?: number
}

export function EnhancedProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  rating,
  reviews,
  inStock,
  badge,
  isBestseller = false,
  isPremium = false,
  discount = 0,
}: EnhancedProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAddedToCart, setIsAddedToCart] = useState(false)

  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100)

  return (
    <Link href={`/products/${id}`}>
      <div className="group h-full flex flex-col bg-white rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-200 sm:border-2 overflow-hidden hover:border-purple-400 hover:shadow-lg sm:hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 sm:hover:-translate-y-2">
        {/* Image Container */}
        <div className="relative overflow-hidden bg-gray-100 aspect-square sm:aspect-square flex items-center justify-center">
          {/* Image */}
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Badges Container */}
          <div className="absolute inset-0 flex flex-col items-start justify-start p-2 sm:p-3 md:p-4 pointer-events-none">
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {/* Main Badge */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold shadow-lg">
                {badge}
              </div>

              {/* Bestseller Badge */}
              {isBestseller && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Bestseller
                </div>
              )}

              {/* Premium Badge */}
              {isPremium && (
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                  <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Premium
                </div>
              )}
            </div>

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 bg-red-500 text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                -{discountPercent}%
              </div>
            )}

            {/* Flash Sale Badge */}
            {discount > 0 && (
              <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 animate-pulse-soft">
                <Zap className="w-2.5 h-2.5" />
                SALE
              </div>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              setIsFavorite(!isFavorite)
            }}
            className="absolute bottom-2 sm:bottom-3 md:bottom-4 right-2 sm:right-3 md:right-4 w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full bg-white/95 backdrop-blur shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group/heart hover:scale-110 active:scale-95 z-10"
          >
            <Heart
              className={`w-5 h-5 sm:w-5.5 sm:h-5.5 lg:w-6 lg:h-6 transition-all duration-300 ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 group-hover/heart:text-red-400'
              }`}
            />
          </button>

          {/* Stock Badge */}
          {!inStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 md:p-5 flex flex-col">
          {/* Category/Type */}
          <p className="text-xs text-gray-500 font-medium mb-1.5">Electronics</p>

          {/* Product Name */}
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300 min-h-8 sm:min-h-10">
            {name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ${
                    i < Math.round(rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {rating}
            </span>
            <span className="text-xs text-gray-500">({reviews})</span>
          </div>

          {/* Price Section */}
          <div className="mb-3 sm:mb-4 mt-auto">
            <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1">
              <span className="text-base sm:text-lg md:text-xl font-black text-gray-900">
                ₹{price.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 line-through font-medium">
                ₹{originalPrice.toLocaleString()}
              </span>
            </div>
            {discountPercent > 0 && (
              <p className="text-xs text-green-600 font-bold">
                You save ₹{(originalPrice - price).toLocaleString()}
              </p>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              setIsAddedToCart(true)
              setTimeout(() => setIsAddedToCart(false), 2000)
            }}
            disabled={!inStock}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 group hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-9 sm:min-h-10 md:min-h-12 text-xs sm:text-sm md:text-base"
          >
            {isAddedToCart ? (
              <>
                <span>✓ Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          {/* Quick View Badge */}
          <p className="text-center text-xs text-gray-500 mt-1.5 sm:mt-2 group-hover:text-purple-600 transition-colors font-medium">
            Click to view details
          </p>
        </div>
      </div>
    </Link>
  )
}
