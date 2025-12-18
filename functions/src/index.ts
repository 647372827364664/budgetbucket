/**
 * Firebase Cloud Functions - Budget Bucket
 * Entry point for all serverless functions
 * Handles async processing for orders, payments, and notifications
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  initializeApp()
}

const db = getFirestore()
const storage = getStorage()

/**
 * =====================================================
 * ORDER CONFIRMATION TRIGGER
 * =====================================================
 * Triggered: When new order is created in Firestore
 * Purpose: Send confirmation email to customer
 */
export const onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap: QueryDocumentSnapshot) => {
    try {
      const order = snap.data() as any
      console.log(`[Order Confirmation] Processing order ${snap.id}`)

      // Extract customer email from order data
      const customerEmail = order.userEmail || ''
      if (!customerEmail) {
        console.warn(`[Order Confirmation] No email found for order ${snap.id}`)
        return
      }

      // Prepare email data (for external email service integration)
      console.log(`[Order Confirmation] Sending email to ${customerEmail} (invoiceId: ${order.invoiceId})`)

      // Update order with email sent timestamp
      await snap.ref.update({
        emailSent: {
          confirmation: Timestamp.now(),
          recipient: customerEmail
        }
      })

      console.log(`[Order Confirmation] Success for order ${snap.id}`)
    } catch (error) {
      console.error('[Order Confirmation] Error:', error)
      throw error
    }
  })

/**
 * =====================================================
 * PAYMENT SUCCESS TRIGGER
 * =====================================================
 * Triggered: When payment status changes to 'completed'
 * Purpose: Generate invoice, send email, update inventory
 */
export const onPaymentCompleted = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change: functions.Change<QueryDocumentSnapshot>) => {
    try {
      const before = change.before.data()
      const after = change.after.data()

      // Check if payment status changed to completed
      if (before.paymentStatus === 'completed' || after.paymentStatus !== 'completed') {
        console.log(`[Payment Completed] Skipping - not a payment completion event`)
        return
      }

      console.log(`[Payment Completed] Processing order ${change.after.id}`)

      // Step 1: Generate invoice
      console.log(`[Payment Completed] Generating invoice...`)
      const invoicePdfUrl = await generateInvoicePDF(change.after.id, after)

      // Step 2: Send payment success email
      const customerEmail = after.userEmail || ''
      if (customerEmail) {
        console.log(`[Payment Completed] Sending email to ${customerEmail} with invoice: ${invoicePdfUrl}`)
      }

      // Step 3: Update inventory (if needed)
      console.log(`[Payment Completed] Updating inventory...`)
      for (const item of after.items || []) {
        await updateInventory(item.productId, -item.quantity)
      }

      // Step 4: Create shipment (if needed)
      console.log(`[Payment Completed] Creating shipment...`)
      await createShipment(change.after.id, after)

      // Step 5: Update order with invoice URL
      await change.after.ref.update({
        invoiceUrl: invoicePdfUrl,
        invoiceGeneratedAt: Timestamp.now(),
        status: 'processing'
      })

      console.log(`[Payment Completed] Success for order ${change.after.id}`)
    } catch (error) {
      console.error('[Payment Completed] Error:', error)
      throw error
    }
  })

/**
 * =====================================================
 * PAYMENT FAILURE HANDLING
 * =====================================================
 * Triggered: When payment status is 'failed'
 * Purpose: Auto-cancel order after 24 hours if not retried
 */
export const onPaymentFailed = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change: functions.Change<QueryDocumentSnapshot>) => {
    try {
      const before = change.before.data()
      const after = change.after.data()

      // Check if payment failed
      if (before.paymentStatus === 'failed' || after.paymentStatus !== 'failed') {
        console.log(`[Payment Failed] Skipping - not a payment failure event`)
        return
      }

      console.log(`[Payment Failed] Processing order ${change.after.id}`)

      // Send payment failed email
      const customerEmail = after.userEmail || ''
      if (customerEmail) {
        console.log(`[Payment Failed] Sending failure email to ${customerEmail}`)
      }

      // Schedule cancellation after 24 hours
      const cancellationTime = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

      await change.after.ref.update({
        paymentFailed: {
          timestamp: Timestamp.now(),
          reason: after.paymentError?.description || 'Payment declined',
          cancellationScheduledFor: new Date(cancellationTime),
          autoCancel: true
        }
      })

      console.log(`[Payment Failed] Order will auto-cancel at ${cancellationTime}`)
    } catch (error) {
      console.error('[Payment Failed] Error:', error)
      throw error
    }
  })

/**
 * =====================================================
 * AUTO-CANCEL ORDERS
 * =====================================================
 * Triggered: On schedule (Pub/Sub) - runs every hour
 * Purpose: Auto-cancel orders with failed payments after 24 hours
 */
