'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, Star, ShoppingCart, Heart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'

interface Product {
  id: string
  title: string
  price: number
  image: string
  category: string
  averageRating: number
  totalReviews: number
  stock: number
  discount?: number
}

interface Stats {
  totalProducts: number
  priceRange: { min: number; max: number }
  categories: string[]
  ratingOptions: number[]
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addItem } = useCartStore()
  const { toggleItem, isFavorite } = useWishlistStore()

  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '')
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest')
  const [showFilters, setShowFilters] = useState(false)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (category) params.append('category', category)
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)
      if (minRating) params.append('minRating', minRating)
      if (inStock) params.append('inStock', 'true')
      params.append('sortBy', sortBy)
      params.append('pageSize', '20')

      const response = await fetch(`/api/search?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.data)
        setStats(data.stats)
        
        // Update URL
        router.push(
          `/search?${params.toString()}`,
          { scroll: false }
        )
      } else {
        setError(data.error)
      }
    } catch (err: any) {
      setError('Failed to fetch products')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, category, minPrice, maxPrice, minRating, inStock, sortBy, router])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.title,
      price: product.price,
      image: product.image,
      quantity: 1,
      stock: product.stock,
      category: product.category,
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setCategory('')
    setMinPrice('')
    setMaxPrice('')
    setMinRating('')
    setInStock(false)
    setSortBy('newest')
  }

  const hasActiveFilters =
    searchQuery || category || minPrice || maxPrice || minRating || inStock || sortBy !== 'newest'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Products</h1>
          <p className="text-gray-600">Find exactly what you're looking for</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-200 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Category Filter */}
              {stats && stats.categories.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value=""
                        checked={category === ''}
                        onChange={() => setCategory('')}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="ml-2 text-gray-700">All Categories</span>
                    </label>
                    {stats.categories.map((cat) => (
                      <label key={cat} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value={cat}
                          checked={category === cat}
                          onChange={() => setCategory(cat)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="ml-2 text-gray-700 capitalize">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Filter */}
              {stats && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Min Price</label>
                      <input
                        type="number"
                        min="0"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder={`₹${stats.priceRange.min}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Max Price</label>
                      <input
                        type="number"
                        min="0"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder={`₹${stats.priceRange.max}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Rating Filter */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Rating</h3>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      value=""
                      checked={minRating === ''}
                      onChange={() => setMinRating('')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="ml-2 text-gray-700">All Ratings</span>
                  </label>
                  {[4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={minRating === rating.toString()}
                        onChange={() => setMinRating(rating.toString())}
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="ml-2 text-gray-700 flex items-center gap-1">
                        {rating}
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> & up
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock Filter */}
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="ml-2 text-gray-700 font-medium">In Stock Only</span>
                </label>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filter Toggle for Mobile */}
            <div className="flex justify-between items-center mb-6 lg:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Results Info */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{products.length}</span> products
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}

            {/* Products Grid */}
            {!loading && products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden group"
                  >
                    <div className="relative overflow-hidden bg-gray-100 h-48">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                      {product.discount && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                          -{product.discount}%
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <p className="text-white font-semibold">Out of Stock</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                        {product.title}
                      </h3>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            {product.averageRating || 0}
                          </span>
                          <span className="text-xs text-gray-600">
                            ({product.totalReviews || 0})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-lg font-bold text-gray-900">₹{product.price}</p>
                          <p className="text-xs text-gray-600">{product.category}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleAddToCart(product)
                          }}
                          disabled={product.stock === 0}
                          className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            toggleItem(product.id)
                          }}
                          className={`px-3 py-2 rounded-lg transition ${
                            isFavorite(product.id)
                              ? 'bg-red-50 text-red-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              isFavorite(product.id) ? 'fill-red-600' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && products.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
