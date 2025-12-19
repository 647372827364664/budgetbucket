'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { ShoppingCart, Heart, ArrowRight, Star, Zap, CheckCircle2, Filter } from 'lucide-react'
import Link from 'next/link'

interface WishlistProduct {
  id: string
  title: string
  price: number
  originalPrice?: number
  image?: string
  category?: string
  stock?: number
  rating?: number
  addedAt?: Date
}

export default function WishlistPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { items, removeItem } = useWishlistStore()
  const { addItem } = useCartStore()
  const [products, setProducts] = useState<WishlistProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high'>('recent')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Fetch product details for wishlist items
    const fetchWishlistProducts = async () => {
      try {
        const wishlistProducts = await Promise.all(
          items.map(async (item: { productId: string }) => {
            try {
              const response = await fetch(`/api/products/${item.productId}`)
              if (response.ok) {
                const product = await response.json()
                return {
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  originalPrice: product.originalPrice,
                  image: product.images?.[0],
                  category: product.category,
                  stock: product.stock,
                  rating: product.rating || Math.random() * 2 + 3,
                  addedAt: new Date(),
                }
              }
            } catch (error) {
              console.error('Error fetching product:', error)
            }
            return null
          })
        )

        const validProducts = wishlistProducts.filter((p) => p !== null) as WishlistProduct[]
        setProducts(validProducts)

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(validProducts.map((p) => p.category).filter(Boolean))
        ) as string[]
        setCategories(uniqueCategories)
      } catch (error) {
        console.error('Error fetching wishlist products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (items.length > 0) {
      fetchWishlistProducts()
    } else {
      setIsLoading(false)
    }
  }, [items, user, router])

  // Filter and sort products
  const filteredProducts = products
    .filter((p) => filterCategory === 'all' || p.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        default:
          return 0
      }
    })

  const handleAddToCart = (product: WishlistProduct) => {
    if (!product.stock || product.stock === 0) {
      alert('Product is out of stock')
      return
    }

    addItem({
      id: product.id,
      productId: product.id,
      name: product.title,
      price: product.price,
      image: product.image || '',
      quantity: 1,
      stock: product.stock,
      category: product.category || 'Product',
    })

    alert(`${product.title} added to cart!`)
  }

  const handleRemoveFromWishlist = (productId: string) => {
    removeItem(productId)
  }

  const discount = (product: WishlistProduct) => {
    if (product.originalPrice) {
      return Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    }
    return 0
  }

  const totalValue = filteredProducts.reduce((sum, p) => sum + p.price, 0)
  const savedAmount = filteredProducts.reduce(
    (sum, p) => sum + (p.originalPrice ? p.originalPrice - p.price : 0),
    0
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <div className="w-32 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex justify-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
          <p className="text-center text-slate-600 mt-4">Loading your wishlist...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <span className="text-white font-black text-lg">BB</span>
              </div>
              <span className="font-black text-gray-900 hidden sm:block">Budget Bucket</span>
            </Link>

            <div className="text-right">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">My Wishlist</h1>
              <p className="text-sm text-gray-600">{filteredProducts.length} items saved</p>
            </div>
          </div>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-1">Total Items</p>
                  <p className="text-3xl font-bold text-slate-900">{products.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-1">Total Value</p>
                  <p className="text-3xl font-bold text-slate-900">₹{totalValue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-1">Total Savings</p>
                  <p className="text-3xl font-bold text-green-600">₹{savedAmount.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Sorting */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-slate-600" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm font-medium bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm font-medium bg-white"
                >
                  <option value="recent">Recently Added</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setFilterCategory('all')
                  setSortBy('recent')
                }}
                className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Wishlist Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-purple-300 transition-all duration-300"
                >
                  {/* Product Image Container */}
                  <div className="relative overflow-hidden bg-slate-100 h-56">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <span className="text-6xl">📦</span>
                      </div>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.stock || product.stock === 0}
                        className="bg-white text-purple-600 px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart
                      </button>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      {discount(product) > 0 && (
                        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                          {discount(product)}% OFF
                        </div>
                      )}

                      {product.stock && product.stock > 0 ? (
                        <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          In Stock
                        </div>
                      ) : (
                        <div className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                          Out of Stock
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      className="absolute top-3 left-3 bg-white rounded-full p-2.5 shadow-lg hover:bg-red-50 hover:scale-110 transition-all group-hover/heart"
                    >
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    {/* Category & Rating */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">
                        {product.category || 'Product'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold text-slate-700">
                          {product.rating?.toFixed(1) || '4.5'}
                        </span>
                      </div>
                    </div>

                    {/* Product Title */}
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-bold text-slate-900 hover:text-purple-600 line-clamp-2 mb-3 transition-colors">
                        {product.title}
                      </h3>
                    </Link>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-black text-slate-900">
                        ₹{product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-slate-500 line-through font-semibold">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Stock Info */}
                    {product.stock && product.stock > 0 && (
                      <div className="text-xs text-slate-600 font-medium mb-3">
                        {product.stock > 10 ? (
                          <span className="text-green-600">✓ Plenty in stock</span>
                        ) : (
                          <span className="text-orange-600">⚠ Only {product.stock} left</span>
                        )}
                      </div>
                    )}

                    {/* View Details Button */}
                    <Link
                      href={`/products/${product.id}`}
                      className="w-full py-2.5 px-4 border-2 border-slate-300 text-slate-900 font-bold rounded-lg hover:border-purple-600 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No items found</h2>
              <p className="text-slate-600 mb-6">Try adjusting your filters to find items</p>
              <button
                onClick={() => {
                  setFilterCategory('all')
                  setSortBy('recent')
                }}
                className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 sm:p-12 text-center text-white shadow-xl">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Ready to checkout?</h2>
            <p className="text-lg text-purple-100 mb-8">
              Add items from your wishlist to cart and complete your purchase
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-purple-50 transition-colors hover:scale-105 transform"
            >
              Continue Shopping
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Your wishlist is empty</h2>
            <p className="text-lg text-slate-600 mb-8">
              Start adding items to your wishlist to save them for later and get better deals!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Explore Products
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