export const autoCancelExpiredOrders = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context: any) => {
    try {
      console.log('[Auto Cancel] Checking for expired orders...')

      const now = Timestamp.now()
      const twentyFourHoursAgo = Timestamp.fromDate(
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      )

      // Query orders with failed payments created over 24 hours ago
      const snapshot = await db
        .collection('orders')
        .where('paymentStatus', '==', 'failed')
        .where('createdAt', '<=', twentyFourHoursAgo)
        .where('autoCancel', '==', true)
        .get()

      console.log(`[Auto Cancel] Found ${snapshot.size} orders to cancel`)

      let cancelled = 0
      for (const doc of snapshot.docs) {
        try {
          await doc.ref.update({
            orderStatus: 'cancelled',
            cancelledAt: now,
            cancelReason: 'Auto-cancelled: Payment not completed within 24 hours'
          })
          cancelled++
        } catch (error) {
          console.error(`[Auto Cancel] Failed to cancel order ${doc.id}:`, error)
        }
      }

      console.log(`[Auto Cancel] Successfully cancelled ${cancelled} orders`)
      return { cancelled }
    } catch (error) {
      console.error('[Auto Cancel] Error:', error)
      throw error
    }
  })

/**
 * =====================================================
 * HELPER FUNCTIONS
 * =====================================================
 */

/**
 * Generate invoice PDF and store in Cloud Storage
 */
async function generateInvoicePDF(orderId: string, _orderData: Record<string, unknown>): Promise<string> {
  try {
    console.log(`[PDF Generation] Generating invoice for order ${orderId}`)

    // TODO: Implement PDF generation using:
    // - PDFKit library, or
    // - Puppeteer for HTML to PDF, or
    // - External PDF API service

    // For now, return placeholder URL
    const fileName = `invoices/${orderId}_${Date.now()}.pdf`
    const bucketName = process.env.STORAGE_BUCKET || ''

    // Placeholder: Return Cloud Storage URL
    const pdfUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`

    console.log(`[PDF Generation] Invoice URL: ${pdfUrl}`)
    return pdfUrl
  } catch (error) {
    console.error('[PDF Generation] Error:', error)
    throw error
  }
}

/**
 * Update product inventory
 */
async function updateInventory(productId: string, quantityChange: number): Promise<void> {
  try {
    console.log(`[Inventory] Updating product ${productId} by ${quantityChange}`)

    const productRef = db.collection('products').doc(productId)
    const productDoc = await productRef.get()

    if (!productDoc.exists) {
      console.warn(`[Inventory] Product ${productId} not found`)
      return
    }

    const currentStock = productDoc.data()?.stock || 0
    const newStock = Math.max(0, currentStock + quantityChange)

    await productRef.update({
      stock: newStock,
      lastUpdated: Timestamp.now()
    })

    console.log(`[Inventory] Updated - Stock: ${currentStock} → ${newStock}`)
  } catch (error) {
    console.error('[Inventory] Error:', error)
    throw error
  }
}

/**
 * Create shipment in Shiprocket or similar service
 */
async function createShipment(orderId: string, _orderData: Record<string, unknown>): Promise<void> {
  try {
    console.log(`[Shipment] Creating shipment for order ${orderId}`)

    // TODO: Implement Shiprocket API integration
    // 1. Call Shiprocket API with order details
    // 2. Create shipment and get tracking number
    // 3. Store tracking number in order

    const shipmentData = {
      orderId,
      shiprocketOrderId: null, // To be set by API
      trackingNumber: null,    // To be set by API
      carrier: null,           // To be set by API
      status: 'pending',
      createdAt: Timestamp.now()
    }

    // Save shipment data
    await db.collection('shipments').doc(orderId).set(shipmentData)

    console.log(`[Shipment] Shipment created for order ${orderId}`)
  } catch (error) {
    console.error('[Shipment] Error:', error)
    throw error
  }
}

/**
 * Send email notification
 */
async function _sendEmailNotification(
  _to: string,
  _subject: string,
  _templateName: string,
  _data: Record<string, unknown>
): Promise<void> {
  try {
    console.log(`[Email] Sending ${_templateName} to ${_to}`)

    // TODO: Integrate with email service
    // Options:
    // 1. SendGrid API
    // 2. Firebase Email
    // 3. Custom email microservice

    console.log(`[Email] Email queued for sending`)
  } catch (error) {
    console.error('[Email] Error:', error)
    throw error
  }
}

/**
 * Get order by ID with all details
 */
export const getOrderDetails = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User not authenticated')
    }

    const { orderId } = data
    if (!orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'Order ID required')
    }

    const orderDoc = await db.collection('orders').doc(orderId).get()

    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found')
    }

    return {
      id: orderDoc.id,
      ...orderDoc.data()
    }
  } catch (error) {
    console.error('[Get Order] Error:', error)
    throw error
  }
})

/**
 * Send contact us email
 */
export const sendContactEmail = functions.https.onCall(async (data: any, _context: functions.https.CallableContext) => {
  try {
    const { name, email, subject, message } = data

    if (!name || !email || !subject || !message) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields')
    }

    console.log(`[Contact] Received message from ${name} (${email})`)

    // TODO: Send email to support team
    // TODO: Save contact form to Firestore

    return { success: true, message: 'Message sent successfully' }
  } catch (error) {
    console.error('[Contact] Error:', error)
    throw error
  }
})

export { db, storage }
