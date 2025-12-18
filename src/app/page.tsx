'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { 
  ArrowRight, 
  Star, 
  ShoppingCart, 
  Heart,
  Truck,
  Shield,
  RotateCcw,
  Headphones,
  Sparkles,
  TrendingUp,
  Zap,
  Package
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { toast } from 'react-hot-toast'

interface Product {
  id: string
  title: string
  name?: string
  description?: string
  price: number
  originalPrice?: number
  images: string[]
  stock: number
  category: string
  tags?: string[]
  rating?: number
  createdAt?: any
  // Admin panel uses these field names
  featured?: boolean
  trending?: boolean
  newArrival?: boolean
  // API may use these field names
  isFeatured?: boolean
  isTrending?: boolean
  isNewArrival?: boolean
}

interface Banner {
  id: string
  badge: string
  title: string
  subtitle?: string
  description: string
  primaryButtonText: string
  primaryButtonLink: string
  secondaryButtonText: string
  secondaryButtonLink: string
  backgroundType: 'gradient' | 'image'
  backgroundGradient: string
  backgroundImage: string
  isActive: boolean
}

// Categories with emoji icons (no external images)
const categories = [
  { name: 'Electronics', icon: '📱', slug: 'electronics', color: 'bg-blue-500' },
  { name: 'Fashion', icon: '👔', slug: 'fashion', color: 'bg-pink-500' },
  { name: 'Home & Kitchen', icon: '🏠', slug: 'home-kitchen', color: 'bg-amber-500' },
  { name: 'Beauty', icon: '💄', slug: 'beauty', color: 'bg-rose-500' },
  { name: 'Sports', icon: '⚽', slug: 'sports', color: 'bg-green-500' },
  { name: 'Books', icon: '📚', slug: 'books', color: 'bg-purple-500' }
]

