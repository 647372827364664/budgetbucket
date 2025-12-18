import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore'

// GET - Fetch all orders
export async function GET() {
  try {
    const ordersRef = collection(db, 'orders')
    const q = query(ordersRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }))
    
    return NextResponse.json({ 
      success: true, 
      orders 
    })
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId,
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      paymentMethod = 'cod',
      status = 'pending'
    } = body
    
    if (!userId || !customerName || !customerEmail || !items || !total) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const ordersRef = collection(db, 'orders')
    const orderNumber = `ORD-${Date.now()}`
    
    const newOrder = {
      orderNumber,
      userId,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      items,
      subtotal: Number(subtotal),
      tax: Number(tax || 0),
      shipping: Number(shipping || 0),
      total: Number(total),
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      status,
      trackingNumber: null,
      notes: '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    const docRef = await addDoc(ordersRef, newOrder)
    
    return NextResponse.json({
      success: true,
      order: {
        id: docRef.id,
        ...newOrder,
        createdAt: newOrder.createdAt.toDate().toISOString(),
        updatedAt: newOrder.updatedAt.toDate().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update order
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    const orderRef = doc(db, 'orders', id)
    await updateDoc(orderRef, {
      ...updates,
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
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    const orderRef = doc(db, 'orders', id)
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
