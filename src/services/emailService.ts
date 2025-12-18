/**
 * Email Notification Service
 * Handles all email communications for Budget Bucket
 * Supports: Order confirmations, Payment updates, Shipment notifications
 *
 * Configuration: Update with your email service (SendGrid, Firebase Email, etc.)
 */

/**
 * Email template types
 */
export enum EmailTemplate {
  ORDER_CONFIRMATION = 'order_confirmation',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  SHIPMENT_CREATED = 'shipment_created',
  ORDER_DELIVERED = 'order_delivered',
  REFUND_INITIATED = 'refund_initiated'
}

/**
 * Email data interfaces
 */
interface OrderConfirmationData {
  userName: string
  userEmail: string
  orderId: string
  invoiceId: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  address: {
    street: string
    city: string
    state: string
    postalCode: string
  }
}

interface PaymentSuccessData {
  userName: string
  userEmail: string
  orderId: string
  invoiceId: string
  paymentId: string
  amount: number
  paymentMethod: string
}

interface PaymentFailedData {
  userName: string
  userEmail: string
  orderId: string
  amount: number
  reason: string
  retryUrl?: string
}

interface ShipmentCreatedData {
  userName: string
  userEmail: string
  orderId: string
  invoiceId: string
  trackingNumber: string
  carrier: string
  estimatedDelivery: string
}

interface OrderDeliveredData {
  userName: string
  userEmail: string
  orderId: string
  invoiceId: string
  trackingNumber: string
}

interface RefundInitiatedData {
  userName: string
  userEmail: string
  orderId: string
  refundAmount: number
  refundId: string
  reason: string
  estimatedDate: string
}

/**
 * Initialize email transporter
 * TODO: Configure with your email service
 * Options:
 * - SendGrid: Use fetch to SendGrid API
 * - Firebase Email: Use custom implementation
 * - SMTP: Configure SMTP host, port, auth
 */
async function sendEmailViaService(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId: string }> {
  try {
    // Option 1: SendGrid API (Recommended)
    if (process.env.SENDGRID_API_KEY) {
      return await sendViaSendGrid(to, subject, html)
    }

    // Option 2: Firebase Cloud Function or custom email API
    if (process.env.EMAIL_API_ENDPOINT) {
      return await sendViaCustomAPI(to, subject, html)
    }

    // Development: Log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email Service] Development mode - Email details:')
      console.log('To:', to)
      console.log('Subject:', subject)
      console.log('HTML length:', html.length)
      return { success: true, messageId: `dev-${Date.now()}` }
    }

    throw new Error('No email service configured')
  } catch (error) {
    console.error('[Email Service] Error sending email:', error)
    throw error
  }
}

/**
 * Send email via SendGrid API
 */
async function sendViaSendGrid(to: string, subject: string, html: string) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.EMAIL_FROM || 'noreply@budgetbucket.com' },
      subject,
      content: [{ type: 'text/html', value: html }]
    })
  })

  if (!response.ok) {
    throw new Error(`SendGrid API error: ${response.statusText}`)
  }

  return { success: true, messageId: `sg-${Date.now()}` }
}

/**
 * Send email via custom API endpoint
 */
async function sendViaCustomAPI(to: string, subject: string, html: string) {
  const response = await fetch(process.env.EMAIL_API_ENDPOINT!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html })
  })

  if (!response.ok) {
    throw new Error(`Email API error: ${response.statusText}`)
  }

  return { success: true, messageId: `api-${Date.now()}` }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(data: OrderConfirmationData) {
  try {
    const html = generateOrderConfirmationHTML(data)
    const result = await sendEmailViaService(
      data.userEmail,
      `Order Confirmed - ${data.invoiceId}`,
      html
    )
    console.log(`[Email Service] Order confirmation sent to ${data.userEmail}`)
    return result
  } catch (error) {
    console.error('[Email Service] Failed to send order confirmation:', error)
    throw error
  }
}

/**
 * Send payment success email
 */
