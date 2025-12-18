/**
 * Shiprocket Integration Service
 * Handles shipping operations, shipment creation, and real-time tracking
 * Documentation: https://apidoc.shiprocket.in/
 */

const SHIPROCKET_API_BASE = 'https://apiv2.shiprocket.in/v1'
const SHIPROCKET_TOKEN = process.env.SHIPROCKET_API_TOKEN

interface ShipmentItem {
  name: string
  sku: string
  units: number
  selling_price: number
}

interface ShippingAddress {
  name: string
  email: string
  phone: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface CreateShipmentRequest {
  orderId: string
  invoiceId: string
  items: ShipmentItem[]
  shippingAddress: ShippingAddress
  paymentMethod: string
  total: number
  weight?: number
  length?: number
  breadth?: number
  height?: number
}

interface ShipmentResponse {
  shipment_id: string
  order_id: string
  tracking_number: string
  carrier_name: string
  estimated_delivery: string
  label_url: string
}

export interface TrackingUpdate {
  status: string
  timestamp: string
  location: string
  message: string
}

/**
 * Authenticate with Shiprocket API
 * Token-based auth using API credentials
 */
async function getShiprocketHeaders(): Promise<HeadersInit> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SHIPROCKET_TOKEN}`,
  }
}

/**
 * Create a shipment in Shiprocket
 * Called after payment is verified for an order
 */
export async function createShipment(
  data: CreateShipmentRequest
): Promise<{
  success: boolean
  shipment?: ShipmentResponse
  error?: string
}> {
  try {
    if (!SHIPROCKET_TOKEN) {
      console.warn('[Shiprocket] Token not configured - skipping shipment creation')
      return {
        success: true,
        shipment: {
          shipment_id: 'demo-' + Date.now(),
          order_id: data.orderId,
          tracking_number: 'DEMO' + Math.random().toString(36).substring(2, 11).toUpperCase(),
          carrier_name: 'Demo Carrier',
          estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          label_url: '',
        },
      }
    }

    const payload = {
      order_id: data.orderId,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location_id: process.env.SHIPROCKET_WAREHOUSE_ID || 1,
      billing_address: {
        first_name: data.shippingAddress.name.split(' ')[0],
        last_name: data.shippingAddress.name.split(' ').slice(1).join(' ') || '',
        address_line_1: data.shippingAddress.street,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        postal_code: data.shippingAddress.postalCode,
        country: data.shippingAddress.country || 'India',
        email: data.shippingAddress.email,
        phone: data.shippingAddress.phone,
      },
      shipping_address: {
        first_name: data.shippingAddress.name.split(' ')[0],
        last_name: data.shippingAddress.name.split(' ').slice(1).join(' ') || '',
        address_line_1: data.shippingAddress.street,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        postal_code: data.shippingAddress.postalCode,
        country: data.shippingAddress.country || 'India',
        email: data.shippingAddress.email,
        phone: data.shippingAddress.phone,
      },
      order_items: data.items.map((item) => ({
        name: item.name,
        sku: item.sku,
        units: item.units,
        selling_price: item.selling_price,
      })),
      payment_method: data.paymentMethod === 'razorpay' ? 'Prepaid' : 'COD',
      total_weight: data.weight || 1,
      length: data.length || 10,
      breadth: data.breadth || 10,
      height: data.height || 10,
      sub_total: data.total,
      length_unit: 'cm',
      weight_unit: 'kg',
    }

    const response = await fetch(`${SHIPROCKET_API_BASE}/external/orders/create/adhoc`, {
      method: 'POST',
      headers: await getShiprocketHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create shipment')
    }

    const result = await response.json()

    if (!result.shipment_id) {
      throw new Error('No shipment ID in response')
    }

    console.log(`[Shiprocket] Shipment created: ${result.shipment_id} for order ${data.orderId}`)

    return {
      success: true,
      shipment: {
        shipment_id: result.shipment_id,
        order_id: data.orderId,
        tracking_number: result.tracking_number || `SR${result.shipment_id}`,
        carrier_name: result.courier_name || 'Shiprocket',
        estimated_delivery: result.estimated_delivery || '',
        label_url: result.label_url || '',
      },
    }
  } catch (error: any) {
    console.error('[Shiprocket] Error creating shipment:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get real-time tracking information for a shipment
 */
export async function getShipmentTracking(shipmentId: string): Promise<{
  success: boolean
  tracking?: {
    shipment_id: string
    order_id: string
    status: string
    tracking_number: string
    current_location: string
    estimated_delivery: string
    updates: TrackingUpdate[]
  }
  error?: string
}> {
  try {
    if (!SHIPROCKET_TOKEN) {
      console.warn('[Shiprocket] Token not configured - returning demo tracking')
      return {
        success: true,
        tracking: {
          shipment_id: shipmentId,
          order_id: 'demo-order',
          status: 'In Transit',
          tracking_number: `DEMO${shipmentId}`,
          current_location: 'Regional Hub - Delhi',
          estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          updates: [
            {
              status: 'Order Confirmed',
              timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
              location: 'Warehouse',
              message: 'Your order has been confirmed',
            },
            {
              status: 'Picked',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              location: 'Warehouse',
              message: 'Package has been picked from warehouse',
            },
            {
              status: 'In Transit',
              timestamp: new Date().toISOString(),
              location: 'Regional Hub - Delhi',
              message: 'Package is in transit to your city',
            },
          ],
        },
      }
    }

    const response = await fetch(
      `${SHIPROCKET_API_BASE}/external/shipments/track?shipment_id=${shipmentId}`,
      {
        headers: await getShiprocketHeaders(),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch tracking')
    }

    const result = await response.json()

    // Parse tracking history
    const updates: TrackingUpdate[] = result.track_data?.track_history?.map((event: any) => ({
      status: event.status,
      timestamp: event.date,
      location: event.location || 'In Transit',
      message: event.status,
    })) || []

    return {
      success: true,
      tracking: {
        shipment_id: result.shipment_id,
        order_id: result.order_id,
        status: result.track_data?.shipment_track_status || 'Unknown',
        tracking_number: result.tracking_number,
        current_location: result.track_data?.current_status_desc || 'In Transit',
        estimated_delivery: result.expected_delivery_date || '',
        updates,
      },
    }
  } catch (error: any) {
    console.error('[Shiprocket] Error fetching tracking:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get available courier options for an address
 * Used to show shipping options during checkout
 */
export async function getAvailableCouriers(request: {
  pickupPostalCode: string
  deliveryPostalCode: string
  weight: number
  price: number
}): Promise<{
  success: boolean
  couriers?: Array<{
    courier_id: number
    courier_name: string
    estimated_days: number
    rate: number
  }>
  error?: string
}> {
  try {
    if (!SHIPROCKET_TOKEN) {
      return {
        success: true,
        couriers: [
          {
            courier_id: 1,
            courier_name: 'Standard Delivery',
            estimated_days: 3,
            rate: 50,
          },
          {
            courier_id: 2,
            courier_name: 'Express Delivery',
            estimated_days: 1,
            rate: 100,
          },
        ],
      }
    }

    const payload = {
      pickup_postcode: request.pickupPostalCode,
      delivery_postcode: request.deliveryPostalCode,
      weight: request.weight,
      cod: 0,
    }

    const response = await fetch(`${SHIPROCKET_API_BASE}/external/courier/courierListWithRates`, {
      method: 'POST',
      headers: await getShiprocketHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch courier options')
    }

    const result = await response.json()

    const couriers = result.data?.available_courier_companies?.map((courier: any) => ({
      courier_id: courier.courier_company_id,
      courier_name: courier.courier_name,
      estimated_days: parseInt(courier.estimated_delivery_days) || 3,
      rate: parseFloat(courier.rates?.rate) || 0,
    })) || []

    return {
      success: true,
      couriers,
    }
  } catch (error: any) {
    console.error('[Shiprocket] Error fetching couriers:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Cancel a shipment in Shiprocket
 */
export async function cancelShipment(shipmentId: string): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    if (!SHIPROCKET_TOKEN) {
      return {
        success: true,
        message: 'Shipment cancelled (demo mode)',
      }
    }

    const response = await fetch(
      `${SHIPROCKET_API_BASE}/external/shipments/${shipmentId}/cancel`,
      {
        method: 'POST',
        headers: await getShiprocketHeaders(),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to cancel shipment')
    }

    console.log(`[Shiprocket] Shipment ${shipmentId} cancelled`)

    return {
      success: true,
      message: 'Shipment cancelled successfully',
    }
  } catch (error: any) {
    console.error('[Shiprocket] Error cancelling shipment:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export const shiprocketService = {
  createShipment,
  getShipmentTracking,
  getAvailableCouriers,
  cancelShipment,
}
