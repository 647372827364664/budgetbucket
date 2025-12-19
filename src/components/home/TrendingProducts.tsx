'use client'

import ProductCard from '@/components/products/ProductCard'

const TRENDING_PRODUCTS = [
  {
    id: 'trend1',
    title: 'AirPods Pro 2',
    price: 19999,
    originalPrice: 24999,
    images: ['https://via.placeholder.com/300x300?text=AirPods+Pro'],
    rating: 4.9,
    tags: ['Trending', 'BestSeller'] as any,
  },
  {
    id: 'trend2',
    title: 'MacBook Air M2',
    price: 99999,
    originalPrice: 129999,
    images: ['https://via.placeholder.com/300x300?text=MacBook+Air'],
    rating: 4.8,
    tags: ['Trending'] as any,
  },
  {
    id: 'trend3',
    title: 'iPad Pro 12.9',
    price: 79999,
    originalPrice: 99999,
    images: ['https://via.placeholder.com/300x300?text=iPad+Pro'],
    rating: 4.7,
    tags: ['Hot', 'Trending'] as any,
  },
  {
    id: 'trend4',
    title: 'Apple Watch Series 8',
    price: 29999,
    originalPrice: 39999,
    images: ['https://via.placeholder.com/300x300?text=Apple+Watch'],
    rating: 4.6,
    tags: ['Trending', 'BestSeller'] as any,
  },
]

export function TrendingProducts() {
  return (
    <section className="container-custom py-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">🔥 Trending Now</h2>
        <a href="/products?sort=trending" className="btn-secondary">
          View All
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {TRENDING_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
