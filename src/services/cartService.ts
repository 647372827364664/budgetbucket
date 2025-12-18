import { db } from '@/lib/firebase'
import { CartItem } from '@/types'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  getDoc,
} from 'firebase/firestore'

/**
 * Create a new order from cart items
 */
export async function createOrder(
  userId: string,
  cartItems: CartItem[],
  orderData: {
    addressId: string
    paymentMethod: 'razorpay' | 'upi' | 'card' | 'netbanking'
    discountCode?: string
    discountAmount?: number
    taxAmount: number
    shippingCost: number
    notes?: string
  }
) {
  try {
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty')
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = orderData.taxAmount
    const shipping = orderData.shippingCost
    const discount = orderData.discountAmount || 0
    const total = subtotal + tax + shipping - discount

    const ordersRef = collection(db, 'orders')
    const newOrder = await addDoc(ordersRef, {
      userId,
      items: cartItems,
      addressId: orderData.addressId,
      paymentMethod: orderData.paymentMethod,
      discountCode: orderData.discountCode || null,
      subtotal,
      taxAmount: tax,
      shippingCost: shipping,
      discountAmount: discount,
      total,
      status: 'pending', // pending, confirmed, processing, shipped, delivered, cancelled
      paymentStatus: 'pending', // pending, completed, failed, refunded
      notes: orderData.notes || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    // Send Discord webhook notification (non-blocking)
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL
      if (webhookUrl) {
        const itemsText = (cartItems || [])
          .map((it: any) => `• ${it.name || it.productId} x ${it.quantity} @ ₹${it.price}`)
          .join('\n')

        const embed = {
          title: `New order received: ${newOrder.id}`,
          color: 7506394,
          fields: [
            { name: 'User', value: `${userId}`, inline: true },
            { name: 'Subtotal', value: `₹${subtotal.toFixed(2)}`, inline: true },
            { name: 'Tax', value: `₹${tax.toFixed(2)}`, inline: true },
            { name: 'Shipping', value: `₹${shipping.toFixed(2)}`, inline: true },
            { name: 'Total', value: `₹${total.toFixed(2)}`, inline: true },
            { name: 'Items', value: itemsText },
          ],
          timestamp: new Date().toISOString(),
        }

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: [embed] }),
        })
      }
    } catch (webErr) {
      console.warn('Failed to send Discord webhook for order', webErr)
    }

    return {
      id: newOrder.id,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      status: 'pending',
    }
  } catch (error) {
    console.error('Error creating order:', error)
    throw error instanceof Error ? error : new Error('Failed to create order')
  }
}

/**
 * Get user orders
 */
export async function getUserOrders(userId: string) {
  try {
    const ordersRef = collection(db, 'orders')
    const q = query(ordersRef, where('userId', '==', userId))
    const snapshot = await getDocs(q)

    const orders: any[] = []
    snapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return orders.sort((a, b) => {
      const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : a.createdAt
      const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : b.createdAt
      return bTime - aTime
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error instanceof Error ? error : new Error('Failed to fetch orders')
  }
}

/**
 * Get single order
 */
export async function getOrderById(orderId: string) {
  try {
    const orderRef = doc(db, 'orders', orderId)
    const snapshot = await getDoc(orderRef)

    if (!snapshot.exists()) {
      throw new Error('Order not found')
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    }
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error instanceof Error ? error : new Error('Failed to fetch order')
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
) {
  try {
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      status,
      updatedAt: Timestamp.now(),
    })

    return { success: true, status }
  } catch (error) {
    console.error('Error updating order status:', error)
    throw error instanceof Error ? error : new Error('Failed to update order status')
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded',
  paymentId?: string
) {
  try {
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      paymentStatus,
      paymentId: paymentId || null,
      updatedAt: Timestamp.now(),
    })

    return { success: true, paymentStatus }
  } catch (error) {
    console.error('Error updating payment status:', error)
    throw error instanceof Error ? error : new Error('Failed to update payment status')
  }
}

/**
 * Validate discount code
 */
