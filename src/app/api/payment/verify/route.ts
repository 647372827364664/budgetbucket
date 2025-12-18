import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, updateDoc, Timestamp } from 'firebase/firestore'
import crypto from 'crypto'

interface PaymentVerificationRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  orderId: string
}

/**
 * POST /api/payment/verify
 * Verify Razorpay payment and update order status
 */
export async function POST(request: NextRequest) {
  try {
    const body: PaymentVerificationRequest = await request.json()

    // Validate required fields
    if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification fields' },
        { status: 400 }
      )
    }

    // Verify Razorpay signature
    const message = `${body.razorpay_order_id}|${body.razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(message)
      .digest('hex')

    if (expectedSignature !== body.razorpay_signature) {
      console.error('Payment verification failed - invalid signature')
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 401 }
      )
    }

    // Update order with payment details
    const orderRef = doc(db, 'orders', body.orderId)
    await updateDoc(orderRef, {
      paymentStatus: 'completed',
      paymentId: body.razorpay_payment_id,
      razorpayOrderId: body.razorpay_order_id,
      orderStatus: 'confirmed',
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified successfully',
        orderId: body.orderId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to verify payment',
      },
      { status: 500 }
    )
  }
}
