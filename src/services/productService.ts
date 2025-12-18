import { Product, Review } from '@/types'

// Lazy load Firebase to prevent server-side instantiation issues
let db: any = null
let collection: any = null
let query: any = null
let where: any = null
let getDocs: any = null
let getDoc: any = null
let doc: any = null
let addDoc: any = null
let orderBy: any = null
let limit: any = null

// Initialize Firebase imports only on client side
if (typeof window !== 'undefined') {
  try {
    const firebase = require('@/lib/firebase')
    db = firebase.db
    
    const firestore = require('firebase/firestore')
    collection = firestore.collection
    query = firestore.query
    where = firestore.where
    getDocs = firestore.getDocs
    getDoc = firestore.getDoc
    doc = firestore.doc
    addDoc = firestore.addDoc
    orderBy = firestore.orderBy
    limit = firestore.limit
  } catch (error) {
    console.warn('Firebase not available in this context:', error)
  }
}

/**
 * Get all products with optional filtering and pagination
 */
export async function getProducts(
  filters?: {
    category?: string
    minPrice?: number
    maxPrice?: number
    search?: string
    sortBy?: 'newest' | 'price-low' | 'price-high' | 'rating' | 'popular'
    limit?: number
  }
) {
  try {
    if (!db || !collection) {
      console.warn('Firebase not initialized')
      return []
    }

    const productsRef = collection(db, 'products')
    const constraints: any[] = []

    // Category filter
    if (filters?.category) {
      constraints.push(where('category', '==', filters.category))
    }

    // Price range filter (min)
    if (filters?.minPrice) {
      constraints.push(where('price', '>=', filters.minPrice))
    }

    // Price range filter (max)
    if (filters?.maxPrice) {
      constraints.push(where('price', '<=', filters.maxPrice))
    }

    // Sort
    switch (filters?.sortBy) {
      case 'newest':
        constraints.push(orderBy('createdAt', 'desc'))
        break
      case 'price-low':
        constraints.push(orderBy('price', 'asc'))
        break
      case 'price-high':
        constraints.push(orderBy('price', 'desc'))
        break
      case 'rating':
        constraints.push(orderBy('rating', 'desc'))
        break
      case 'popular':
        constraints.push(orderBy('sales', 'desc'))
        break
    }

    // Limit
    if (filters?.limit) {
      constraints.push(limit(filters.limit))
    }

    const q = query(productsRef, ...constraints)
    const snapshot = await getDocs(q)

    const products: Product[] = []
    snapshot.forEach((doc: any) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      } as Product)
    })

    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

/**
 * Get single product by ID
 */
