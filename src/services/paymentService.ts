import crypto from 'crypto'

/**
 * Payment Service - Handles Razorpay integration
 */

interface RazorpayOrderOptions {
  amount: number // In paise (multiply by 100)
  currency?: string
  receipt: string
  notes?: Record<string, string>
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(options: RazorpayOrderOptions) {
  try {
    const { amount, currency = 'INR', receipt, notes } = options

    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_SECRET_KEY}`
    ).toString('base64')

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.description || 'Failed to create Razorpay order')
    }

    const data = await response.json()
    return {
      success: true,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
    }
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    throw error
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const message = `${orderId}|${paymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY || '')
      .update(message)
      .digest('hex')

    return expectedSignature === signature
  } catch (error) {
    console.error('Error verifying payment signature:', error)
    return false
  }
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPaymentDetails(paymentId: string) {
  try {
    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_SECRET_KEY}`
    ).toString('base64')

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch payment details')
    }

    const data = await response.json()
    return {
      paymentId: data.id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      method: data.method,
      email: data.email,
      contact: data.contact,
      notes: data.notes,
      createdAt: new Date(data.created_at * 1000),
    }
  } catch (error) {
    console.error('Error fetching payment details:', error)
    throw error
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>
) {
  try {
    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_SECRET_KEY}`
    ).toString('base64')

    const body: any = {}
    if (amount) body.amount = amount // In paise
    if (notes) body.notes = notes

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.description || 'Failed to refund payment')
    }

    const data = await response.json()
    return {
      success: true,
      refundId: data.id,
      amount: data.amount,
      status: data.status,
      createdAt: new Date(data.created_at * 1000),
    }
  } catch (error) {
    console.error('Error refunding payment:', error)
    throw error
  }
}

/**
 * Get invoice for a payment
 */
export async function getPaymentInvoice(paymentId: string) {
  try {
    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_SECRET_KEY}`
    ).toString('base64')

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/invoice`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })

    if (!response.ok) {
      throw new Error('Invoice not available')
    }

    const data = await response.json()
    return {
      invoiceId: data.id,
      shortUrl: data.short_url,
      pdfUrl: data.pdf_url,
    }
  } catch (error) {
    console.error('Error fetching payment invoice:', error)
    throw error
  }
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  subtotal: number,
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  maxDiscount?: number
): number {
  let discountAmount = 0

  if (discountType === 'percentage') {
    discountAmount = (subtotal * discountValue) / 100
    if (maxDiscount && discountAmount > maxDiscount) {
      discountAmount = maxDiscount
    }
  } else {
    discountAmount = discountValue
  }

  return Math.min(discountAmount, subtotal) // Can't exceed subtotal
}

/**
 * Format amount for Razorpay (convert to paise)
 */
export function formatAmountForRazorpay(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Format amount from Razorpay (convert from paise)
 */
export function formatAmountFromRazorpay(amount: number): number {
  return Math.round(amount) / 100
}
