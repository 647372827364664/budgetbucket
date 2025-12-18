import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import {
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const user = (request as any).user
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const settingsRef = doc(db, 'admin', 'settings')
    const settingsDoc = await getDoc(settingsRef)

    const settings = settingsDoc.exists()
      ? settingsDoc.data()
      : {
          storeName: 'Budget Bucket',
          storeDescription: 'Premium E-commerce Platform',
          contactEmail: 'sale.raghavinfratech@gmail.com',
          contactPhone: '+91-9217023668',
          taxRate: 18,
          shippingCost: 50,
          minOrderValue: 0,
          maxOrderValue: 999999,
          maintenanceMode: false,
        }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check admin authorization
    const user = (request as any).user
    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const settings = await request.json()

    const settingsRef = doc(db, 'admin', 'settings')
    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}
