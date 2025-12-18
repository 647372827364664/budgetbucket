import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Categories API called - GET')
    
    // Return hardcoded categories for immediate functionality
    const defaultCategories = [
      {
        id: 'electronics',
        name: 'Electronics',
        slug: 'electronics',
        icon: 'Smartphone',
        color: 'from-blue-500 to-cyan-500',
        count: 5670,
        image: '📱',
        description: 'Latest gadgets and electronics',
        isActive: true,
        order: 1
      },
      {
        id: 'fashion',
        name: 'Fashion & Style',
        slug: 'fashion',
        icon: 'Shirt',
        color: 'from-pink-500 to-rose-500',
        count: 3240,
        image: '👕',
        description: 'Trendy clothing and accessories',
        isActive: true,
        order: 2
      },
      {
        id: 'home',
        name: 'Home & Garden',
        slug: 'home',
        icon: 'Home',
        color: 'from-green-500 to-emerald-500',
        count: 4200,
        image: '🏠',
        description: 'Furniture, decor, and garden essentials',
        isActive: true,
        order: 3
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        slug: 'kitchen',
        icon: 'Utensils',
        color: 'from-orange-500 to-amber-500',
        count: 3100,
        image: '🍳',
        description: 'Cookware, appliances, and dining',
        isActive: true,
        order: 4
      },
      {
        id: 'sports',
        name: 'Sports & Outdoors',
        slug: 'sports',
        icon: 'Zap',
        color: 'from-yellow-500 to-orange-500',
        count: 1800,
        image: '⚽',
        description: 'Sports gear and outdoor equipment',
        isActive: true,
        order: 5
      },
      {
        id: 'beauty',
        name: 'Beauty & Health',
        slug: 'beauty',
        icon: 'Heart',
        color: 'from-purple-500 to-pink-500',
        count: 2900,
        image: '💄',
        description: 'Skincare, makeup, and wellness',
        isActive: true,
        order: 6
      }
    ]

    return NextResponse.json({
      success: true,
      categories: defaultCategories,
      message: 'Categories loaded successfully'
    })

  } catch (error) {
    console.error('Error in categories API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}