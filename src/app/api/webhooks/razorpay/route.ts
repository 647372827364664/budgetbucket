import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { shiprocketService } from '@/services/shiprocketService'

interface WebhookEvent {
  event: string
  payload: {
    payment?: {
      entity: {
        id: string
        order_id: string
        status: string
        notes?: Record<string, any>
        error_code?: string
        error_description?: string
        error_source?: string
        error_reason?: string
      }
    }
    order?: {
      entity: {
        id: string
        status: string
      }
    }
  }
}

/**
 * POST /api/webhooks/razorpay
 * Handles Razorpay payment webhook events
 * Validates signature, updates order status, and triggers notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as WebhookEvent
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      console.error('[Razorpay Webhook] Missing signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature)
    if (!isValid) {
      console.error('[Razorpay Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    console.log(`[Razorpay Webhook] Received event: ${body.event}`)

    // Handle different webhook events
    switch (body.event) {
      case 'payment.authorized':
        await handlePaymentAuthorized(body)
        break

      case 'payment.failed':
        await handlePaymentFailed(body)
        break

      case 'payment.captured':
        await handlePaymentCaptured(body)
        break

      case 'refund.created':
        await handleRefundCreated(body)
        break

      case 'order.paid':
        await handleOrderPaid(body)
        break

      default:
        console.log(`[Razorpay Webhook] Ignoring event: ${body.event}`)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Razorpay Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Verify Razorpay webhook signature using HMAC-SHA256
 * @param body Request body
 * @param signature Signature from header
 * @returns Boolean indicating if signature is valid
 */
function verifyWebhookSignature(body: any, signature: string): boolean {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''
    if (!webhookSecret) {
      console.error('[Razorpay Webhook] Missing RAZORPAY_WEBHOOK_SECRET')
      return false
    }

    // Convert body to string
    const message = JSON.stringify(body)

    // Create HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(message)
      .digest('hex')

    // Compare signatures
    const isValid = expectedSignature === signature
    console.log(`[Razorpay Webhook] Signature verification: ${isValid ? 'valid' : 'invalid'}`)
    return isValid
  } catch (error) {
    console.error('[Razorpay Webhook] Signature verification error:', error)
    return false
  }
}

/**
 * Handle payment.authorized event
 * Called when payment is authorized but not yet captured
 */
async function handlePaymentAuthorized(body: WebhookEvent) {
  try {
    const payment = body.payload.payment?.entity
    if (!payment) {
      console.warn('[Razorpay Webhook] No payment entity in authorized event')
      return
    }

    console.log(`[Payment Authorized] Payment ID: ${payment.id}, Order ID: ${payment.order_id}`)

    // Find order by Razorpay order ID
    const orderId = payment.notes?.orderId as string
    if (!orderId) {
      console.warn(`[Payment Authorized] No orderId in notes for payment ${payment.id}`)
      return
    }

    // Update order with payment details
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      paymentId: payment.id,
      razorpayOrderId: payment.order_id,
      paymentStatus: 'authorized',
      updatedAt: serverTimestamp()
    })

    console.log(`[Payment Authorized] Order ${orderId} updated`)
  } catch (error) {
    console.error('[Payment Authorized] Error:', error)
    throw error
  }
}

/**
 * Handle payment.captured event
 * Called when payment is successfully captured
 */
