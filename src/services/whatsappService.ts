/**
 * WhatsApp Business Notification Service
 * Sends order notifications to the business owner via WhatsApp API
 */

// Business owner's WhatsApp number
const BUSINESS_WHATSAPP = '919217023668'; // Without + sign for API

interface OrderNotificationData {
  orderId: string;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  subtotal?: number;
  shipping?: number;
  paymentMethod: string;
  shippingAddress: {
    name?: string;
    street?: string;
    address?: string;
    city: string;
    state: string;
    pincode: string;
  };
  createdAt?: Date;
}

/**
 * Format currency in INR
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate WhatsApp message for new order notification
 */
export function generateOrderNotificationMessage(order: OrderNotificationData): string {
  const itemsList = order.items
    .map((item, index) => `${index + 1}. ${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`)
    .join('\n');

  const addressLine = [
    order.shippingAddress.street || order.shippingAddress.address,
    order.shippingAddress.city,
    order.shippingAddress.state,
    order.shippingAddress.pincode,
  ]
    .filter(Boolean)
    .join(', ');

  const message = `🛒 *NEW ORDER RECEIVED!*

━━━━━━━━━━━━━━━━━━
📋 *Order Details*
━━━━━━━━━━━━━━━━━━
🆔 Order ID: ${order.orderNumber || order.orderId}
📅 Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}

👤 *Customer Info*
Name: ${order.customerName}
Phone: ${order.customerPhone}
${order.customerEmail ? `Email: ${order.customerEmail}` : ''}

📦 *Items Ordered*
${itemsList}

━━━━━━━━━━━━━━━━━━
💰 *Order Summary*
${order.subtotal ? `Subtotal: ${formatCurrency(order.subtotal)}` : ''}
${order.shipping ? `Shipping: ${formatCurrency(order.shipping)}` : 'Shipping: FREE'}
*Total: ${formatCurrency(order.total)}*
Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'razorpay' ? 'Online Payment (Razorpay)' : order.paymentMethod}

📍 *Shipping Address*
${order.shippingAddress.name || order.customerName}
${addressLine}

━━━━━━━━━━━━━━━━━━
⚡ Please process this order soon!`;

  return message;
}

/**
 * Generate WhatsApp API URL for sending notification
 * Opens WhatsApp with pre-filled message
 */
export function getWhatsAppNotificationUrl(order: OrderNotificationData): string {
  const message = generateOrderNotificationMessage(order);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodedMessage}`;
}

/**
 * Send WhatsApp notification via API
 * This calls our internal API which handles the WhatsApp Cloud API
 */
export async function sendOrderNotification(order: OrderNotificationData): Promise<{
  success: boolean;
  message: string;
  whatsappUrl?: string;
  method?: string;
}> {
  try {
    console.log('📱 Sending WhatsApp notification for order:', order.orderId);

    // Call our WhatsApp API endpoint
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ WhatsApp notification sent:', result.method);
      return {
        success: true,
        message: result.message,
        whatsappUrl: result.whatsappUrl,
        method: result.method,
      };
    } else {
      console.error('❌ WhatsApp API error:', result.error);
      // Fallback to URL method
      const whatsappUrl = getWhatsAppNotificationUrl(order);
      return {
        success: true,
        message: 'Generated WhatsApp URL as fallback',
        whatsappUrl,
        method: 'url_fallback',
      };
    }
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    // Fallback to URL method
    const whatsappUrl = getWhatsAppNotificationUrl(order);
    return {
      success: true,
      message: 'Generated WhatsApp URL as fallback',
      whatsappUrl,
      method: 'url_fallback',
    };
  }
}

/**
 * Send notification to admin when order status changes
 */
export function generateStatusUpdateMessage(
  orderId: string,
  customerName: string,
  oldStatus: string,
  newStatus: string
): string {
  return `📦 *ORDER STATUS UPDATE*

🆔 Order: ${orderId}
👤 Customer: ${customerName}
📊 Status: ${oldStatus} → ${newStatus}

Updated at: ${new Date().toLocaleString('en-IN')}`;
}

/**
 * Generate WhatsApp link for customer to contact support
 */
export function getCustomerSupportWhatsAppUrl(
  customerName: string,
  orderId?: string,
  message?: string
): string {
  const defaultMessage = orderId
    ? `Hi, I need help with my order #${orderId}. My name is ${customerName}.`
    : `Hi, I need assistance. My name is ${customerName}.`;
  
  const finalMessage = message || defaultMessage;
  return `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(finalMessage)}`;
}

export const WHATSAPP_BUSINESS_NUMBER = BUSINESS_WHATSAPP;
export const WHATSAPP_DISPLAY_NUMBER = '+91 92170 23668';
