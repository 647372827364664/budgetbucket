import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, deleteDoc, increment } from 'firebase/firestore'

export async function PUT(request: NextRequest, { params }: { params: { id: string; reviewId: string } }) {
  try {
    const { id: productId, reviewId } = params
    const body = await request.json()
    const { action } = body

    const reviewRef = doc(db, 'products', productId, 'reviews', reviewId)
    const snapshot = await getDoc(reviewRef)
    if (!snapshot.exists()) return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })

    if (action === 'markHelpful') {
      await updateDoc(reviewRef, { helpful: increment(1) })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update review', error)
    return NextResponse.json({ success: false, error: 'Failed to update review' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; reviewId: string } }) {
  try {
    const { id: productId, reviewId } = params
    const body = await request.json()
    const { userId } = body

    const reviewRef = doc(db, 'products', productId, 'reviews', reviewId)
    const snapshot = await getDoc(reviewRef)
    if (!snapshot.exists()) return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 })

    const data: any = snapshot.data()
    if (data.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
    }

    await deleteDoc(reviewRef)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete review', error)
    return NextResponse.json({ success: false, error: 'Failed to delete review' }, { status: 500 })
  }
}