export async function sendPaymentSuccess(data: PaymentSuccessData) {
  try {
    const html = generatePaymentSuccessHTML(data)
    const result = await sendEmailViaService(
      data.userEmail,
      `Payment Successful - ${data.invoiceId}`,
      html
    )
    console.log(`[Email Service] Payment success email sent to ${data.userEmail}`)
    return result
  } catch (error) {
    console.error('[Email Service] Failed to send payment success email:', error)
    throw error
  }
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailed(data: PaymentFailedData) {
  try {
    const html = generatePaymentFailedHTML(data)
    const result = await sendEmailViaService(
      data.userEmail,
      `Payment Failed - Action Required`,
      html
    )
    console.log(`[Email Service] Payment failed email sent to ${data.userEmail}`)
    return result
  } catch (error) {
    console.error('[Email Service] Failed to send payment failed email:', error)
    throw error
  }
}

/**
 * Send shipment created email
 */
export async function sendShipmentCreated(data: ShipmentCreatedData) {
  try {
    const html = generateShipmentCreatedHTML(data)
    const result = await sendEmailViaService(
      data.userEmail,
      `Your Order is On The Way - ${data.trackingNumber}`,
      html
    )
    console.log(`[Email Service] Shipment created email sent to ${data.userEmail}`)
    return result
  } catch (error) {
    console.error('[Email Service] Failed to send shipment created email:', error)
    throw error
  }
}

/**
 * Send order delivered email
 */
export async function sendOrderDelivered(data: OrderDeliveredData) {
  try {
    const html = generateOrderDeliveredHTML(data)
    const result = await sendEmailViaService(
      data.userEmail,
      `Order Delivered - ${data.invoiceId}`,
      html
    )
    console.log(`[Email Service] Order delivered email sent to ${data.userEmail}`)
    return result
  } catch (error) {
    console.error('[Email Service] Failed to send order delivered email:', error)
    throw error
  }
}

/**
 * Send refund initiated email
 */
export async function sendRefundInitiated(data: RefundInitiatedData) {
  try {
    const html = generateRefundInitiatedHTML(data)
    const result = await sendEmailViaService(
      data.userEmail,
      `Refund Initiated - ${data.refundId}`,
      html
    )
    console.log(`[Email Service] Refund initiated email sent to ${data.userEmail}`)
    return result
  } catch (error) {
    console.error('[Email Service] Failed to send refund initiated email:', error)
    throw error
  }
}

/**
 * HTML Template Generators
 */

function generateOrderConfirmationHTML(data: OrderConfirmationData): string {
  const itemsHTML = data.items
      .map((item: { name: string; quantity: number; price: number; }) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
      </tr>
    `)
    .join('')

  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
          <h2 style="color: #8b5cf6; margin-bottom: 20px;">Order Confirmed!</h2>
          
          <p>Hi ${data.userName},</p>
          
          <p>Thank you for your order! Your order has been confirmed and will be processed shortly.</p>
          
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Invoice ID:</strong> ${data.invoiceId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <h3 style="margin-top: 20px; margin-bottom: 10px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 8px; text-align: left;">Product</th>
                <th style="padding: 8px; text-align: center;">Quantity</th>
                <th style="padding: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold;">
            Total: ₹${data.total.toFixed(2)}
          </div>
          
          <h3 style="margin-top: 20px;">Delivery Address</h3>
          <p>
            ${data.address.street}<br>
            ${data.address.city}, ${data.address.state} ${data.address.postalCode}
          </p>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            You will receive another email soon with tracking information. If you have any questions, please contact our support team.
          </p>
        </div>
      </body>
    </html>
  `
}

function generatePaymentSuccessHTML(data: PaymentSuccessData): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
          <h2 style="color: #10b981; margin-bottom: 20px;">✓ Payment Successful!</h2>
          
          <p>Hi ${data.userName},</p>
          
          <p>Your payment has been successfully processed. Your order is now confirmed and will be shipped soon.</p>
          
          <div style="background: #d1fae5; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #10b981;">
            <p><strong>Payment ID:</strong> ${data.paymentId}</p>
            <p><strong>Amount:</strong> ₹${data.amount.toFixed(2)}</p>
            <p><strong>Method:</strong> ${data.paymentMethod}</p>
            <p><strong>Invoice ID:</strong> ${data.invoiceId}</p>
          </div>
          
          <p style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.orderId}" 
               style="background: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Order Details
            </a>
          </p>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            Thank you for shopping with Budget Bucket!
          </p>
        </div>
      </body>
    </html>
  `
}

function generatePaymentFailedHTML(data: PaymentFailedData): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
          <h2 style="color: #ef4444; margin-bottom: 20px;">⚠ Payment Failed</h2>
          
          <p>Hi ${data.userName},</p>
          
          <p>Unfortunately, your payment could not be processed.</p>
          
          <div style="background: #fee2e2; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ef4444;">
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Amount:</strong> ₹${data.amount.toFixed(2)}</p>
            <p><strong>Reason:</strong> ${data.reason}</p>
          </div>
          
          <p>Your order will be automatically cancelled in 24 hours if payment is not completed.</p>
          
          ${data.retryUrl ? `
            <p style="margin-top: 20px;">
              <a href="${data.retryUrl}" 
                 style="background: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Try Payment Again
              </a>
            </p>
          ` : ''}
          
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            If you need assistance, please contact our support team.
          </p>
        </div>
      </body>
    </html>
  `
}

