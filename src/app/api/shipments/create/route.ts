import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { shiprocketService } from '@/services/shiprocketService'

/**
 * POST /api/shipments/create
 * Create a shipment for an order
 * Called after payment is verified
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Fetch order from Firestore
    const orderRef = doc(db, 'orders', orderId)
    const orderSnap = await getDoc(orderRef)

    if (!orderSnap.exists()) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderSnap.data()

    // Check if shipment already exists
    if (order.shipmentId) {
      return NextResponse.json(
        {
          error: 'Shipment already created for this order',
          shipmentId: order.shipmentId,
        },
        { status: 400 }
      )
    }

    // Check payment status
    if (order.paymentStatus !== 'verified') {
      return NextResponse.json(
        {
          error: 'Payment not verified for this order',
          paymentStatus: order.paymentStatus,
        },
        { status: 400 }
      )
    }

    // Prepare shipment data for Shiprocket
    const shipmentData = {
      orderId: orderId,
      invoiceId: order.invoiceId,
      items: order.items.map((item: any) => ({
        name: item.name,
        sku: item.productId,
        units: item.quantity,
        selling_price: item.price,
      })),
      shippingAddress: {
        name: order.address.name,
        email: order.address.email || 'noreply@budgetbucket.com',
        phone: order.address.phone,
        street: order.address.street,
        city: order.address.city,
        state: order.address.state,
        postalCode: order.address.postalCode,
        country: order.address.country || 'India',
      },
      paymentMethod: order.paymentMethod,
      total: order.total,
      weight: 1, // Default weight in kg
    }

    // Create shipment in Shiprocket
    const shiprocketResult = await shiprocketService.createShipment(shipmentData)

    if (!shiprocketResult.success) {
      console.error(`[Shipment] Failed to create shipment in Shiprocket:`, shiprocketResult.error)
      return NextResponse.json(
        {
          error: 'Failed to create shipment',
          details: shiprocketResult.error,
        },
        { status: 500 }
      )
    }

    const shipment = shiprocketResult.shipment!

    // Update order in Firestore with shipment details
    await updateDoc(orderRef, {
      shipmentId: shipment.shipment_id,
      trackingNumber: shipment.tracking_number,
      carrierName: shipment.carrier_name,
      estimatedDelivery: shipment.estimated_delivery,
      labelUrl: shipment.label_url,
      orderStatus: 'shipped',
      shippedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    console.log(
      `[Shipment] Shipment created successfully for order ${orderId}: ${shipment.shipment_id}`
    )

    return NextResponse.json(
      {
        success: true,
        shipment: {
          shipmentId: shipment.shipment_id,
          trackingNumber: shipment.tracking_number,
          carrierName: shipment.carrier_name,
          estimatedDelivery: shipment.estimated_delivery,
          labelUrl: shipment.label_url,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[Shipment] Error creating shipment:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create shipment',
      },
      { status: 500 }
    )
  }
}
