import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'

// GET - Fetch single product
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productRef = doc(db, 'products', id)
    const productDoc = await getDoc(productRef)
    
    if (!productDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      product: {
        id: productDoc.id,
        ...productDoc.data(),
        createdAt: productDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const productRef = doc(db, 'products', id)
    const productDoc = await getDoc(productRef)
    
    if (!productDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Convert numeric fields
    const updates = { ...body }
    if (updates.price) updates.price = Number(updates.price)
    if (updates.originalPrice) updates.originalPrice = Number(updates.originalPrice)
    if (updates.stock !== undefined) updates.stock = Number(updates.stock)
    if (updates.discount) updates.discount = Number(updates.discount)
    
    await updateDoc(productRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })
    
    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productRef = doc(db, 'products', id)
    const productDoc = await getDoc(productRef)
    
    if (!productDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }
    
    await deleteDoc(productRef)
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
