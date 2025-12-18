import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'
import { stockSyncService } from '@/services/stockSyncService'

interface OrderRequest {
  userId: string
  items: Array<{
    id: string
    productId: string
    name: string
    quantity: number
    price: number
    image: string
    category: string
  }>
  address: {
    id?: string
    name: string
    phone: string
    street: string
    city: string
    state: string
    postalCode: string
    country: string
    isDefault?: boolean
  }
  paymentMethod: 'razorpay' | 'cod'
  total: number
  subtotal: number
  tax: number
  shippingCost: number
  discountCode?: string
  discountAmount?: number
}

/**
 * POST /api/orders/create
 * Create a new order
 */
export async function POST(request: NextRequest) {
  try {
    const body: OrderRequest = await request.json()

    // Validate required fields
    if (!body.userId || !body.items || !body.address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }

    // Validate stock availability before creating order
    const stockValidation = await stockSyncService.validateStockAvailability(
      body.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    )

    if (!stockValidation.valid) {
      const unavailableDetails = stockValidation.unavailableItems
        .map((item) => `${item.productId}: requested ${item.requested}, available ${item.available}`)
        .join('; ')

      return NextResponse.json(
        {
          error: 'Insufficient stock for some items',
          unavailableItems: stockValidation.unavailableItems,
          details: unavailableDetails,
        },
        { status: 409 } // Conflict status for stock issues
      )
    }

    // Generate invoice ID (format: INV-YYYYMMDD-XXXXX)
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase()
    const invoiceId = `INV-${dateStr}-${randomStr}`

    // Create order document
    const orderData = {
      invoiceId,
      userId: body.userId,
      items: body.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        category: item.category,
      })),
      address: {
        ...body.address,
        id: body.address.id || crypto.randomUUID(),
      },
      paymentMethod: body.paymentMethod,
      orderStatus: 'pending',
      paymentStatus: body.paymentMethod === 'cod' ? 'pending' : 'pending',
      total: body.total,
      subtotal: body.subtotal,
      tax: body.tax,
      shippingCost: body.shippingCost,
      discountCode: body.discountCode || null,
      discountAmount: body.discountAmount || 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }

    // Add to Firestore
    const ordersRef = collection(db, 'orders')
    const docRef = await addDoc(ordersRef, orderData)

    // Decrement stock for each ordered item
    const stockDecrementResult = await stockSyncService.decrementOrderStock(
      body.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    )

    if (!stockDecrementResult.success) {
      console.warn(
        `[Order Create] Stock decrement partially failed for order ${docRef.id}:`,
        stockDecrementResult.failed
      )
    }

    // Check for low stock and trigger alerts if needed
    await stockSyncService.checkAndAlertLowStock(5)

    // Create Razorpay order if payment method is razorpay
    let razorpayOrderId = null
    if (body.paymentMethod === 'razorpay') {
      // Call Razorpay API to create order
      const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_SECRET_KEY}`).toString('base64')}`,
        },
        body: JSON.stringify({
          amount: Math.round(body.total * 100), // Convert to paise
          currency: 'INR',
          receipt: invoiceId,
          notes: {
            orderId: docRef.id,
            userId: body.userId,
          },
        }),
      })

      if (!razorpayResponse.ok) {
        throw new Error('Failed to create Razorpay order')
      }

      const razorpayData = await razorpayResponse.json()
      razorpayOrderId = razorpayData.id

      // Update order with Razorpay order ID
      await updateDoc(doc(db, 'orders', docRef.id), {
        razorpayOrderId,
      })
    }

    return NextResponse.json(
      {
        orderId: docRef.id,
        invoiceId,
        razorpayOrderId: razorpayOrderId,
        message: 'Order created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create order',
      },
      { status: 500 }
    )
  }
}
