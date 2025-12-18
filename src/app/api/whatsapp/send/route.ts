import { NextRequest, NextResponse } from 'next/server';

// WhatsApp Cloud API Configuration
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const BUSINESS_WHATSAPP_NUMBER = process.env.BUSINESS_WHATSAPP_NUMBER || '919217023668';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderNotification {
  orderId: string;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
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
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function generateOrderMessage(order: OrderNotification): string {
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

  return `🛒 *NEW ORDER RECEIVED!*

━━━━━━━━━━━━━━━━━━
📋 *Order Details*
━━━━━━━━━━━━━━━━━━
🆔 Order ID: ${order.orderNumber || order.orderId}
📅 Date: ${new Date().toLocaleString('en-IN')}

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
Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}

📍 *Shipping Address*
${order.shippingAddress.name || order.customerName}
${addressLine}

━━━━━━━━━━━━━━━━━━
⚡ Please process this order soon!`;
}

export async function POST(request: NextRequest) {
  try {
    const body: OrderNotification = await request.json();

    // Validate required fields
    if (!body.orderId || !body.customerName || !body.items || !body.total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const message = generateOrderMessage(body);

    // Check if WhatsApp API is configured
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      console.log('⚠️ WhatsApp API not configured. Using fallback URL method.');
      
      // Generate WhatsApp URL for manual sending
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodedMessage}`;
      
      return NextResponse.json({
        success: true,
        method: 'url',
        message: 'WhatsApp URL generated (API not configured)',
        whatsappUrl,
        note: 'Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env for automatic sending'
      });
    }

    // Send via WhatsApp Cloud API
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: BUSINESS_WHATSAPP_NUMBER,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', result);
      return NextResponse.json(
        { 
          success: false, 
          error: 'WhatsApp API error',
          details: result 
        },
        { status: response.status }
      );
    }

    console.log('✅ WhatsApp message sent successfully:', result);

    return NextResponse.json({
      success: true,
      method: 'api',
      message: 'WhatsApp notification sent successfully',
      messageId: result.messages?.[0]?.id,
    });

  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send WhatsApp notification' 
      },
      { status: 500 }
    );
  }
}

// Webhook verification for WhatsApp (GET request)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'budget_bucket_verify';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}