export async function validateDiscountCode(code: string) {
  try {
    const codesRef = collection(db, 'discount_codes')
    const q = query(
      codesRef,
      where('code', '==', code.toUpperCase()),
      where('isActive', '==', true)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      throw new Error('Invalid or expired discount code')
    }

    const codeData = snapshot.docs[0].data() as {
      code: string
      discountType: 'percentage' | 'fixed'
      discountValue: number
      minOrderAmount?: number
      maxDiscount?: number
      expiryDate?: Timestamp
    }

    // Check expiration
    if (codeData.expiryDate) {
      const expiryTime = codeData.expiryDate.toMillis?.() || new Date(codeData.expiryDate as any).getTime()
      if (expiryTime < Date.now()) {
        throw new Error('Discount code has expired')
      }
    }

    // Check usage limit
    const data = snapshot.docs[0].data() as any
    if (data.maxUses && data.uses >= data.maxUses) {
      throw new Error('Discount code usage limit reached')
    }

    return {
      code: codeData.code,
      discountType: codeData.discountType,
      discountValue: codeData.discountValue,
      minOrderAmount: codeData.minOrderAmount || 0,
      maxDiscount: codeData.maxDiscount || null,
    }
  } catch (error) {
    console.error('Error validating discount code:', error)
    throw error instanceof Error ? error : new Error('Invalid discount code')
  }
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  subtotal: number,
  discountCode: {
    discountType: 'percentage' | 'fixed'
    discountValue: number
    minOrderAmount: number
    maxDiscount?: number
  }
) {
  if (subtotal < discountCode.minOrderAmount) {
    return 0
  }

  let discountAmount = 0

  if (discountCode.discountType === 'percentage') {
    discountAmount = (subtotal * discountCode.discountValue) / 100
  } else {
    discountAmount = discountCode.discountValue
  }

  // Apply max discount limit if set
  if (discountCode.maxDiscount && discountAmount > discountCode.maxDiscount) {
    discountAmount = discountCode.maxDiscount
  }

  return Math.round(discountAmount)
}

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal: number, taxRate = 0.18) {
  return Math.round(subtotal * taxRate)
}

/**
 * Fetch tax rate from store settings (returns decimal, e.g. 0.18).
 * Falls back to 18% if settings not found.
 */
export async function getTaxRateFromSettings(): Promise<number> {
  try {
    const settingsRef = doc(db, 'settings', 'store_settings')
    const snap = await getDoc(settingsRef)
    if (snap.exists()) {
      const data: any = snap.data()
      const rate = data?.tax?.taxRate ?? data?.taxRate ?? 18
      const parsed = Number(rate)
      if (!isNaN(parsed) && parsed >= 0) return parsed / 100
    }
  } catch (error) {
    console.warn('Could not fetch tax rate from settings:', error)
  }
  return 0.18
}

/**
 * Calculate shipping cost
 */
export function calculateShipping(subtotal: number, shippingThreshold = 500) {
  // Free shipping above threshold
  if (subtotal >= shippingThreshold) {
    return 0
  }
  // Fixed shipping cost below threshold
  return 50
}

/**
 * Get order summary
 */
export function getOrderSummary(cartItems: CartItem[], discountAmount = 0) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = calculateTax(subtotal)
  const shipping = calculateShipping(subtotal)
  const total = subtotal + tax + shipping - discountAmount

  return {
    itemCount: cartItems.length,
    subtotal,
    tax,
    shipping,
    discountAmount,
    total,
  }
}

/**
 * Increment discount code usage
 */
export async function incrementDiscountUsage(code: string) {
  try {
    const codesRef = collection(db, 'discount_codes')
    const q = query(codesRef, where('code', '==', code.toUpperCase()))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      const codeDoc = snapshot.docs[0]
      const data = codeDoc.data() as any
      await updateDoc(codeDoc.ref, {
        uses: (data.uses || 0) + 1,
      })
    }
  } catch (error) {
    console.error('Error incrementing discount usage:', error)
  }
}
