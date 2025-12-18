import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'

// GET - Fetch single user
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userRef = doc(db, 'users', id)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: userDoc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const userRef = doc(db, 'users', id)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }
    
    await updateDoc(userRef, {
      ...body,
      updatedAt: Timestamp.now()
    })
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userRef = doc(db, 'users', id)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }
    
    await deleteDoc(userRef)
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
