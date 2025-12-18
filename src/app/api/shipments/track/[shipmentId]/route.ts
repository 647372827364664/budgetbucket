import { NextRequest, NextResponse } from 'next/server'
import { shiprocketService } from '@/services/shiprocketService'

/**
 * GET /api/shipments/track/[shipmentId]
 * Get real-time tracking information for a shipment
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const { shipmentId } = await params

    if (!shipmentId) {
      return NextResponse.json({ error: 'Shipment ID required' }, { status: 400 })
    }

    const trackingResult = await shiprocketService.getShipmentTracking(shipmentId)

    if (!trackingResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to fetch tracking',
          details: trackingResult.error,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        tracking: trackingResult.tracking,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[Tracking] Error fetching tracking:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch tracking',
      },
      { status: 500 }
    )
  }
}
