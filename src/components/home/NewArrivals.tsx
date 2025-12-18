'use client'

import { ProductCard } from '@/components/products/ProductCard'

const NEW_PRODUCTS = [
  {
    id: 'new1',
    title: 'Wireless Charging Pad',
    price: 899,
    originalPrice: 1499,
    images: ['https://via.placeholder.com/300x300?text=Charging+Pad'],
    rating: 4.4,
    tags: ['New'] as any,
  },
  {
    id: 'new2',
    title: 'Portable Power Bank',
    price: 1299,
    originalPrice: 2499,
    images: ['https://via.placeholder.com/300x300?text=Power+Bank'],
    rating: 4.7,
    tags: ['New', 'Hot'] as any,
  },
  {
    id: 'new3',
    title: 'Bluetooth Speaker',
    price: 1599,
    originalPrice: 3499,
    images: ['https://via.placeholder.com/300x300?text=Speaker'],
    rating: 4.5,
    tags: ['New'] as any,
  },
  {
    id: 'new4',
    title: 'Screen Protector Pack',
    price: 299,
    originalPrice: 799,
    images: ['https://via.placeholder.com/300x300?text=Screen+Protector'],
    rating: 4.2,
    tags: ['New'] as any,
  },
]

export function NewArrivals() {
  return (
    <section className="container-custom py-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">✨ New Arrivals</h2>
        <a href="/products?sort=newest" className="btn-secondary">
          View All
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {NEW_PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
