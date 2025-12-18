import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { stockSyncService } from '@/services/stockSyncService'

/**
 * POST /api/orders/[orderId]/cancel
 * Cancel an order and restore stock
 * Body: { reason?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body = await request.json().catch(() => ({}))
    const { reason } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Fetch order document
    const orderRef = doc(db, 'orders', orderId)
    const orderSnap = await getDoc(orderRef)

    if (!orderSnap.exists()) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const orderData = orderSnap.data()

    // Check if order can be cancelled
    if (['delivered', 'shipped', 'cancelled'].includes(orderData.orderStatus)) {
      return NextResponse.json(
        {
          error: `Cannot cancel order with status: ${orderData.orderStatus}`,
        },
        { status: 400 }
      )
    }

    // Restore stock for all items in the order
    const restoreReason = reason || 'Order cancelled'
    const stockRestoreResult = await stockSyncService.restoreOrderStock(
      orderData.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      restoreReason
    )

    if (!stockRestoreResult.success && stockRestoreResult.failed.length > 0) {
      console.warn(
        `[Order Cancel] Stock restore partially failed for order ${orderId}:`,
        stockRestoreResult.failed
      )
    }

    // Update order status to cancelled
    await updateDoc(orderRef, {
      orderStatus: 'cancelled',
      cancelledAt: Timestamp.now(),
      cancellationReason: restoreReason,
      updatedAt: Timestamp.now(),
    })

    console.log(
      `[Order Cancel] Order ${orderId} cancelled and stock restored. Reason: ${restoreReason}`
    )

    return NextResponse.json(
      {
        success: true,
        orderId,
        message: 'Order cancelled successfully',
        stockRestored: stockRestoreResult.restored.length,
        restorationFailures: stockRestoreResult.failed.length,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Order Cancel] Error cancelling order:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to cancel order',
      },
      { status: 500 }
    )
  }
}
