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
  Package,
  Check,
  BadgeCheck,
  Copy,
  Facebook,
  Twitter,
  MessageCircle
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { toast } from 'react-hot-toast'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ProductReviews } from '@/components/products/ProductReviews'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  category: string
  brand: string
  images: string[]
  rating: number
  reviewCount: number
  stock: number
  tags: string[]
  specifications: Record<string, string>
  features: string[]
  sku: string
}

interface RelatedProduct {
  id: string
  name: string
  slug: string
  price: number
  originalPrice?: number
  images: string[]
  rating: number
}

const generateSlug = (name: string, id: string): string => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${slug}-${id.slice(-6)}`
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slugParam = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description')
  const [showShareModal, setShowShareModal] = useState(false)

  const { addItem: addToCart } = useCartStore()
  const { toggleItem: toggleWishlist, isFavorite } = useWishlistStore()

  useEffect(() => {
    if (slugParam) {
      loadProduct()
    }
  }, [slugParam])

  const loadProduct = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const productId = slugParam.slice(-6)
      const productsRef = collection(db, 'products')
      const snapshot = await getDocs(productsRef)
      
      let foundProduct: Product | null = null
      const allProducts: Product[] = []
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data()
        const name = data.name || 'Unnamed Product'
        const slug = generateSlug(name, docSnap.id)
        
        const prod: Product = {
          id: docSnap.id,
          name: name,
          slug: slug,
          description: data.description || '',
          price: typeof data.price === 'number' ? data.price : 0,
          originalPrice: typeof data.originalPrice === 'number' ? data.originalPrice : undefined,
          category: data.category || 'Uncategorized',
          brand: data.brand || 'Generic',
          images: Array.isArray(data.images) ? data.images : [],
          rating: typeof data.rating === 'number' ? data.rating : 4.0,
          reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
          stock: typeof data.stock === 'number' ? data.stock : 0,
          tags: Array.isArray(data.tags) ? data.tags : [],
          specifications: typeof data.specifications === 'object' && data.specifications ? data.specifications : {},
          features: Array.isArray(data.features) ? data.features : [],
          sku: data.sku || `SKU-${docSnap.id.slice(0, 8).toUpperCase()}`
        }
        
        allProducts.push(prod)
        
        if (slug === slugParam || docSnap.id.endsWith(productId)) {
          foundProduct = prod
        }
      })

      if (foundProduct) {
        setProduct(foundProduct)
        
        const related = allProducts
          .filter(p => p.category === foundProduct!.category && p.id !== foundProduct!.id)
          .slice(0, 4)
          .map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            originalPrice: p.originalPrice,
            images: p.images,
            rating: p.rating
          }))
        setRelatedProducts(related)
      } else {
        setError('Product not found')
      }
    } catch (err) {
      console.error('Error loading product:', err)
      setError('Failed to load product')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0] || '',
      category: product.category,
      quantity: quantity,
      stock: product.stock
    })
    toast.success(`${quantity} item(s) added to cart!`)
  }

  const handleBuyNow = () => {
    if (!product) return
    handleAddToCart()
    router.push('/checkout')
  }

  const handleToggleWishlist = () => {
    if (!product) return
    
    toggleWishlist(product.id)
    
    if (isFavorite(product.id)) {
      toast.success('Removed from wishlist')
    } else {
      toast.success('Added to wishlist!')
    }
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = `Check out ${product?.name} on Budget Bucket!`
    
    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard!')
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
        break
    }
    setShowShareModal(false)
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

  const nextImage = () => {
    if (product && product.images.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % product.images.length)
    }
  }

  const prevImage = () => {
    if (product && product.images.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
    }
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading product...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
            <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Products
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-violet-600 transition-colors">Home</Link>
              <span className="text-gray-300">/</span>
              <Link href="/products" className="text-gray-500 hover:text-violet-600 transition-colors">Products</Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Product Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-10">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden group">
                  {product.images[selectedImageIndex] ? (
                    <Image
                      src={product.images[selectedImageIndex]}
                      alt={product.name}
                      fill
                      className={`object-contain transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
                      onClick={() => setIsZoomed(!isZoomed)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-24 h-24 text-gray-300" />
                    </div>
                  )}

                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                      </button>
                    </>
                  )}

                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {getDiscount(product.price, product.originalPrice) > 0 && (
                      <span className="px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg">
                        {getDiscount(product.price, product.originalPrice)}% OFF
                      </span>
                    )}
                    {product.stock <= 5 && product.stock > 0 && (
                      <span className="px-3 py-1.5 bg-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
                        Only {product.stock} left!
                      </span>
                    )}
                  </div>
                </div>

                {product.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {product.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                          selectedImageIndex === index
                            ? 'border-violet-600 ring-2 ring-violet-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full">{product.brand}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 text-sm">{product.category}</span>
                </div>

                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 rounded-full">
                    <Star className="w-4 h-4 text-green-600 fill-green-600" />
                    <span className="font-semibold text-green-700">{product.rating}</span>
                  </div>
                  <span className="text-gray-500">{product.reviewCount.toLocaleString()} Ratings</span>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="ml-auto p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-5 mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-bold text-gray-900">{formatPrice(product.price)}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <>
                        <span className="text-xl text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded">
                          Save {formatPrice(product.originalPrice - product.price)}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Inclusive of all taxes</p>
                </div>

                {product.features && product.features.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
                    <ul className="space-y-2">
                      {product.features.slice(0, 4).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-600">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <span className="font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="px-6 py-3 font-semibold text-gray-900 bg-gray-50 min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="p-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                  </span>
                </div>

                <div className="flex gap-4 mb-6">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="flex-1 py-4 px-6 bg-white border-2 border-violet-600 text-violet-600 rounded-2xl font-bold text-lg hover:bg-violet-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    Add to Cart
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={product.stock === 0}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-violet-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={handleToggleWishlist}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      isFavorite(product.id)
                        ? 'bg-red-50 border-red-500 text-red-500'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <Truck className="w-6 h-6 text-violet-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Free Delivery</p>
                      <p className="text-xs text-gray-500">On orders above ₹500</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <RefreshCw className="w-6 h-6 text-violet-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Easy Returns</p>
                      <p className="text-xs text-gray-500">7 days return policy</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <Shield className="w-6 h-6 text-violet-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Secure Payment</p>
                      <p className="text-xs text-gray-500">100% secure checkout</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                    <BadgeCheck className="w-6 h-6 text-violet-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Genuine Product</p>
                      <p className="text-xs text-gray-500">100% authentic items</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="flex border-b border-gray-100">
              {[
                { id: 'description', label: 'Description' },
                { id: 'specifications', label: 'Specifications' },
                { id: 'reviews', label: `Reviews (${product.reviewCount})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 py-5 px-6 text-center font-semibold transition-colors relative ${
                    activeTab === tab.id ? 'text-violet-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />}
                </button>
              ))}
            </div>

            <div className="p-6 lg:p-10">
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description || 'No description available for this product.'}
                  </p>
                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'specifications' && (
                <div>
                  {Object.keys(product.specifications).length > 0 ? (
                    <table className="w-full">
                      <tbody>
                        {Object.entries(product.specifications).map(([key, value], index) => (
                          <tr key={key} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="py-4 px-6 text-gray-600 font-medium w-1/3">{key}</td>
                            <td className="py-4 px-6 text-gray-900">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No specifications available for this product.</p>
                    </div>
                  )}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500"><strong>SKU:</strong> {product.sku}</p>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <ProductReviews productId={product.id} />
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map(relatedProduct => (
                  <Link
                    key={relatedProduct.id}
                    href={`/products/${relatedProduct.slug}`}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-violet-200 transition-all duration-300"
                  >
                    <div className="relative aspect-square bg-gray-50">
                      {relatedProduct.images[0] ? (
                        <Image
                          src={relatedProduct.images[0]}
                          alt={relatedProduct.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm text-gray-600">{relatedProduct.rating}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">{formatPrice(relatedProduct.price)}</span>
                        {relatedProduct.originalPrice && relatedProduct.originalPrice > relatedProduct.price && (
                          <span className="text-sm text-gray-400 line-through">{formatPrice(relatedProduct.originalPrice)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Share this product</h3>
              <div className="grid grid-cols-4 gap-4">
                <button onClick={() => handleShare('copy')} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Copy className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-xs text-gray-600">Copy Link</span>
                </button>
                <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-600">WhatsApp</span>
                </button>
                <button onClick={() => handleShare('facebook')} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-600">Facebook</span>
                </button>
                <button onClick={() => handleShare('twitter')} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                    <Twitter className="w-5 h-5 text-sky-600" />
                  </div>
                  <span className="text-xs text-gray-600">Twitter</span>
                </button>
              </div>
              <button onClick={() => setShowShareModal(false)} className="w-full mt-4 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
