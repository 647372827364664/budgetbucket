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

// GET - Fetch all products
export async function GET() {
  try {
    const productsRef = collection(db, 'products')
    const q = query(productsRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }))
    
    return NextResponse.json({ 
      success: true, 
      products 
    })
  } catch (error: unknown) {
    console.error('Error fetching products:', error)
    // Return empty products array instead of error
    return NextResponse.json({ 
      success: true, 
      products: [],
      message: 'Could not fetch from Firebase' 
    })
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating product with data:', body)
    
    const { 
      name, 
      description = '', 
      price, 
      originalPrice,
      discount,
      category, 
      stock, 
      images = [],
      tags = [],
      featured = false,
      trending = false,
      newArrival = false,
      minStock = 5
    } = body
    
    // Only name, price, category and stock are required
    if (!name || price === undefined || !category || stock === undefined) {
      console.log('Missing required fields:', { name, price, category, stock })
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, price, category, stock' },
        { status: 400 }
      )
    }
    
    const productsRef = collection(db, 'products')
    const newProduct = {
      name,
      description: description || '',
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      discount: discount ? Number(discount) : null,
      category,
      stock: Number(stock),
      images: images || [],
      tags: tags || [],
      featured: Boolean(featured),
      trending: Boolean(trending),
      newArrival: Boolean(newArrival),
      minStock: Number(minStock) || 5,
      rating: 0,
      reviews: 0,
      sold: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
    
    console.log('Saving product to Firebase:', newProduct)
    const docRef = await addDoc(productsRef, newProduct)
    console.log('Product created with ID:', docRef.id)
    
    // Also create inventory record
    try {
      const inventoryRef = collection(db, 'inventory')
      await addDoc(inventoryRef, {
        productId: docRef.id,
        productName: name,
        currentStock: Number(stock),
        minStock: Number(minStock) || 5,
        lastRestocked: Timestamp.now(),
        adjustments: []
      })
      console.log('Inventory record created')
    } catch (invErr) {
      console.log('Could not create inventory record:', invErr)
    }
    
    return NextResponse.json({
      success: true,
      product: {
        id: docRef.id,
        ...newProduct,
        createdAt: newProduct.createdAt.toDate().toISOString(),
        updatedAt: newProduct.updatedAt.toDate().toISOString()
      }
    })
  } catch (error: unknown) {
    console.error('Error creating product:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    // Convert numeric fields
    if (updates.price) updates.price = Number(updates.price)
    if (updates.discountPrice) updates.discountPrice = Number(updates.discountPrice)
    if (updates.stock !== undefined) updates.stock = Number(updates.stock)
    if (updates.minStock) updates.minStock = Number(updates.minStock)
    
    const productRef = doc(db, 'products', id)
    await updateDoc(productRef, {
      ...updates,
      updatedAt: Timestamp.now()
    })
    
    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    })
  } catch (error: unknown) {
    console.error('Error updating product:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    const productRef = doc(db, 'products', id)
    await deleteDoc(productRef)
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error: unknown) {
    console.error('Error deleting product:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
