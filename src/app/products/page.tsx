'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Search, 
  Grid3X3, 
  LayoutList, 
  Star, 
  Heart, 
  ShoppingCart,
  SlidersHorizontal,
  X,
  Package,
  Sparkles,
  TrendingUp,
  Filter,
  ArrowUpDown
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { toast } from 'react-hot-toast'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { db } from '@/lib/firebase'
import { collection, getDocs, Timestamp } from 'firebase/firestore'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  originalPrice?: number
  images: string[]
  rating: number
  reviewCount: number
  stock: number
  category: string
  brand: string
  tags: string[]
  description: string
  isFeatured?: boolean
  isNew?: boolean
}

// Generate slug from product name
const generateSlug = (name: string, id: string): string => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${slug}-${id.slice(-6)}`
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [showFilters, setShowFilters] = useState(false)

  const { addItem: addToCart } = useCartStore()
  const { toggleItem: toggleWishlist, isFavorite } = useWishlistStore()

  // Fetch products from Firebase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const productsRef = collection(db, 'products')
        const snapshot = await getDocs(productsRef)
        
        const productsData: Product[] = snapshot.docs.map(doc => {
          const data = doc.data()
          const name = data.name || 'Unnamed Product'
          return {
            id: doc.id,
            name: name,
            slug: generateSlug(name, doc.id),
            price: typeof data.price === 'number' ? data.price : 0,
            originalPrice: typeof data.originalPrice === 'number' ? data.originalPrice : undefined,
            images: Array.isArray(data.images) ? data.images : [],
            rating: typeof data.rating === 'number' ? data.rating : 4.0,
            reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
            stock: typeof data.stock === 'number' ? data.stock : 0,
            category: data.category || 'Uncategorized',
            brand: data.brand || 'Generic',
            tags: Array.isArray(data.tags) ? data.tags : [],
            description: data.description || '',
            isFeatured: Boolean(data.isFeatured),
            isNew: data.createdAt instanceof Timestamp 
              ? (Date.now() - data.createdAt.toDate().getTime()) < 7 * 24 * 60 * 60 * 1000
              : false
          }
        })
        
        setProducts(productsData)
      } catch (error) {
        console.error('Error fetching products:', error)
        toast.error('Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Get unique categories and brands
  const categories = useMemo(() => 
    ['all', ...new Set(products.map(p => p.category).filter(Boolean))],
    [products]
  )
  
  const brands = useMemo(() => 
    ['all', ...new Set(products.map(p => p.brand).filter(Boolean))],
    [products]
  )

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      const matchesBrand = selectedBrand === 'all' || product.brand === selectedBrand
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]
      
      return matchesSearch && matchesCategory && matchesBrand && matchesPrice
    })

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
        break
      case 'featured':
      default:
        filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
    }

    return filtered
  }, [products, searchTerm, selectedCategory, selectedBrand, priceRange, sortBy])

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (product.stock > 0) {
      addToCart({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.images[0] || '',
        category: product.category,
        quantity: 1,
        stock: product.stock
      })
      toast.success('Added to cart!')
    } else {
      toast.error('Out of stock')
    }
  }

  const handleToggleWishlist = (product: Product, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    toggleWishlist(product.id)
    
    if (isFavorite(product.id)) {
      toast.success('Removed from wishlist')
    } else {
      toast.success('Added to wishlist!')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const getDiscount = (price: number, originalPrice?: number) => {
    if (!originalPrice || originalPrice <= price) return 0
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Discover Amazing Products
              </h1>
              <p className="text-lg text-white/80 mb-6">
                Explore our curated collection of premium products at unbeatable prices
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for products, brands, categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-500 shadow-xl focus:ring-4 focus:ring-white/30 outline-none transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
              <Package className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-medium text-gray-700">{products.length} Products</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">{products.filter(p => p.isNew).length} New Arrivals</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-700">{products.filter(p => p.isFeatured).length} Featured</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* Categories */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-violet-600" />
                    Categories
                  </h3>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          selectedCategory === category
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {category === 'all' ? 'All Categories' : category}
                        <span className="float-right text-xs opacity-70">
                          {category === 'all' 
                            ? products.length 
                            : products.filter(p => p.category === category).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Brands</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {brands.map(brand => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          selectedBrand === brand
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {brand === 'all' ? 'All Brands' : brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Min</label>
                        <input
                          type="number"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                          placeholder="₹0"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Max</label>
                        <input
                          type="number"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                          placeholder="₹100000"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setPriceRange([0, 100000])}
                      className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                    >
                      Reset Price
                    </button>
                  </div>
                </div>

                {/* Clear All Filters */}
                {(selectedCategory !== 'all' || selectedBrand !== 'all' || searchTerm) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('all')
                      setSelectedBrand('all')
                      setSearchTerm('')
                      setPriceRange([0, 100000])
                    }}
                    className="w-full py-3 text-red-600 hover:text-red-700 font-medium text-sm border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Mobile Filter Button */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-gray-700 font-medium"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      Filters
                    </button>

                    <p className="text-sm text-gray-600">
                      Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span> products
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Sort */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none cursor-pointer"
                      >
                        <option value="featured">Featured</option>
                        <option value="newest">Newest First</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Highest Rated</option>
                      </select>
                      <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${
                          viewMode === 'grid' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-500'
                        }`}
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${
                          viewMode === 'list' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-500'
                        }`}
                      >
                        <LayoutList className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Grid/List */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading products...</p>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-6">Try adjusting your filters or search term</p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all')
                      setSelectedBrand('all')
                      setSearchTerm('')
                    }}
                    className="px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filteredProducts.map(product => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-violet-200 transition-all duration-300"
                    >
                      {/* Image */}
                      <div className="relative aspect-square bg-gray-50 overflow-hidden">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-gray-300" />
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {product.isNew && (
                            <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                              NEW
                            </span>
                          )}
                          {getDiscount(product.price, product.originalPrice) > 0 && (
                            <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                              -{getDiscount(product.price, product.originalPrice)}%
                            </span>
                          )}
                        </div>

                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => handleToggleWishlist(product, e)}
                          className={`absolute top-3 right-3 p-2.5 rounded-full shadow-lg transition-all ${
                            isFavorite(product.id)
                              ? 'bg-red-500 text-white'
                              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                        </button>

                        {/* Quick Add to Cart */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            disabled={product.stock === 0}
                            className="w-full py-2.5 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-violet-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <p className="text-xs text-violet-600 font-medium mb-1">{product.brand}</p>
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                          {product.name}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < Math.floor(product.rating)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">({product.reviewCount})</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                          )}
                        </div>

                        {/* Stock Status */}
                        {product.stock > 0 && product.stock <= 5 && (
                          <p className="text-xs text-orange-600 mt-2">Only {product.stock} left!</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-4">
                  {filteredProducts.map(product => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-violet-200 transition-all duration-300"
                    >
                      {/* Image */}
                      <div className="relative w-48 md:w-64 aspect-square bg-gray-50 flex-shrink-0">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {product.isNew && (
                            <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                              NEW
                            </span>
                          )}
                          {getDiscount(product.price, product.originalPrice) > 0 && (
                            <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                              -{getDiscount(product.price, product.originalPrice)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6 flex flex-col">
                        <div className="flex-1">
                          <p className="text-sm text-violet-600 font-medium mb-1">{product.brand} • {product.category}</p>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-violet-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-gray-500 text-sm line-clamp-2 mb-4">{product.description}</p>

                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(product.rating)
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">{product.rating} ({product.reviewCount} reviews)</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Price */}
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-lg text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => handleToggleWishlist(product, e)}
                              className={`p-3 rounded-xl transition-all ${
                                isFavorite(product.id)
                                  ? 'bg-red-100 text-red-500'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <Heart className={`w-5 h-5 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => handleAddToCart(product, e)}
                              disabled={product.stock === 0}
                              className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <ShoppingCart className="w-5 h-5" />
                              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
