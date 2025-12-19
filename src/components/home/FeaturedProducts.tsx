'use client'

import ProductCard from '@/components/products/ProductCard'

const MOCK_PRODUCTS = [
  {
    id: '1',
    title: 'Premium Wireless Headphones',
    price: 2999,
    originalPrice: 5999,
    images: ['https://via.placeholder.com/300x300?text=Headphones'],
    rating: 4.5,
    tags: ['Hot', 'BestSeller'] as any,
  },
  {
    id: '2',
    title: 'Smart Watch Pro',
    price: 1999,
    originalPrice: 3999,
    images: ['https://via.placeholder.com/300x300?text=Smart+Watch'],
    rating: 4.8,
    tags: ['New', 'Trending'] as any,
  },
  {
    id: '3',
    title: 'USB-C Fast Charger',
    price: 499,
    originalPrice: 999,
    images: ['https://via.placeholder.com/300x300?text=Charger'],
    rating: 4.3,
    tags: ['Hot'] as any,
  },
  {
    id: '4',
    title: 'Phone Case Bundle',
    price: 349,
    originalPrice: 799,
    images: ['https://via.placeholder.com/300x300?text=Phone+Case'],
    rating: 4.6,
    tags: ['BestSeller'] as any,
  },
]

export function FeaturedProducts() {
  return (
    <section className="container-custom py-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Featured Products</h2>
        <a href="/products" className="btn-secondary">
          View All
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
