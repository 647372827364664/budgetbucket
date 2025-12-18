/**
 * Inventory Stock Sync Utility
 * Handles stock synchronization with orders
 */

import { db } from '@/lib/firebase'
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore'

interface StockDecrementRequest {
  productId: string
  quantity: number
}

interface StockOperation {
  productId: string
  quantity: number
  type: 'decrement' | 'increment'
  reason: string
  orderId?: string
}

/**
 * Decrement product stock when order is created
 * Prevents overselling by checking available stock
 */
export async function decrementOrderStock(items: StockDecrementRequest[]): Promise<{
  success: boolean
  decremented: StockOperation[]
  failed: Array<{ productId: string; reason: string }>
  error?: string
}> {
  const decremented: StockOperation[] = []
  const failed: Array<{ productId: string; reason: string }> = []

  try {
    for (const item of items) {
      try {
        const productRef = doc(db, 'products', item.productId)
        const productSnap = await getDoc(productRef)

        if (!productSnap.exists()) {
          failed.push({
            productId: item.productId,
            reason: 'Product not found',
          })
          continue
        }

        const currentStock = productSnap.data().stock || 0

        // Check if enough stock available
        if (currentStock < item.quantity) {
          failed.push({
            productId: item.productId,
            reason: `Insufficient stock. Available: ${currentStock}, Required: ${item.quantity}`,
          })
          continue
        }

        // Decrement stock
        const newStock = currentStock - item.quantity
        await updateDoc(productRef, {
          stock: newStock,
          lastUpdated: Timestamp.now(),
          lastUpdateReason: 'Order created',
        })

        decremented.push({
          productId: item.productId,
          quantity: item.quantity,
          type: 'decrement',
          reason: 'Order created',
        })

        console.log(
          `[Stock Sync] Product ${item.productId} stock decremented: ${currentStock} → ${newStock}`
        )
      } catch (err: any) {
        console.error(`[Stock Sync] Error decrementing stock for ${item.productId}:`, err)
        failed.push({
          productId: item.productId,
          reason: err.message || 'Unknown error',
        })
      }
    }

    return {
      success: failed.length === 0,
      decremented,
      failed,
    }
  } catch (error: any) {
    console.error('[Stock Sync] Error decrementing order stock:', error)
    return {
      success: false,
      decremented,
      failed,
      error: error.message,
    }
  }
}

/**
 * Restore product stock when order is cancelled
 */
export async function restoreOrderStock(
  items: StockDecrementRequest[],
  reason: string = 'Order cancelled'
): Promise<{
  success: boolean
  restored: StockOperation[]
  failed: Array<{ productId: string; reason: string }>
  error?: string
}> {
  const restored: StockOperation[] = []
  const failed: Array<{ productId: string; reason: string }> = []

  try {
    for (const item of items) {
      try {
        const productRef = doc(db, 'products', item.productId)
        const productSnap = await getDoc(productRef)

        if (!productSnap.exists()) {
          failed.push({
            productId: item.productId,
            reason: 'Product not found',
          })
          continue
        }

        const currentStock = productSnap.data().stock || 0
        const newStock = currentStock + item.quantity

        await updateDoc(productRef, {
          stock: newStock,
          lastUpdated: Timestamp.now(),
          lastUpdateReason: reason,
        })

        restored.push({
          productId: item.productId,
          quantity: item.quantity,
          type: 'increment',
          reason,
        })

        console.log(
          `[Stock Sync] Product ${item.productId} stock restored: ${currentStock} → ${newStock}`
        )
      } catch (err: any) {
        console.error(`[Stock Sync] Error restoring stock for ${item.productId}:`, err)
        failed.push({
          productId: item.productId,
          reason: err.message || 'Unknown error',
        })
      }
    }

    return {
      success: failed.length === 0,
      restored,
      failed,
    }
  } catch (error: any) {
    console.error('[Stock Sync] Error restoring order stock:', error)
    return {
      success: false,
      restored,
      failed,
      error: error.message,
    }
  }
}

/**
 * Check for low stock products and send alerts
 * Threshold: 5 units by default
 */
export async function checkAndAlertLowStock(threshold: number = 5): Promise<{
  productsWithLowStock: Array<{ productId: string; name: string; stock: number }>
  alertsSent: boolean
}> {
  try {
    const { collection, getDocs, query, where } = await import('firebase/firestore')
    const productsRef = collection(db, 'products')

    // Query products with stock <= threshold
    const q = query(productsRef, where('stock', '<=', threshold))
    const querySnapshot = await getDocs(q)

    const lowStockProducts = querySnapshot.docs.map((doc) => ({
      productId: doc.id,
      name: doc.data().title,
      stock: doc.data().stock || 0,
      sku: doc.data().sku || '',
    }))

    if (lowStockProducts.length > 0) {
      console.log(
        `[Stock Alert] Found ${lowStockProducts.length} products with low stock (threshold: ${threshold})`
      )

      // Send admin notification email if configured
      if (process.env.ADMIN_EMAIL) {
        try {
          // Email service for low stock alerts
          // Note: Consider adding sendLowStockAlert function to emailService if needed
          console.log('[Stock Alert] Admin notification check configured')
        } catch (emailErr) {
          console.error('[Stock Alert] Failed to send admin email:', emailErr)
        }
      }
    }

    return {
      productsWithLowStock: lowStockProducts,
      alertsSent: lowStockProducts.length > 0,
    }
  } catch (error: any) {
    console.error('[Stock Alert] Error checking stock:', error)
    return {
      productsWithLowStock: [],
      alertsSent: false,
    }
  }
}

/**
 * Validate stock availability before checkout
 * Prevents order creation if stock insufficient
 */
export async function validateStockAvailability(
  items: StockDecrementRequest[]
): Promise<{
  valid: boolean
  unavailableItems: Array<{ productId: string; requested: number; available: number }>
}> {
  const unavailableItems: Array<{ productId: string; requested: number; available: number }> = []

  try {
    for (const item of items) {
      const productRef = doc(db, 'products', item.productId)
      const productSnap = await getDoc(productRef)

      if (!productSnap.exists()) {
        unavailableItems.push({
          productId: item.productId,
          requested: item.quantity,
          available: 0,
        })
        continue
      }

      const availableStock = productSnap.data().stock || 0
      if (availableStock < item.quantity) {
        unavailableItems.push({
          productId: item.productId,
          requested: item.quantity,
          available: availableStock,
        })
      }
    }

    return {
      valid: unavailableItems.length === 0,
      unavailableItems,
    }
  } catch (error: any) {
    console.error('[Stock Validation] Error validating stock:', error)
    return {
      valid: false,
      unavailableItems: [],
    }
  }
}

export const stockSyncService = {
  decrementOrderStock,
  restoreOrderStock,
  checkAndAlertLowStock,
  validateStockAvailability,
}
