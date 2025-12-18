import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const settingsRef = doc(db, 'users', userId, 'profile', 'settings')
    const settingsDoc = await getDoc(settingsRef)

    const settings = settingsDoc.exists()
      ? settingsDoc.data()
      : {
          notifications: {
            orderUpdates: true,
            promotions: true,
            newsletter: false,
            reviews: true,
          },
          privacy: {
            profileVisibility: 'private',
            allowRecommendations: true,
            shareActivity: false,
          },
        }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const data = await request.json()

    const settingsRef = doc(db, 'users', userId, 'profile', 'settings')
    await setDoc(
      settingsRef,
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}
