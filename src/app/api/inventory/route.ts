import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore'

/**
 * GET /api/inventory
 * Fetch inventory status for all products
 * Query params: ?lowStockOnly=true (returns only products with stock < threshold)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true'
    const threshold = parseInt(searchParams.get('threshold') || '5')

    const productsRef = collection(db, 'products')
    const productsSnap = await getDocs(productsRef)

    let inventoryData = productsSnap.docs.map((doc) => ({
      productId: doc.id,
      name: doc.data().title,
      stock: doc.data().stock || 0,
      price: doc.data().price,
      sku: doc.data().sku || '',
      status: doc.data().stock > threshold ? 'in_stock' : doc.data().stock > 0 ? 'low_stock' : 'out_of_stock',
    }))

    if (lowStockOnly) {
      inventoryData = inventoryData.filter((item) => item.status === 'low_stock' || item.status === 'out_of_stock')
    }

    return NextResponse.json({
      success: true,
      data: inventoryData,
      summary: {
        total: inventoryData.length,
        inStock: inventoryData.filter((i) => i.status === 'in_stock').length,
        lowStock: inventoryData.filter((i) => i.status === 'low_stock').length,
        outOfStock: inventoryData.filter((i) => i.status === 'out_of_stock').length,
      },
    })
  } catch (error: any) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory
 * Bulk update inventory for multiple products
 * Body: { updates: [{ productId, stock, reason }] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { updates } = body

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Invalid updates array' }, { status: 400 })
    }

    const results = []

    for (const update of updates) {
      const { productId, stock, reason } = update

      if (!productId || stock === undefined) {
        results.push({
          productId,
          success: false,
          error: 'Missing productId or stock',
        })
        continue
      }

      try {
        const productRef = doc(db, 'products', productId)
        await updateDoc(productRef, {
          stock,
          lastUpdated: Timestamp.now(),
          ...(reason && { lastUpdateReason: reason }),
        })

        results.push({
          productId,
          success: true,
          newStock: stock,
        })
      } catch (err: any) {
        results.push({
          productId,
          success: false,
          error: err.message,
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    return NextResponse.json(
      {
        success: true,
        updated: successCount,
        total: results.length,
        results,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory', details: error.message },
      { status: 500 }
    )
  }
}