async function handlePaymentCaptured(body: WebhookEvent) {
  try {
    const payment = body.payload.payment?.entity
    if (!payment) {
      console.warn('[Razorpay Webhook] No payment entity in captured event')
      return
    }

    console.log(`[Payment Captured] Payment ID: ${payment.id}, Order ID: ${payment.order_id}`)

    // Find order by payment notes
    const orderId = payment.notes?.orderId as string
    if (!orderId) {
      console.warn(`[Payment Captured] No orderId in notes for payment ${payment.id}`)
      return
    }

    // Update order status to confirmed
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      paymentId: payment.id,
      razorpayOrderId: payment.order_id,
      paymentStatus: 'verified',
      orderStatus: 'confirmed',
      updatedAt: serverTimestamp()
    })

    console.log(`[Payment Captured] Order ${orderId} confirmed`)

    // Auto-create shipment after payment verification
    try {
      const shipmentResult = await shiprocketService.createShipment({
        orderId,
        invoiceId: payment.notes?.invoiceId || `INV-${orderId}`,
        items: payment.notes?.items || [],
        shippingAddress: payment.notes?.shippingAddress || {},
        paymentMethod: 'razorpay',
        total: payment.notes?.total || 0,
      })

      if (shipmentResult.success && shipmentResult.shipment) {
        // Update order with shipment details
        await updateDoc(orderRef, {
          shipmentId: shipmentResult.shipment.shipment_id,
          trackingNumber: shipmentResult.shipment.tracking_number,
          carrierName: shipmentResult.shipment.carrier_name,
          estimatedDelivery: shipmentResult.shipment.estimated_delivery,
          orderStatus: 'shipped',
          shippedAt: serverTimestamp(),
        })

        console.log(
          `[Shipment Auto-Create] Shipment created for order ${orderId}: ${shipmentResult.shipment.shipment_id}`
        )
      } else {
        console.warn(
          `[Shipment Auto-Create] Failed to create shipment for order ${orderId}:`,
          shipmentResult.error
        )
      }
    } catch (shipmentError) {
      console.error(`[Shipment Auto-Create] Error creating shipment for order ${orderId}:`, shipmentError)
      // Don't fail the webhook if shipment creation fails
    }

    // TODO: Trigger email notification
    // TODO: Generate invoice
  } catch (error) {
    console.error('[Payment Captured] Error:', error)
    throw error
  }
}

/**
 * Handle payment.failed event
 * Called when payment fails
 */
async function handlePaymentFailed(body: WebhookEvent) {
  try {
    const payment = body.payload.payment?.entity
    if (!payment) {
      console.warn('[Razorpay Webhook] No payment entity in failed event')
      return
    }

    console.log(`[Payment Failed] Payment ID: ${payment.id}, Error: ${payment.error_description}`)

    // Find order by payment notes
    const orderId = payment.notes?.orderId as string
    if (!orderId) {
      console.warn(`[Payment Failed] No orderId in notes for payment ${payment.id}`)
      return
    }

    // Update order status to failed
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      paymentId: payment.id,
      paymentStatus: 'failed',
      orderStatus: 'cancelled',
      paymentError: {
        code: payment.error_code,
        description: payment.error_description,
        source: payment.error_source,
        reason: payment.error_reason
      },
      updatedAt: serverTimestamp()
    })

    console.log(`[Payment Failed] Order ${orderId} marked as failed`)

    // TODO: Send failure notification email
    // TODO: Auto-cancel order after delay
  } catch (error) {
    console.error('[Payment Failed] Error:', error)
    throw error
  }
}

/**
 * Handle refund.created event
 * Called when refund is initiated
 */
async function handleRefundCreated(body: WebhookEvent) {
  try {
    const refund = body.payload.payment?.entity
    if (!refund) {
      console.warn('[Razorpay Webhook] No refund entity')
      return
    }

    console.log(`[Refund Created] Refund ID: ${refund.id}`)

    // Note: Refund tracking would require additional database schema
    // This is a placeholder for future enhancement
    console.log('[Refund Created] Refund tracking to be implemented')
  } catch (error) {
    console.error('[Refund Created] Error:', error)
    throw error
  }
}

/**
 * Handle order.paid event
 * Called when entire order amount is paid
 */
async function handleOrderPaid(body: WebhookEvent) {
  try {
    const order = body.payload.order?.entity
    if (!order) {
      console.warn('[Razorpay Webhook] No order entity in paid event')
      return
    }

    console.log(`[Order Paid] Order ID: ${order.id}`)

    // Note: Find order by razorpayOrderId
    // This would require a reverse lookup from Razorpay order ID to our order ID
    console.log('[Order Paid] Event processed')
  } catch (error) {
    console.error('[Order Paid] Error:', error)
    throw error
  }
}
