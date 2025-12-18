'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  Plus,
  Minus,
  Truck,
  Shield,
  RefreshCw,
  Share2,
  Loader2
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { toast } from 'react-hot-toast'

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  category: string
  brand: string
  images: string[]
  rating: number
  reviewCount: number
  inStock: boolean
  stockCount: number
  tags: string[]
  specifications: Record<string, string>
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Image gallery
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Quantity
  const [quantity, setQuantity] = useState(1)

  // Store hooks
  const { addItem: addToCart } = useCartStore()
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore()

  useEffect(() => {
    if (productId) {
      loadProduct()
    }
  }, [productId])

  const loadProduct = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/products/${productId}`)
      const data = await response.json()

      if (data.success) {
        setProduct(data.product)
      } else {
        setError('Product not found')
      }
    } catch (error) {
      console.error('Error loading product:', error)
      setError('Failed to load product')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: quantity
    })
    toast.success(`${quantity} ${product.name} added to cart!`)
  }

  const handleWishlistToggle = () => {
    if (!product) return

    const isInWishlist = wishlistItems.some((item: any) => item.id === product.id)
    
    if (isInWishlist) {
      removeFromWishlist(product.id)
      toast.success('Removed from wishlist')
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0]
      })
      toast.success('Added to wishlist!')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href
      })
    } catch (error) {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
      toast.success('Product link copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h1>
          <p className="text-slate-600 mb-8">{error || 'The product you are looking for could not be found.'}</p>
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const isInWishlist = wishlistItems.some((item: any) => item.id === product.id)
  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-300"></div>
              <nav className="flex items-center gap-2 text-sm text-slate-600">
                <Link href="/" className="hover:text-purple-600">Home</Link>
                <span>/</span>
                <Link href="/products" className="hover:text-purple-600">Products</Link>
                <span>/</span>
                <span className="text-slate-900">{product.name}</span>
              </nav>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:border-purple-500 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-white">
              <Image
                src={product.images[selectedImageIndex]}
                alt={`${product.name} - Product image ${selectedImageIndex + 1}`}
                fill
                className="object-cover"
              />
              
              {/* Discount Badge */}
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {discountPercentage}% OFF
                </div>
              )}

              {/* Image Navigation */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === 0 ? product.images.length - 1 : prev - 1
                    )}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === product.images.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Image Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`
                      relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
                      ${index === selectedImageIndex 
                        ? 'border-purple-500 ring-2 ring-purple-200' 
                        : 'border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Brand & Rating */}
            <div className="space-y-2">
              <p className="text-purple-600 font-medium text-sm uppercase tracking-wide">{product.brand}</p>
              <div className="flex items-center gap-3">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} 
                    />
                  ))}
                </div>
                <span className="text-slate-600">{product.rating} ({product.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Product Name */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
              <p className="text-slate-600 text-lg leading-relaxed">{product.description}</p>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-slate-900">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-xl text-slate-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              {discountPercentage > 0 && (
                <p className="text-green-600 font-medium">You save {formatPrice(product.originalPrice! - product.price)}!</p>
              )}
            </div>

            {/* Stock Status */}
            <div className={`
              inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium
              ${product.inStock 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
              }
            `}>
              <div className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {product.inStock 
                ? `${product.stockCount} units available` 
                : 'Out of stock'
              }
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full hover:bg-purple-100 hover:text-purple-800 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <label className="text-slate-700 font-medium">Quantity:</label>
                <div className="flex items-center border border-slate-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="p-2 hover:bg-slate-50 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 border-x border-slate-300 min-w-[60px] text-center font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(prev => Math.min(product.stockCount, prev + 1))}
                    className="p-2 hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>

                <button
                  onClick={handleWishlistToggle}
                  className={`
                    flex items-center justify-center w-14 h-14 border-2 rounded-xl transition-all
                    ${isInWishlist 
                      ? 'border-red-500 bg-red-50 text-red-600' 
                      : 'border-slate-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                    }
                  `}
                >
                  <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-slate-900">Free Delivery</p>
                <p className="text-xs text-slate-600">On orders above ₹499</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <RefreshCw className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-slate-900">Easy Returns</p>
                <p className="text-xs text-slate-600">7-day return policy</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-slate-900">Warranty</p>
                <p className="text-xs text-slate-600">1-year warranty</p>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Specifications</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-200">
              {Object.entries(product.specifications).map(([key, value], index) => (
                <div key={key} className={`px-6 py-4 ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{key}</span>
                    <span className="text-slate-600">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