// Product Card Component
function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore()
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore()
  
  const isInWishlist = wishlistItems.some((item: any) => item.productId === product.id)
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      productId: product.id,
      id: product.id,
      name: product.name || product.title,
      image: product.images?.[0] || '',
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category || 'General',
      quantity: 1,
      stock: product.stock || 10
    })
    toast.success('Added to cart!')
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isInWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product.id)
    }
  }

  return (
    <Link href={`/products/${product.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name || product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package className="w-16 h-16" />
            </div>
          )}
          
          {/* Badges */}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discount}%
            </span>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 transition"
          >
            <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          <p className="text-xs text-purple-600 font-medium">{product.category}</p>
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mt-1 min-h-[2.5rem]">
            {product.name || product.title}
          </h3>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1 mt-2">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-600">{product.rating}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
            )}
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full mt-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  )
}

// Loading Skeleton
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-9 bg-gray-200 rounded w-full" />
      </div>
    </div>
  )
}

// Section Component
function ProductSection({ 
  title, 
  subtitle, 
  icon: Icon, 
  iconColor,
  products, 
  isLoading, 
  viewAllLink
}: { 
  title: string
  subtitle: string
  icon: any
  iconColor: string
  products: Product[]
  isLoading: boolean
  viewAllLink: string
}) {
  if (!isLoading && products.length === 0) {
    return null // Don't show section if no products
  }

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${iconColor} rounded-lg flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <Link 
            href={viewAllLink} 
            className="text-purple-600 text-sm font-medium flex items-center gap-1 hover:underline"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {isLoading
            ? [...Array(5)].map((_, i) => <ProductSkeleton key={i} />)
            : products.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
          }
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [banner, setBanner] = useState<Banner | null>(null)

  // Default banner fallback
  const defaultBanner: Banner = {
    id: 'default',
    badge: '🎉 Welcome to Budget Bucket',
    title: 'Shop Smart, Save Big',
    description: 'Discover amazing deals on electronics, fashion, home essentials and more. Quality products at prices that fit your budget.',
    primaryButtonText: 'Shop Now',
    primaryButtonLink: '/products',
    secondaryButtonText: 'View Deals',
    secondaryButtonLink: '/products?filter=deals',
    backgroundType: 'gradient',
    backgroundGradient: 'from-purple-600 via-purple-700 to-indigo-800',
    backgroundImage: '',
    isActive: true,
  }

  // Fetch banner and products from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch active banner
        const bannersRef = collection(db, 'banners')
        const bannersSnapshot = await getDocs(bannersRef)
        const activeBanners = bannersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Banner))
          .filter(b => b.isActive)
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        
        if (activeBanners.length > 0) {
          setBanner(activeBanners[0])
        }
        
        // Fetch products
        const productsRef = collection(db, 'products')
        const snapshot = await getDocs(productsRef)
        
        const allProducts: Product[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product))

        console.log('Fetched products:', allProducts.length)

        // Featured Products - products marked as featured or with BestSeller tag
        const featured = allProducts.filter(p => 
          p.featured === true || p.isFeatured === true || p.tags?.includes('BestSeller')
        )
        console.log('Featured products:', featured.length)
        setFeaturedProducts(featured)

        // New Arrivals - products marked as new or with New tag
        const newProducts = allProducts.filter(p => 
          p.newArrival === true || p.isNewArrival === true || p.tags?.includes('New')
        )
        console.log('New arrivals:', newProducts.length)
        setNewArrivals(newProducts)

        // Trending Products - products marked as trending or with Hot/Trending tag
        const trending = allProducts.filter(p => 
          p.trending === true || p.isTrending === true || p.tags?.includes('Trending') || p.tags?.includes('Hot')
        )
        console.log('Trending products:', trending.length)
        setTrendingProducts(trending)

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Use fetched banner or default
  const activeBanner = banner || defaultBanner

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section - Dynamic from Firebase */}
        <section 
          className={`text-white relative ${
            activeBanner.backgroundType === 'gradient' 
              ? `bg-gradient-to-br ${activeBanner.backgroundGradient}` 
              : ''
          }`}
          style={
            activeBanner.backgroundType === 'image' && activeBanner.backgroundImage
              ? { backgroundImage: `url(${activeBanner.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : {}
          }
        >
          {activeBanner.backgroundType === 'image' && (
            <div className="absolute inset-0 bg-black/40" />
          )}
          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="max-w-2xl">
              {activeBanner.badge && (
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                  {activeBanner.badge}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {activeBanner.title}
              </h1>
              {activeBanner.subtitle && (
                <h2 className="text-2xl md:text-3xl font-semibold mb-3 text-white/90">
                  {activeBanner.subtitle}
                </h2>
              )}
              <p className="text-lg text-purple-100 mb-8">
                {activeBanner.description}
              </p>
              <div className="flex flex-wrap gap-4">
                {activeBanner.primaryButtonText && (
                  <Link
                    href={activeBanner.primaryButtonLink || '/products'}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-700 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    {activeBanner.primaryButtonText} <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
                {activeBanner.secondaryButtonText && (
                  <Link
                    href={activeBanner.secondaryButtonLink || '/products'}
                    className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/50 text-white rounded-lg font-semibold hover:bg-white/10 transition"
                  >
                    {activeBanner.secondaryButtonText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Bar */}
        <section className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Free Shipping</p>
                  <p className="text-xs text-gray-500">Orders over ₹500</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Secure Payment</p>
                  <p className="text-xs text-gray-500">100% protected</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Easy Returns</p>
                  <p className="text-xs text-gray-500">7 days policy</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">24/7 Support</p>
                  <p className="text-xs text-gray-500">Always here</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-10 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Shop by Category</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/products?category=${category.slug}`}
                  className="group text-center"
                >
                  <div className={`w-16 h-16 mx-auto ${category.color} rounded-2xl flex items-center justify-center text-3xl mb-2 group-hover:scale-110 transition-transform shadow-lg`}>
                    {category.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition">
                    {category.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <ProductSection
          title="Featured Products"
          subtitle="Handpicked just for you"
          icon={Sparkles}
          iconColor="bg-purple-500"
          products={featuredProducts}
          isLoading={isLoading}
          viewAllLink="/products?filter=featured"
        />

        {/* Promo Banner */}
        <section className="py-10 bg-gradient-to-r from-orange-500 to-rose-500">
          <div className="max-w-7xl mx-auto px-4 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">🎁 Special Offer!</h2>
            <p className="text-lg mb-4">Get 20% off on your first order. Use code: FIRST20</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Shop Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* New Arrivals */}
        <ProductSection
          title="New Arrivals"
          subtitle="Fresh products just landed"
          icon={Zap}
          iconColor="bg-green-500"
          products={newArrivals}
          isLoading={isLoading}
          viewAllLink="/products?filter=new"
        />

        {/* Trending Products */}
        <ProductSection
          title="🔥 Trending Now"
          subtitle="What everyone is buying"
          icon={TrendingUp}
          iconColor="bg-orange-500"
          products={trendingProducts}
          isLoading={isLoading}
          viewAllLink="/products?filter=trending"
        />

        {/* CTA Section */}
        <section className="py-12 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to Start Shopping?</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Browse our collection of quality products at amazing prices.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Browse All Products <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