function generateShipmentCreatedHTML(data: ShipmentCreatedData): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
          <h2 style="color: #8b5cf6; margin-bottom: 20px;">📦 Your Order is On The Way!</h2>
          
          <p>Hi ${data.userName},</p>
          
          <p>Great news! Your order has been shipped and is on the way to you.</p>
          
          <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Order ID:</strong> ${data.invoiceId}</p>
            <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
            <p><strong>Carrier:</strong> ${data.carrier}</p>
            <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
          </div>
          
          <p>You can track your shipment using the tracking number above.</p>
          
          <p style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.orderId}/track" 
               style="background: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Track Your Order
            </a>
          </p>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            Thank you for your purchase!
          </p>
        </div>
      </body>
    </html>
  `
}

function generateOrderDeliveredHTML(data: OrderDeliveredData): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
          <h2 style="color: #10b981; margin-bottom: 20px;">✓ Order Delivered!</h2>
          
          <p>Hi ${data.userName},</p>
          
          <p>Your order has been successfully delivered!</p>
          
          <div style="background: #d1fae5; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #10b981;">
            <p><strong>Order ID:</strong> ${data.invoiceId}</p>
            <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
            <p><strong>Delivered Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>We hope you're satisfied with your purchase! Please leave a review to help other customers.</p>
          
          <p style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${data.orderId}/review" 
               style="background: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Leave a Review
            </a>
          </p>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            Thank you for shopping with Budget Bucket!
          </p>
        </div>
      </body>
    </html>
  `
}

function generateRefundInitiatedHTML(data: RefundInitiatedData): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
          <h2 style="color: #3b82f6; margin-bottom: 20px;">💰 Refund Initiated</h2>
          
          <p>Hi ${data.userName},</p>
          
          <p>Your refund has been initiated and is being processed.</p>
          
          <div style="background: #dbeafe; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #3b82f6;">
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Refund Amount:</strong> ₹${data.refundAmount.toFixed(2)}</p>
            <p><strong>Refund ID:</strong> ${data.refundId}</p>
            <p><strong>Reason:</strong> ${data.reason}</p>
            <p><strong>Estimated Receipt:</strong> ${data.estimatedDate}</p>
          </div>
          
          <p>The refund amount will be credited back to your original payment method within 5-7 business days.</p>
          
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </body>
    </html>
  `
}

/**
 * Export all email templates and functions
 */
export const emailService = {
  sendOrderConfirmation,
  sendPaymentSuccess,
  sendPaymentFailed,
  sendShipmentCreated,
  sendOrderDelivered,
  sendRefundInitiated,
  EmailTemplate
}
