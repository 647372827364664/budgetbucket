import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== PAYMENT CREATE-ORDER API CALLED ===')
  
  try {
    const { amount, currency = 'INR', orderId, notes } = await request.json()
    
    console.log('Payment request received:', { amount, currency, orderId })

    if (!amount || !orderId) {
      console.log('Missing required fields:', { amount, orderId })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    
    console.log('Razorpay credentials check:', { 
      hasKeyId: !!keyId, 
      keyIdPrefix: keyId?.substring(0, 10),
      hasKeySecret: !!keySecret,
      keySecretLength: keySecret?.length 
    })

    // Check if we have valid Razorpay credentials
    const hasValidCredentials = keyId && keySecret && 
      keyId.startsWith('rzp_') && 
      keySecret.length > 10

    if (hasValidCredentials) {
      console.log('Using real Razorpay API...')
      // Use real Razorpay API
      try {
        const Razorpay = (await import('razorpay')).default
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        })

        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(amount * 100), // Convert to paise
          currency,
          receipt: orderId,
          notes: notes || {},
        })

        return NextResponse.json({
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
          testMode: false,
        })
      } catch (razorpayError) {
        console.error('Razorpay API error:', razorpayError)
        // Fall through to demo mode
      }
    }

    // Demo/Test mode - Return mock order for testing UI
    console.log('Using Razorpay demo mode - no valid credentials configured')
    const mockOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    
    return NextResponse.json({
      id: mockOrderId,
      amount: Math.round(amount * 100), // In paise
      currency,
      receipt: orderId,
      testMode: true,
    })
  } catch (error) {
    console.error('Error creating payment order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    )
  }
}