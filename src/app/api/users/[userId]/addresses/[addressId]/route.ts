import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string; addressId: string }> }
) {
  try {
    const { userId, addressId } = await params

    const addressRef = doc(db, 'users', userId, 'addresses', addressId)
    const addressDoc = await getDoc(addressRef)

    if (!addressDoc.exists()) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: addressDoc.id,
      ...addressDoc.data(),
    })
  } catch (error: any) {
    console.error('Error fetching address:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch address' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; addressId: string }> }
) {
  try {
    const { userId, addressId } = await params
    const data = await request.json()

    const addressRef = doc(db, 'users', userId, 'addresses', addressId)
    await updateDoc(addressRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    })

    const updatedDoc = await getDoc(addressRef)
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    })
  } catch (error: any) {
    console.error('Error updating address:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update address' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string; addressId: string }> }
) {
  try {
    const { userId, addressId } = await params

    const addressRef = doc(db, 'users', userId, 'addresses', addressId)
    await deleteDoc(addressRef)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete address' },
      { status: 500 }
    )
  }
}
