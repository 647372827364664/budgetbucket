import { NextRequest, NextResponse } from 'next/server'

// Demo products data (same as in route.ts)
const DEMO_PRODUCTS = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
    price: 2999,
    originalPrice: 4999,
    category: 'Electronics',
    brand: 'SoundMax',
    images: [
      '/api/placeholder/400/400',
      '/api/placeholder/400/400',
      '/api/placeholder/400/400'
    ],
    rating: 4.5,
    reviewCount: 124,
    inStock: true,
    stockCount: 25,
    tags: ['wireless', 'noise-cancellation', 'premium'],
    specifications: {
      'Battery Life': '30 hours',
      'Connectivity': 'Bluetooth 5.0',
      'Weight': '250g',
      'Driver Size': '40mm'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracker with heart rate monitoring, GPS, and waterproof design. Track your health 24/7.',
    price: 1999,
    originalPrice: 2999,
    category: 'Wearables',
    brand: 'FitTrack',
    images: [
      '/api/placeholder/400/400',
      '/api/placeholder/400/400'
    ],
    rating: 4.2,
    reviewCount: 89,
    inStock: true,
    stockCount: 40,
    tags: ['fitness', 'smartwatch', 'waterproof'],
    specifications: {
      'Display': '1.4 inch AMOLED',
      'Battery': '7 days',
      'Water Resistance': '5ATM',
      'Sensors': 'Heart Rate, GPS, Accelerometer'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable organic cotton t-shirt. Perfect fit with premium quality fabric.',
    price: 799,
    originalPrice: 1299,
    category: 'Clothing',
    brand: 'EcoWear',
    images: [
      '/api/placeholder/400/400',
      '/api/placeholder/400/400',
      '/api/placeholder/400/400'
    ],
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
    stockCount: 100,
    tags: ['organic', 'cotton', 'sustainable'],
    specifications: {
      'Material': '100% Organic Cotton',
      'Fit': 'Regular',
      'Care': 'Machine Washable',
      'Origin': 'Made in India'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Professional Coffee Maker',
    description: 'Barista-quality coffee maker with multiple brewing options. Make cafe-style coffee at home.',
    price: 4999,
    originalPrice: 6999,
    category: 'Appliances',
    brand: 'BrewMaster',
    images: [
      '/api/placeholder/400/400',
      '/api/placeholder/400/400'
    ],
    rating: 4.6,
    reviewCount: 73,
    inStock: true,
    stockCount: 15,
    tags: ['coffee', 'appliance', 'premium'],
    specifications: {
      'Capacity': '12 cups',
      'Brewing Methods': '5 different styles',
      'Material': 'Stainless Steel',
      'Warranty': '2 years'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'LED Desk Lamp',
    description: 'Adjustable LED desk lamp with touch controls and multiple brightness levels. Perfect for work and study.',
    price: 1299,
    originalPrice: 1999,
    category: 'Home',
    brand: 'LightPro',
    images: [
      '/api/placeholder/400/400'
    ],
    rating: 4.3,
    reviewCount: 45,
    inStock: true,
    stockCount: 30,
    tags: ['led', 'adjustable', 'desk'],
    specifications: {
      'Light Source': 'LED',
      'Power': '12W',
      'Color Temperature': '3000K-6500K',
      'Control': 'Touch Controls'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '6',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking and long battery life. Ideal for work and gaming.',
    price: 899,
    originalPrice: 1399,
    category: 'Electronics',
    brand: 'ClickMax',
    images: [
      '/api/placeholder/400/400',
      '/api/placeholder/400/400'
    ],
    rating: 4.4,
    reviewCount: 67,
    inStock: true,
    stockCount: 50,
    tags: ['wireless', 'ergonomic', 'precision'],
    specifications: {
      'Connectivity': 'USB Receiver',
      'Battery': '18 months',
      'DPI': 'Up to 1600',
      'Compatibility': 'Windows, Mac, Linux'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

/**
 * GET /api/products/[id]
 * Get a single product by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
    
    // Find product in demo data
    const product = DEMO_PRODUCTS.find(p => p.id === productId)
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      product: product
    })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/products/[id]
 * Update a product
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
    const updateData = await _request.json()

    // For demo purposes, just return success
    const updatedProduct = {
      id: productId,
      ...updateData,
      updatedAt: new Date()
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: 'Product updated successfully'
    })

  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/[id]
 * Delete a product
 */
export async function DELETE(
  _request: NextRequest,
  { params: _ }: { params: { id: string } }
) {
  try {
    // In a real app, this would delete from the database
    // For demo purposes, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}