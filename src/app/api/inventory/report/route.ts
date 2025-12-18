import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

/**
 * GET /api/inventory/report/summary
 * Get inventory summary and statistics
 */
export async function GET() {
  try {
    const productsRef = collection(db, 'products')
    const productsSnap = await getDocs(productsRef)

    const inventory = productsSnap.docs.map((doc) => ({
      productId: doc.id,
      name: doc.data().title,
      stock: doc.data().stock || 0,
      price: doc.data().price,
      sku: doc.data().sku || '',
      category: doc.data().category || 'Uncategorized',
    }))

    // Calculate statistics
    const stats = {
      totalProducts: inventory.length,
      totalValueInStock: 0,
      avgStockPerProduct: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      inStockProducts: 0,
      topStockProducts: [] as any[],
      lowStockAlert: [] as any[],
      categoryBreakdown: {} as Record<string, any>,
    }

    let totalStock = 0

    for (const item of inventory) {
      const value = item.stock * item.price
      stats.totalValueInStock += value
      totalStock += item.stock

      if (item.stock > 5) {
        stats.inStockProducts++
      } else if (item.stock > 0) {
        stats.lowStockProducts++
        stats.lowStockAlert.push({
          productId: item.productId,
          name: item.name,
          stock: item.stock,
          price: item.price,
        })
      } else {
        stats.outOfStockProducts++
      }

      // Category breakdown
      if (!stats.categoryBreakdown[item.category]) {
        stats.categoryBreakdown[item.category] = {
          count: 0,
          totalStock: 0,
          totalValue: 0,
        }
      }
      stats.categoryBreakdown[item.category].count++
      stats.categoryBreakdown[item.category].totalStock += item.stock
      stats.categoryBreakdown[item.category].totalValue += value
    }

    stats.avgStockPerProduct = inventory.length > 0 ? totalStock / inventory.length : 0
    stats.topStockProducts = inventory.sort((a, b) => b.stock - a.stock).slice(0, 10)
    stats.lowStockAlert = stats.lowStockAlert.sort((a, b) => a.stock - b.stock).slice(0, 10)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    })
  } catch (error: any) {
    console.error('Error generating inventory report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    )
  }
}
