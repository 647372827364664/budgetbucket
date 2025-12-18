import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'

// GET - Fetch single order
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderRef = doc(db, 'orders', id)
    const orderDoc = await getDoc(orderRef)
    
    if (!orderDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      order: {
        id: orderDoc.id,
        ...orderDoc.data(),
        createdAt: orderDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const orderRef = doc(db, 'orders', id)
    const orderDoc = await getDoc(orderRef)
    
    if (!orderDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    await updateDoc(orderRef, {
      ...body,
      updatedAt: Timestamp.now()
    })
    
    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete order
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderRef = doc(db, 'orders', id)
    const orderDoc = await getDoc(orderRef)
    
    if (!orderDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    await deleteDoc(orderRef)
    
    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
