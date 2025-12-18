import { NextRequest, NextResponse } from 'next/server'

// Demo products data with comprehensive specifications
const DEMO_PRODUCTS = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with active noise cancellation, superior sound quality, and premium build materials. Perfect for music enthusiasts and professionals.',
    price: 2999,
    originalPrice: 3999,
    discount: 25,
    category: 'Electronics',
    brand: 'AudioTech',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop'
    ],
    rating: 4.5,
    reviewCount: 128,
    inStock: true,
    stock: 45,
    features: [
      'Active Noise Cancellation',
      '30-hour Battery Life',
      'Quick Charge (5 min = 3 hours)',
      'Premium Materials',
      'Multipoint Bluetooth Connection',
      'Voice Assistant Support'
    ],
    specifications: {
      'Weight': '250g',
      'Connectivity': 'Bluetooth 5.0',
      'Frequency Response': '20Hz - 20kHz',
      'Driver Size': '40mm',
      'Battery': '30 hours',
      'Charging Time': '2 hours',
      'Noise Cancellation': 'Active ANC',
      'Microphone': 'Built-in with noise cancellation',
      'Warranty': '2 years'
    },
    tags: ['wireless', 'noise-canceling', 'premium', 'audio', 'bluetooth'],
    isNew: true,
    isTrending: true,
    isFeatured: true
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking smartwatch with heart rate monitoring, GPS tracking, multiple sport modes, and comprehensive health insights. Your perfect workout companion.',
    price: 4999,
    originalPrice: 5999,
    discount: 17,
    category: 'Electronics',
    brand: 'FitPro',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop'
    ],
    rating: 4.3,
    reviewCount: 89,
    inStock: true,
    stock: 32,
    features: [
      'Heart Rate Monitoring',
      'GPS Tracking',
      'Water Resistant (50m)',
      '7-day Battery Life',
      '30+ Sport Modes',
      'Sleep Tracking',
      'Stress Monitoring'
    ],
    specifications: {
      'Display': '1.4" AMOLED',
      'Battery': '7 days',
      'Water Resistance': '5ATM (50m)',
      'Sensors': 'Heart Rate, GPS, Accelerometer, Gyroscope',
      'Compatibility': 'iOS & Android',
      'Weight': '45g',
      'Operating System': 'FitPro OS',
      'Storage': '4GB',
      'Warranty': '1 year'
    },
    tags: ['fitness', 'smartwatch', 'health', 'gps', 'waterproof'],
    isNew: false,
    isTrending: true,
    isFeatured: true
  },
  {
    id: '3',
    name: 'Cotton Casual T-Shirt',
    description: '100% premium cotton t-shirt with superior comfort and durability. Pre-shrunk fabric ensures perfect fit wash after wash. Available in 8 vibrant colors.',
    price: 599,
    originalPrice: 899,
    discount: 33,
    category: 'Fashion',
    brand: 'ComfortWear',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500&h=500&fit=crop'
    ],
    rating: 4.2,
    reviewCount: 156,
    inStock: true,
    stock: 78,
    features: [
      '100% Cotton',
      'Pre-shrunk Fabric',
      'Machine Washable',
      'Available in 8 Colors',
      'Tagless Design',
      'Reinforced Seams'
    ],
    specifications: {
      'Material': '100% Cotton',
      'Fit': 'Regular',
      'Care': 'Machine wash cold',
      'Sizes': 'S, M, L, XL, XXL',
      'GSM': '180',
      'Colors': '8 options',
      'Origin': 'Made in India',
      'Shrinkage': 'Pre-shrunk',
      'Warranty': '30 days'
    },
    tags: ['cotton', 'casual', 'comfortable', 'daily-wear', 'unisex'],
    isNew: false,
    isTrending: false,
    isFeatured: false
  },
  {
    id: '4',
    name: 'Automatic Coffee Maker',
    description: 'Professional-grade programmable coffee maker with integrated burr grinder, thermal carafe, and precision brewing technology. Wake up to perfect coffee every morning.',
    price: 8999,
    originalPrice: 11999,
    discount: 25,
    category: 'Home & Kitchen',
    brand: 'BrewMaster',
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=500&h=500&fit=crop'
    ],
    rating: 4.6,
    reviewCount: 67,
    inStock: true,
    stock: 23,
    features: [
      'Built-in Burr Grinder',
      'Programmable Timer',
      'Thermal Carafe',
      'Auto-Clean Function',
      'Brew Strength Control',
      'Gold-Tone Filter Included'
    ],
    specifications: {
      'Capacity': '12 cups (1.8L)',
      'Power': '1200W',
      'Grinder': 'Conical burr grinder',
      'Material': 'Stainless Steel',
      'Dimensions': '35 x 25 x 40 cm',
      'Weight': '4.5 kg',
      'Timer': '24-hour programmable',
      'Temperature': 'Optimal brewing temperature',
      'Warranty': '2 years'
    },
    tags: ['coffee', 'automatic', 'grinder', 'programmable', 'thermal'],
    isNew: true,
    isTrending: false,
    isFeatured: true
  },
  {
    id: '5',
    name: 'LED Desk Lamp',
    description: 'Modern adjustable LED desk lamp with touch control, multiple brightness levels, color temperature adjustment, and convenient USB charging port for your devices.',
    price: 1299,
    originalPrice: 1799,
    discount: 28,
    category: 'Home & Kitchen',
    brand: 'LightUp',
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=500&h=500&fit=crop'
    ],
    rating: 4.4,
    reviewCount: 94,
    inStock: true,
    stock: 56,
    features: [
      'Touch Control',
      '3 Color Temperatures',
      'Dimmable (10 levels)',
      'USB Charging Port',
      'Memory Function',
      'Eye-Care Technology'
    ],
    specifications: {
      'Power': '12W',
      'Color Temperature': '3000K-6500K',
      'Brightness': '1000 lumens',
      'Material': 'Aluminum alloy',
      'Height': 'Adjustable up to 45cm',
      'USB Output': '5V/1A',
      'CRI': '>95',
      'Lifespan': '50,000 hours',
      'Warranty': '1 year'
    },
    tags: ['led', 'adjustable', 'touch-control', 'usb-port', 'modern'],
    isNew: false,
    isTrending: true,
    isFeatured: false
  },
  {
    id: '6',
    name: 'Wireless Gaming Mouse',
    description: 'High-precision wireless gaming mouse with customizable RGB lighting, programmable buttons, ultra-fast response time, and ergonomic design for extended gaming sessions.',
    price: 2499,
    originalPrice: 3299,
    discount: 24,
    category: 'Electronics',
    brand: 'GamePro',
    images: [
      'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1563297007-0686b7003af7?w=500&h=500&fit=crop'
    ],
    rating: 4.7,
    reviewCount: 203,
    inStock: true,
    stock: 89,
    features: [
      'Customizable RGB Lighting',
      '6 Programmable Buttons',
      '12000 DPI Sensor',
      '100-hour Battery Life',
      'Ultra-Fast Response',
      'Ergonomic Design'
    ],
    specifications: {
      'DPI': 'Up to 12,000 (adjustable)',
      'Connectivity': '2.4GHz Wireless',
      'Battery': '100 hours',
      'Buttons': '6 programmable',
      'Weight': '95g',
      'Dimensions': '12.5 x 6.8 x 4.2 cm',
      'Polling Rate': '1000Hz',
      'Response Time': '1ms',
      'Warranty': '2 years'
    },
    tags: ['gaming', 'wireless', 'rgb', 'high-precision', 'ergonomic'],
    isNew: true,
    isTrending: true,
    isFeatured: false
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const featured = searchParams.get('featured')
    const trending = searchParams.get('trending')
    const newArrivals = searchParams.get('new')

    let filteredProducts = [...DEMO_PRODUCTS]

    // Apply filters
    if (category && category !== 'All') {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      )
    }

    if (search) {
      const searchTerm = search.toLowerCase()
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }

    if (minPrice) {
      filteredProducts = filteredProducts.filter(product => product.price >= parseInt(minPrice))
    }

    if (maxPrice) {
      filteredProducts = filteredProducts.filter(product => product.price <= parseInt(maxPrice))
    }

    if (featured === 'true') {
      filteredProducts = filteredProducts.filter(product => product.isFeatured)
    }

    if (trending === 'true') {
      filteredProducts = filteredProducts.filter(product => product.isTrending)
    }

    if (newArrivals === 'true') {
      filteredProducts = filteredProducts.filter(product => product.isNew)
    }

    // Apply sorting
    switch (sort) {
      case 'price-low':
        filteredProducts.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filteredProducts.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        filteredProducts.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        filteredProducts.sort((a, b) => {
          if (a.isNew && !b.isNew) return -1
          if (!a.isNew && b.isNew) return 1
          return 0
        })
        break
      case 'popular':
        filteredProducts.sort((a, b) => b.reviewCount - a.reviewCount)
        break
      default:
        // Default sort by featured, then trending, then newest
        filteredProducts.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1
          if (!a.isFeatured && b.isFeatured) return 1
          if (a.isTrending && !b.isTrending) return -1
          if (!a.isTrending && b.isTrending) return 1
          if (a.isNew && !b.isNew) return -1
          if (!a.isNew && b.isNew) return 1
          return 0
        })
    }

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

    // Calculate pagination info
    const totalProducts = filteredProducts.length
    const totalPages = Math.ceil(totalProducts / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts,
          hasNextPage,
          hasPrevPage,
          limit
        },
        filters: {
          categories: ['All', 'Electronics', 'Fashion', 'Home & Kitchen'],
          priceRange: {
            min: Math.min(...DEMO_PRODUCTS.map(p => p.price)),
            max: Math.max(...DEMO_PRODUCTS.map(p => p.price))
          }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}