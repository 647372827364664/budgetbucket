import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore'

// GET - Fetch all inventory
export async function GET() {
  try {
    // Fetch products to get inventory data
    const productsRef = collection(db, 'products')
    const q = query(productsRef, orderBy('name'))
    const snapshot = await getDocs(q)
    
    const inventory = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        productName: data.name,
        category: data.category,
        currentStock: data.stock || 0,
        minStock: data.minStock || 5,
        price: data.price,
        image: data.images?.[0] || '/placeholder-product.jpg',
        lastRestocked: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      inventory 
    })
  } catch (error: unknown) {
    console.error('Error fetching inventory:', error)
    // Return empty inventory instead of error
    return NextResponse.json({ 
      success: true, 
      inventory: [],
      message: 'Could not fetch from Firebase'
    })
  }
}

// PUT - Update inventory (stock adjustment)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, adjustment, type } = body
    
    if (!id || adjustment === undefined || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const productRef = doc(db, 'products', id)
    const productDoc = await getDoc(productRef)
    
    if (!productDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }
    
    const currentStock = productDoc.data().stock || 0
    let newStock = currentStock
    
    // Calculate new stock based on adjustment type
    switch (type) {
      case 'add':
        newStock = currentStock + Number(adjustment)
        break
      case 'remove':
        newStock = Math.max(0, currentStock - Number(adjustment))
        break
      case 'set':
        newStock = Number(adjustment)
        break
    }
    
    // Update product stock
    await updateDoc(productRef, {
      stock: newStock,
      updatedAt: Timestamp.now()
    })
    
    return NextResponse.json({
      success: true,
      message: 'Inventory updated successfully',
      newStock
    })
  } catch (error: unknown) {
    console.error('Error updating inventory:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
