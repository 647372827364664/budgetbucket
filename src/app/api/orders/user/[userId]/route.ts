import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

/**
 * GET /api/orders/user/:userId
 * Fetch all orders for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get URL search params for pagination
    const searchParams = request.nextUrl.searchParams
    const pageSize = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'

    const ordersRef = collection(db, 'orders')
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy(sortBy, 'desc'),
      limit(pageSize)
    )

    const snapshot = await getDocs(q)
    
    // Safe date conversion helper
    const safeToISOString = (timestamp: any) => {
      try {
        if (timestamp && typeof timestamp.toDate === 'function') {
          return timestamp.toDate().toISOString()
        }
        if (timestamp instanceof Date) {
          return timestamp.toISOString()
        }
        if (typeof timestamp === 'string') {
          return new Date(timestamp).toISOString()
        }
        return new Date().toISOString()
      } catch (error) {
        return new Date().toISOString()
      }
    }
    
    const orders = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: safeToISOString(data.createdAt),
        updatedAt: safeToISOString(data.updatedAt),
        deliveryDate: data.deliveryDate ? safeToISOString(data.deliveryDate) : null,
      }
    })

    return NextResponse.json({
      orders,
      count: orders.length,
    })
  } catch (error) {
    console.error('Error fetching user orders:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
