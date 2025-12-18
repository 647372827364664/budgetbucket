import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

/**
 * GET /api/orders/:orderId
 * Fetch a single order by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const orderRef = doc(db, 'orders', orderId)
    const orderSnapshot = await getDoc(orderRef)

    if (!orderSnapshot.exists()) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const orderData = orderSnapshot.data()

    // Convert Firestore Timestamps to ISO strings safely
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

    const order = {
      id: orderSnapshot.id,
      ...orderData,
      createdAt: safeToISOString(orderData.createdAt),
      updatedAt: safeToISOString(orderData.updatedAt),
      deliveryDate: orderData.deliveryDate ? safeToISOString(orderData.deliveryDate) : null,
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
