'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cartStore'
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
  variant?: 'grid' | 'list'
  className?: string
}

export default function ProductCard({ product, variant = 'grid', className = '' }: ProductCardProps) {
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore()
  const { addItem: addToCart } = useCartStore()

  const isInWishlist = wishlistItems.some((item: { productId: string }) => item.productId === product.id)

  const discountPercentage = product.originalPrice && product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const handleWishlistToggle = () => {
    if (isInWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product.id)
    }
  }

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      id: product.id,
      name: product.title,
      image: product.images?.[0] || 'https://via.placeholder.com/300x300',
      price: product.price || 0,
      originalPrice: product.originalPrice,
      category: product.category || 'Uncategorized',
      quantity: 1,
      stock: product.stock || 0,
    })
  }

  if (variant === 'list') {
    return (
      <div className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden flex ${className}`}>
        {/* Image Section */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <Link href={`/products/${product.id}`}>
            <Image
              src={product.images?.[0] || 'https://via.placeholder.com/300x300'}
                alt={product.name || 'Product image'}
              fill
              className="object-cover"
            />
          </Link>
          
          {discountPercentage > 0 && (
            <div className="absolute top-3 left-3">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                -{discountPercentage}%
              </span>
            </div>
          )}

          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6 flex flex-col">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary-600 transition-colors text-gray-800 mb-2">
              {product.title}
            </h3>
          </Link>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating!)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 font-medium">({product.rating})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
            {product.originalPrice && product.originalPrice > product.price! && (
              <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="mt-auto bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    )
  }

  // Grid variant (default)
  return (
    <div className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden transform hover:scale-105 ${className}`}>
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <Link href={`/products/${product.id}`}>
          <Image
            src={product.images?.[0] || 'https://via.placeholder.com/300x300'}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        </Link>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {discountPercentage > 0 && (
          <div className="absolute top-4 left-4">
            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
              -{discountPercentage}% OFF
            </span>
          </div>
        )}

        {/* New Badge */}
        <div className="absolute top-4 right-4">
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            NEW
          </span>
        </div>

        {/* Action buttons */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 transform translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
          <button
            onClick={handleWishlistToggle}
            className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-white"
          >
            <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          
          <Link href={`/products/${product.id}`}>
            <button className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-white">
              <Eye className="w-5 h-5 text-gray-600" />
            </button>
          </Link>
        </div>

        {/* Quick Add to Cart */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white p-4 translate-y-full group-hover:translate-y-0 transition-all duration-500 flex items-center justify-center gap-3 font-bold text-lg shadow-lg hover:shadow-xl backdrop-blur-sm"
        >
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </button>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow bg-gradient-to-br from-white to-gray-50">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-bold text-lg line-clamp-2 hover:text-purple-600 transition-colors text-gray-800 leading-tight mb-3">
            {product.title}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 transition-colors ${i < Math.floor(product.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 font-semibold bg-gray-100 px-2 py-1 rounded-full">
              {product.rating} ⭐
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            ₹{product.price}
          </span>
          {product.originalPrice && product.originalPrice > product.price! && (
            <span className="text-lg text-gray-500 line-through bg-gray-100 px-2 py-1 rounded">
              ₹{product.originalPrice}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mt-auto">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border border-gray-100">
            <div className={`h-3 flex-grow rounded-full relative overflow-hidden ${
              product.stock! > 5 ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              <div className={`h-full rounded-full transition-all duration-1000 ${
                product.stock! > 5 ? 'bg-gradient-to-r from-green-400 to-green-500 w-full' : 'bg-gradient-to-r from-orange-400 to-red-400 w-1/3'
              }`} />
            </div>
            <p className={`text-xs font-bold px-2 py-1 rounded-full ${
              product.stock! > 5 
                ? 'text-green-700 bg-green-100' 
                : 'text-orange-700 bg-orange-100'
            }`}>
              {product.stock! > 5 ? '✅ In Stock' : `⚠️ Only ${product.stock} left`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
