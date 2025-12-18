import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  Query,
  QueryConstraint,
  limit,
  startAfter,
  orderBy,
} from 'firebase/firestore'

interface SearchFilters {
  searchQuery?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStock?: boolean
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest'
  pageSize?: number
  lastDocId?: string
}

/**
 * GET /api/search
 * Advanced product search with multiple filters
 * Query params: ?q=laptop&category=electronics&minPrice=10000&maxPrice=50000&minRating=4&inStock=true&sortBy=price-asc&pageSize=20
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse filters
    const filters: SearchFilters = {
      searchQuery: searchParams.get('q')?.toLowerCase() || '',
      category: searchParams.get('category')?.toLowerCase() || '',
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      minRating: searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : undefined,
      inStock: searchParams.get('inStock') === 'true',
      sortBy: (searchParams.get('sortBy') as any) || 'newest',
      pageSize: Math.min(parseInt(searchParams.get('pageSize') || '20'), 100), // Max 100
      lastDocId: searchParams.get('lastDocId') || undefined,
    }

    // Build query constraints
    const constraints: QueryConstraint[] = []

    // Category filter
    if (filters.category) {
      constraints.push(where('category', '==', filters.category))
    }

    // Price filters
    if (filters.minPrice !== undefined) {
      constraints.push(where('price', '>=', filters.minPrice))
    }
    if (filters.maxPrice !== undefined) {
      constraints.push(where('price', '<=', filters.maxPrice))
    }

    // Stock filter
    if (filters.inStock) {
      constraints.push(where('stock', '>', 0))
    }

    // Rating filter
    if (filters.minRating !== undefined) {
      constraints.push(where('averageRating', '>=', filters.minRating))
    }

    // Add sorting
    const sortMap: Record<string, [string, 'desc' | 'asc']> = {
      'price-asc': ['price', 'asc'],
      'price-desc': ['price', 'desc'],
      'rating': ['averageRating', 'desc'],
      'newest': ['createdAt', 'desc'],
    }

    const sortKey = filters.sortBy || 'newest'
    const [sortField, sortDirection] = sortMap[sortKey] || ['createdAt', 'desc']
    constraints.push(orderBy(sortField, sortDirection))

    // Pagination
    if (filters.lastDocId && filters.lastDocId !== '') {
      constraints.push(startAfter(filters.lastDocId))
    }

    const pageSize = filters.pageSize || 12
    constraints.push(limit(pageSize + 1)) // +1 to check if there are more

    // Build Firestore query
    let firebaseQuery: Query

    if (constraints.length > 0) {
      firebaseQuery = query(collection(db, 'products'), ...constraints)
    } else {
      firebaseQuery = query(collection(db, 'products'))
    }

    // Execute query
    const querySnapshot = await getDocs(firebaseQuery)
    let products: any[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Check if there are more results
    let hasMore = false
    if (products.length > pageSize) {
      hasMore = true
      products = products.slice(0, pageSize)
    }

    // Text search on client side (search in title and description)
    if (filters.searchQuery) {
      products = products.filter((product) => {
        const title = (product.title || '').toLowerCase()
        const description = (product.description || '').toLowerCase()
        return title.includes(filters.searchQuery!) || description.includes(filters.searchQuery!)
      })
    }

    // Get aggregation stats for filters
    const allProductsSnap = await getDocs(collection(db, 'products'))
    const allProducts = allProductsSnap.docs.map((doc) => doc.data())

    const stats = {
      totalProducts: allProducts.length,
      priceRange: {
        min: Math.min(...allProducts.map((p) => p.price || 0)),
        max: Math.max(...allProducts.map((p) => p.price || 0)),
      },
      categories: [...new Set(allProducts.map((p) => p.category))].sort(),
      ratingOptions: [4, 3, 2, 1],
    }

    return NextResponse.json(
      {
        success: true,
        data: products,
        pagination: {
          pageSize: filters.pageSize,
          hasMore,
          lastId: products.length > 0 ? products[products.length - 1].id : null,
        },
        stats,
        filters,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Search] Error searching products:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to search products',
      },
      { status: 500 }
    )
  }
}