export async function getProductById(productId: string) {
  try {
    if (!db || !doc || !getDoc) {
      console.warn('Firebase not initialized')
      return null
    }

    const productRef = doc(db, 'products', productId)
    const snapshot = await getDoc(productRef)

    if (!snapshot.exists()) {
      throw new Error('Product not found')
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Product
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

/**
 * Search products by title or description
 */
export async function searchProducts(searchQuery: string, searchLimit = 20) {
  try {
    if (!db || !collection) {
      console.warn('Firebase not initialized')
      return []
    }

    // Note: For production, use Algolia or similar for full-text search
    // This is a simple implementation
    const productsRef = collection(db, 'products')
    const q = query(productsRef, limit(searchLimit))
    const snapshot = await getDocs(q)

    const searchTerm = searchQuery.toLowerCase()
    const products: Product[] = []

    snapshot.forEach((doc: any) => {
      const product = doc.data() as Product
      if (
        product.title.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      ) {
        products.push({
          ...product,
          id: doc.id,
        })
      }
    })

    return products.slice(0, searchLimit)
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  category: string,
  options?: {
    limit?: number
    sortBy?: 'newest' | 'price-low' | 'price-high' | 'rating'
  }
) {
  try {
    return await getProducts({
      category,
      limit: options?.limit || 20,
      sortBy: options?.sortBy || 'newest',
    })
  } catch (error) {
    console.error('Error fetching products by category:', error)
    return []
  }
}

/**
 * Get trending products
 */
export async function getTrendingProducts(limit = 8) {
  try {
    return await getProducts({
      sortBy: 'popular',
      limit,
    })
  } catch (error) {
    console.error('Error fetching trending products:', error)
    return []
  }
}

/**
 * Get new arrivals
 */
export async function getNewArrivals(limit = 8) {
  try {
    return await getProducts({
      sortBy: 'newest',
      limit,
    })
  } catch (error) {
    console.error('Error fetching new arrivals:', error)
    return []
  }
}

/**
 * Get related products
 */
export async function getRelatedProducts(productId: string, limit = 4) {
  try {
    const product = await getProductById(productId)
    if (!product) return []

    const relatedProducts = await getProductsByCategory(product.category, {
      limit: limit + 1,
    })

    // Filter out the current product
    return relatedProducts.filter((p) => p.id !== productId).slice(0, limit)
  } catch (error) {
    console.error('Error fetching related products:', error)
    return []
  }
}

/**
 * Add product review
 */
export async function addProductReview(
  productId: string,
  userId: string,
  review: {
    rating: number
    title: string
    comment: string
  }
) {
  try {
    if (!db || !collection || !addDoc) {
      console.warn('Firebase not initialized')
      return null
    }

    const reviewsRef = collection(db, 'products', productId, 'reviews')
    const newReview = await addDoc(reviewsRef, {
      userId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      createdAt: new Date(),
      helpful: 0,
      verified: false,
    })

    return {
      id: newReview.id,
      ...review,
      userId,
      createdAt: new Date(),
    } as Review
  } catch (error) {
    console.error('Error adding review:', error)
    return null
  }
}

/**
 * Get product reviews
 */
export async function getProductReviews(productId: string) {
  try {
    if (!db || !collection || !getDocs) {
      console.warn('Firebase not initialized')
      return []
    }

    const reviewsRef = collection(db, 'products', productId, 'reviews')
    const q = query(reviewsRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    const reviews: Review[] = []
    snapshot.forEach((doc: any) => {
      const data = doc.data()
      reviews.push({
        ...data,
        id: doc.id,
      } as Review)
    })

    return reviews
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

/**
 * Get all categories
 */
export async function getCategories() {
  try {
    if (!db || !collection || !getDocs) {
      console.warn('Firebase not initialized')
      return []
    }

    const categoriesRef = collection(db, 'categories')
    const snapshot = await getDocs(categoriesRef)

    const categories: any[] = []
    snapshot.forEach((doc: any) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

/**
 * Create mock products for development
 */
export async function createMockProducts() {
  const mockProducts = [
    {
      title: 'Premium Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 4999,
      originalPrice: 7999,
      images: ['/images/product-1.jpg'],
      stock: 50,
      category: 'Electronics',
      tags: ['New', 'BestSeller'],
      rating: 4.5,
      specifications: [{ key: 'Battery', value: '30 hours' }],
    },
    {
      title: 'Ultra HD Smart TV',
      description: '55-inch 4K Ultra HD Smart TV with HDR support',
      price: 34999,
      originalPrice: 49999,
      images: ['/images/product-2.jpg'],
      stock: 15,
      category: 'Electronics',
      tags: ['Trending', 'Hot'],
      rating: 4.8,
      specifications: [{ key: 'Resolution', value: '4K Ultra HD' }],
    },
    {
      title: 'Professional Camera',
      description: 'DSLR camera with 24MP sensor and 4K video recording',
      price: 69999,
      originalPrice: 89999,
      images: ['/images/product-3.jpg'],
      stock: 8,
      category: 'Photography',
      tags: ['New', 'Hot'],
      rating: 4.7,
      specifications: [{ key: 'Sensor', value: '24MP CMOS' }],
    },
  ]

  try {
    if (!db || !collection || !addDoc) {
      console.warn('Firebase not initialized')
      return { success: false, message: 'Firebase not available' }
    }

    const productsRef = collection(db, 'products')

    for (const product of mockProducts) {
      await addDoc(productsRef, {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date(),
        sales: Math.floor(Math.random() * 1000),
      })
    }

    return { success: true, message: 'Mock products created' }
  } catch (error) {
    console.error('Error creating mock products:', error)
    return { success: false, message: 'Failed to create mock products' }
  }
}
