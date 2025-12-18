'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  RefreshCw,
  Package,
  AlertTriangle,
  X,
  Upload,
  ImageIcon,
  Layers,
  Save,
  Star,
  Tag,
  Check,
  Loader2,
  IndianRupee,
  Archive,
  Flame
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp,
  deleteField
} from 'firebase/firestore'

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  discount?: number
  stock: number
  category: string
  images: string[]
  featured?: boolean
  trending?: boolean
  newArrival?: boolean
  hotDeal?: boolean
  rating?: number
  reviews?: number
  tags?: string[]
  sku?: string
  brand?: string
  weight?: string
  dimensions?: string
  createdAt: any
  updatedAt?: any
}

interface ProductStats {
  total: number
  inStock: number
  lowStock: number
  outOfStock: number
  featured: number
  totalValue: number
}

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Kitchen',
  'Beauty & Personal Care',
  'Sports & Outdoors',
  'Books & Stationery',
  'Toys & Games',
  'Automotive',
  'Health & Wellness',
  'Groceries & Gourmet',
  'Baby & Kids',
  'Pet Supplies',
  'Garden & Outdoor',
  'Office Products'
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'inventory' | 'media'>('basic')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '',
    category: '',
    sku: '',
    brand: '',
    weight: '',
    dimensions: '',
    featured: false,
    trending: false,
    newArrival: false,
    hotDeal: false,
    tags: ''
  })

  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    featured: 0,
    totalValue: 0
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [products])

  const calculateStats = () => {
    const total = products.length
    const inStock = products.filter(p => p.stock > 10).length
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length
    const outOfStock = products.filter(p => p.stock === 0).length
    const featured = products.filter(p => p.featured).length
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)
    
    setStats({ total, inStock, lowStock, outOfStock, featured, totalValue })
  }

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const productsRef = collection(db, 'products')
      const q = query(productsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const fetchedProducts: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt
      } as Product))
      
      setProducts(fetchedProducts)
      if (fetchedProducts.length > 0) {
        toast.success(`Loaded ${fetchedProducts.length} products`)
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      toast.error('Failed to load products')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length + imagePreviews.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    setImageFiles(prev => [...prev, ...validFiles])
    
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    const preview = imagePreviews[index]
    
    // If it's a new file (base64), remove from files array too
    if (preview.startsWith('data:')) {
      const fileIndex = imagePreviews.slice(0, index).filter(p => p.startsWith('data:')).length
      setImageFiles(prev => prev.filter((_, i) => i !== fileIndex))
    }
    
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      stock: '',
      category: '',
      sku: '',
      brand: '',
      weight: '',
      dimensions: '',
      featured: false,
      trending: false,
      newArrival: false,
      hotDeal: false,
      tags: ''
    })
    setImageFiles([])
    setImagePreviews([])
    setActiveTab('basic')
    setShowModal(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: String(product.name || ''),
      description: String(product.description || ''),
      price: String(product.price || ''),
      originalPrice: String(product.originalPrice || ''),
      stock: String(product.stock || ''),
      category: String(product.category || ''),
      sku: String(product.sku || ''),
      brand: String(product.brand || ''),
      weight: String(product.weight || ''),
      dimensions: String(product.dimensions || ''),
      featured: Boolean(product.featured),
      trending: Boolean(product.trending),
      newArrival: Boolean(product.newArrival),
      hotDeal: Boolean(product.hotDeal),
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : ''
    })
    setImagePreviews(product.images || [])
    setImageFiles([])
    setActiveTab('basic')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required')
      setActiveTab('basic')
      return
    }
    
    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price')
      setActiveTab('pricing')
      return
    }
    
    if (!formData.category) {
      toast.error('Please select a category')
      setActiveTab('basic')
      return
    }

    const stock = parseInt(formData.stock) || 0
    if (stock < 0) {
      toast.error('Stock cannot be negative')
      setActiveTab('inventory')
      return
    }

    setIsSaving(true)
    setUploadProgress(0)

    try {
      // Calculate discount percentage
      const originalPrice = parseFloat(formData.originalPrice) || 0
      const discount = originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0

      // Generate SKU if not provided
      const sku = formData.sku.trim() || `SKU-${Date.now().toString(36).toUpperCase()}`

      // Keep existing URLs (already uploaded)
      const existingUrls = imagePreviews.filter(url => url.startsWith('http'))
      
      // Upload new image files via API
      let allImages = [...existingUrls]
      if (imageFiles.length > 0) {
        toast.loading(`Uploading ${imageFiles.length} image(s)...`, { id: 'image-upload' })
        try {
          const uploadedUrls = await uploadImages(imageFiles)
          allImages = [...existingUrls, ...uploadedUrls]
          if (uploadedUrls.length > 0) {
            toast.success(`${uploadedUrls.length} image(s) uploaded!`, { id: 'image-upload' })
          } else {
            toast.error('No images uploaded. Try smaller images.', { id: 'image-upload' })
          }
        } catch (err) {
          console.error('Image upload error:', err)
          toast.error('Failed to upload images', { id: 'image-upload' })
        }
      }

      // Build product data - use deleteField() for empty optional fields when editing
      const productData: Record<string, any> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: price,
        stock: stock,
        category: formData.category,
        sku: sku,
        images: allImages,
        featured: formData.featured,
        trending: formData.trending,
        newArrival: formData.newArrival,
        hotDeal: formData.hotDeal,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        updatedAt: Timestamp.now(),
        // Handle optional fields - use actual value or deleteField() for updates, or omit for new
        originalPrice: originalPrice > 0 ? originalPrice : (editingProduct ? deleteField() : null),
        discount: discount > 0 ? discount : (editingProduct ? deleteField() : null),
        brand: String(formData.brand || '').trim() || (editingProduct ? deleteField() : null),
        weight: String(formData.weight || '').trim() || (editingProduct ? deleteField() : null),
        dimensions: String(formData.dimensions || '').trim() || (editingProduct ? deleteField() : null)
      }

      // For new products, remove null fields
      if (!editingProduct) {
        Object.keys(productData).forEach(key => {
          if (productData[key] === null) delete productData[key]
        })
      }

      let productId: string

      if (editingProduct) {
        // Update existing product immediately
        productId = editingProduct.id
        const productRef = doc(db, 'products', productId)
        await updateDoc(productRef, productData)
        
        setProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, ...productData, id: productId } as Product
            : p
        ))
        toast.success('Product updated!')
      } else {
        // Create new product immediately - build clean object for local state
        const newProductForFirestore = {
          ...productData,
          rating: 0,
          reviews: 0,
          sold: 0,
          createdAt: Timestamp.now()
        }
        
        const productsRef = collection(db, 'products')
        const docRef = await addDoc(productsRef, newProductForFirestore)
        productId = docRef.id
        
        // Create clean product for local state (without deleteField sentinels)
        const newProductForState: Product = {
          id: productId,
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: price,
          originalPrice: originalPrice > 0 ? originalPrice : undefined,
          discount: discount > 0 ? discount : undefined,
          stock: stock,
          category: formData.category,
          images: allImages,
          featured: formData.featured,
          trending: formData.trending,
          newArrival: formData.newArrival,
          hotDeal: formData.hotDeal,
          sku: sku,
          brand: String(formData.brand || '').trim() || undefined,
          weight: String(formData.weight || '').trim() || undefined,
          dimensions: String(formData.dimensions || '').trim() || undefined,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
          rating: 0,
          reviews: 0,
          createdAt: Timestamp.now()
        }
        
        setProducts(prev => [newProductForState, ...prev])
      }

      // Close modal and reset
      setShowModal(false)
      setImageFiles([])
      setImagePreviews([])
      setIsSaving(false)
      
      toast.success(editingProduct ? 'Product updated!' : 'Product added!')
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Failed to save product')
      setIsSaving(false)
    }
  }

  // Upload images via API route (handles hosting server-side)
  const uploadImages = async (files: File[]): Promise<string[]> => {
    console.log('Uploading', files.length, 'files via API')
    
    const uploadPromises = files.map(async (file) => {
      try {
        // Compress image first
        const compressedFile = await compressImage(file)
        
        // Upload via our API route
        const formData = new FormData()
        formData.append('file', compressedFile)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        const data = await response.json()
        
        if (data.url) {
          console.log('Uploaded:', file.name, '→', data.url.substring(0, 50) + '...')
          return data.url
        } else {
          console.error('Upload error:', data.error)
          return null
        }
      } catch (err) {
        console.error('Upload error for', file.name, err)
        return null
      }
    })
    
    const results = await Promise.all(uploadPromises)
    return results.filter((url): url is string => url !== null)
  }
  
  // Compress image before upload - aggressive compression for reliable uploads
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = document.createElement('img')
      
      img.onload = () => {
        // Max dimensions - keep small for fast upload
        const MAX_WIDTH = 400
        const MAX_HEIGHT = 400
        
        let { width, height } = img
        
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width
          width = MAX_WIDTH
        }
        if (height > MAX_HEIGHT) {
          width = (width * MAX_HEIGHT) / height
          height = MAX_HEIGHT
        }
        
        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              console.log('Compressed:', file.name, 
                (file.size / 1024).toFixed(0), 'KB →', 
                (compressedFile.size / 1024).toFixed(0), 'KB')
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          0.6 // 60% quality for smaller files
        )
      }
      
      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }

  const handleDelete = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId)
      
      // Images are hosted on ImgBB - no cleanup needed
      if (product?.images) {
        console.log('Product has', product.images.length, 'images (hosted on ImgBB)')
      }
      
      // Delete product document
      await deleteDoc(doc(db, 'products', productId))
      setProducts(prev => prev.filter(p => p.id !== productId))
      toast.success('Product deleted successfully!')
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  const toggleFeatured = async (product: Product) => {
    try {
      const productRef = doc(db, 'products', product.id)
      await updateDoc(productRef, { 
        featured: !product.featured,
        updatedAt: Timestamp.now()
      })
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, featured: !p.featured } : p
      ))
      toast.success(product.featured ? 'Removed from featured' : 'Added to featured')
    } catch (error) {
      toast.error('Failed to update product')
    }
  }

  const toggleHotDeal = async (product: Product) => {
    try {
      const productRef = doc(db, 'products', product.id)
      await updateDoc(productRef, { 
        hotDeal: !product.hotDeal,
        updatedAt: Timestamp.now()
      })
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, hotDeal: !p.hotDeal } : p
      ))
      toast.success(product.hotDeal ? 'Removed from hot deals' : 'Added to hot deals')
    } catch (error) {
      toast.error('Failed to update product')
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    
    let matchesStock = true
    if (stockFilter === 'inStock') matchesStock = product.stock > 10
    else if (stockFilter === 'lowStock') matchesStock = product.stock > 0 && product.stock <= 10
    else if (stockFilter === 'outOfStock') matchesStock = product.stock === 0
    
    return matchesSearch && matchesCategory && matchesStock
  })

  const formatCurrency = (amount: number | undefined | null) => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(safeAmount)
  }

  const getStockBadge = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-700' }
    if (stock <= 10) return { text: 'Low Stock', color: 'bg-amber-100 text-amber-700' }
    return { text: 'In Stock', color: 'bg-green-100 text-green-700' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your product inventory</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchProducts}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">In Stock</p>
                <p className="text-xl font-bold text-gray-900">{stats.inStock}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-xl font-bold text-gray-900">{stats.lowStock}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Archive className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-xl font-bold text-gray-900">{stats.outOfStock}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Featured</p>
                <p className="text-xl font-bold text-gray-900">{stats.featured}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Inventory Value</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white min-w-[180px]"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white min-w-[150px]"
            >
              <option value="all">All Stock</option>
              <option value="inStock">In Stock</option>
              <option value="lowStock">Low Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">
                {products.length === 0 
                  ? 'Get started by adding your first product'
                  : 'Try adjusting your search or filters'
                }
              </p>
              {products.length === 0 && (
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add First Product
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">SKU</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const stockBadge = getStockBadge(product.stock || 0)
                    return (
                      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                              {product.images?.[0] ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate max-w-[200px]">{product.name || 'Unnamed'}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {product.featured && (
                                  <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Featured</span>
                                )}
                                {product.trending && (
                                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">Trending</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-gray-600">{product.sku || 'N/A'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900">{product.category || 'Uncategorized'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-semibold text-gray-900">{formatCurrency(product.price)}</span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
                                <span className="text-xs text-green-600 font-medium">-{product.discount}%</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">{product.stock || 0}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockBadge.color}`}>
                            {stockBadge.text}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleFeatured(product)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                product.featured 
                                  ? 'bg-purple-100 text-purple-600' 
                                  : 'hover:bg-gray-100 text-gray-400'
                              }`}
                              title={product.featured ? 'Remove from featured' : 'Add to featured'}
                            >
                              <Star className="w-4 h-4" fill={product.featured ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={() => toggleHotDeal(product)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                product.hotDeal 
                                  ? 'bg-red-100 text-red-600' 
                                  : 'hover:bg-gray-100 text-gray-400'
                              }`}
                              title={product.hotDeal ? 'Remove from hot deals' : 'Add to hot deals'}
                            >
                              <Flame className="w-4 h-4" fill={product.hotDeal ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                              title="Edit product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(product.id)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500 text-center">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {editingProduct ? 'Update product information' : 'Fill in the product details'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex gap-1">
                {[
                  { id: 'basic', label: 'Basic Info', icon: Package },
                  { id: 'pricing', label: 'Pricing', icon: IndianRupee },
                  { id: 'inventory', label: 'Inventory', icon: Layers },
                  { id: 'media', label: 'Images', icon: ImageIcon }
                ].map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter product name"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter product description..."
                        rows={4}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                          required
                        >
                          <option value="">Select category</option>
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Brand
                        </label>
                        <input
                          type="text"
                          value={formData.brand}
                          onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                          placeholder="e.g., Samsung, Nike"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags <span className="text-gray-400 font-normal">(comma separated)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="e.g., wireless, bluetooth, premium"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Product Flags
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { key: 'featured', label: 'Featured', color: 'purple' },
                          { key: 'trending', label: 'Trending', color: 'orange' },
                          { key: 'newArrival', label: 'New Arrival', color: 'green' },
                          { key: 'hotDeal', label: 'Hot Deal', color: 'red' }
                        ].map(flag => (
                          <label
                            key={flag.key}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                              formData[flag.key as keyof typeof formData]
                                ? `border-${flag.color}-500 bg-${flag.color}-50`
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData[flag.key as keyof typeof formData] as boolean}
                              onChange={(e) => setFormData(prev => ({ ...prev, [flag.key]: e.target.checked }))}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              formData[flag.key as keyof typeof formData]
                                ? `bg-${flag.color}-600 border-${flag.color}-600`
                                : 'border-gray-300'
                            }`}>
                              {formData[flag.key as keyof typeof formData] && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{flag.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing Tab */}
                {activeTab === 'pricing' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selling Price <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Original Price <span className="text-gray-400 font-normal">(for discount)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            value={formData.originalPrice}
                            onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    {formData.originalPrice && parseFloat(formData.originalPrice) > parseFloat(formData.price || '0') && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-5 h-5 text-green-600" />
                          <span className="text-green-800 font-medium">
                            Discount: {Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.price || '0')) / parseFloat(formData.originalPrice)) * 100)}% off
                          </span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          Customers save {formatCurrency(parseFloat(formData.originalPrice) - parseFloat(formData.price || '0'))}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Inventory Tab */}
                {activeTab === 'inventory' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Stock Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.stock}
                          onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                          placeholder="0"
                          min="0"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SKU <span className="text-gray-400 font-normal">(auto-generated if empty)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.sku}
                          onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                          placeholder="e.g., PROD-001"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Weight
                        </label>
                        <input
                          type="text"
                          value={formData.weight}
                          onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                          placeholder="e.g., 500g, 1.5kg"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dimensions
                        </label>
                        <input
                          type="text"
                          value={formData.dimensions}
                          onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                          placeholder="e.g., 10 x 5 x 3 cm"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Stock Status Preview</h4>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const stock = parseInt(formData.stock) || 0
                          const badge = getStockBadge(stock)
                          return (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                              {badge.text}
                            </span>
                          )
                        })()}
                        <span className="text-blue-700">{formData.stock || 0} units available</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Media Tab */}
                {activeTab === 'media' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Images <span className="text-gray-400 font-normal">(max 5 images, 5MB each)</span>
                      </label>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group">
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            {index === 0 && (
                              <span className="absolute bottom-1 left-1 text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded">
                                Main
                              </span>
                            )}
                          </div>
                        ))}
                        
                        {imagePreviews.length < 5 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-400 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-purple-500 transition-colors"
                          >
                            <Upload className="w-6 h-6" />
                            <span className="text-xs font-medium">Upload</span>
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-3">
                        First image will be used as the main product image. Drag to reorder (coming soon).
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                
                <div className="flex items-center gap-3">
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-600 transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{uploadProgress}%</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingProduct ? 'Update Product' : 'Create Product'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Product?</h3>
            <p className="text-gray-500 text-center mb-6">
              This action cannot be undone. The product and all its images will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
