import { NextRequest, NextResponse } from 'next/server'
import { shiprocketService } from '@/services/shiprocketService'

/**
 * GET /api/shipments/couriers
 * Get available courier options for an address
 * Query params: ?pickupZip=110001&deliveryZip=560001&weight=1&price=500
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pickupZip = searchParams.get('pickupZip')
    const deliveryZip = searchParams.get('deliveryZip')
    const weight = parseFloat(searchParams.get('weight') || '1')
    const price = parseFloat(searchParams.get('price') || '0')

    if (!pickupZip || !deliveryZip) {
      return NextResponse.json(
        { error: 'Pickup and delivery postal codes required' },
        { status: 400 }
      )
    }

    const couriersResult = await shiprocketService.getAvailableCouriers({
      pickupPostalCode: pickupZip,
      deliveryPostalCode: deliveryZip,
      weight,
      price,
    })

    if (!couriersResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to fetch couriers',
          details: couriersResult.error,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        couriers: couriersResult.couriers || [],
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Couriers] Error fetching couriers:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch couriers',
      },
      { status: 500 }
    )
  }
}
