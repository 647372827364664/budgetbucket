'use client'

import Link from 'next/link'

const categories = [
  { id: 1, name: 'Electronics', icon: '📱', color: 'bg-blue-100' },
  { id: 2, name: 'Fashion', icon: '👗', color: 'bg-pink-100' },
  { id: 3, name: 'Home & Living', icon: '🏠', color: 'bg-green-100' },
  { id: 4, name: 'Books', icon: '📚', color: 'bg-purple-100' },
  { id: 5, name: 'Sports', icon: '⚽', color: 'bg-orange-100' },
  { id: 6, name: 'Beauty', icon: '💄', color: 'bg-red-100' },
]

export function CategoriesSection() {
  return (
    <section className="container-custom py-12">
      <h2 className="text-3xl font-bold mb-8">Shop by Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.name.toLowerCase().replace(/ /g, '-')}`}
            className="card p-6 text-center hover:shadow-lg transition group"
          >
            <div className={`${category.color} w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition text-2xl`}>
              {category.icon}
            </div>
            <h3 className="font-semibold text-sm">{category.name}</h3>
          </Link>
        ))}
      </div>
    </section>
  )
}
