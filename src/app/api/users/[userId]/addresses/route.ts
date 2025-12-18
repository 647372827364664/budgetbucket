import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  addDoc,
} from 'firebase/firestore'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const addressesRef = collection(db, 'users', userId, 'addresses')
    const addressesSnapshot = await getDocs(addressesRef)

    const addresses = addressesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json(addresses)
  } catch (error: any) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const data = await request.json()

    const addressesRef = collection(db, 'users', userId, 'addresses')
    const docRef = await addDoc(addressesRef, {
      ...data,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      id: docRef.id,
      ...data,
    })
  } catch (error: any) {
    console.error('Error adding address:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add address' },
      { status: 500 }
    )
  }
}
