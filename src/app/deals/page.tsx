"use client";
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { toast } from 'react-hot-toast';
import ProductCard from '@/components/products/ProductCard';

// Use the shared Product type from your types folder
import type { Product } from '@/types';

export default function DealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        const productsData: Product[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            title: data.title || data.name || '',
            price: data.price || 0,
            originalPrice: data.originalPrice,
            images: Array.isArray(data.images) ? data.images : [],
            rating: data.rating,
            reviews: data.reviews,
            stock: data.stock || 0,
            category: data.category || '',
            brand: data.brand,
            tags: data.tags,
            description: typeof data.description === 'string' ? data.description : '',
            hotDeal: Boolean(data.hotDeal),
            specifications: data.specifications || {},
            createdAt: data.createdAt ? (typeof data.createdAt === 'string' ? data.createdAt : data.createdAt.toDate?.() ?? '') : '',
            updatedAt: data.updatedAt ? (typeof data.updatedAt === 'string' ? data.updatedAt : data.updatedAt.toDate?.() ?? '') : '',
          };
        });
        setProducts(productsData.filter(p => p.hotDeal));
      } catch (error) {
        toast.error('Failed to load deals');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container-custom py-10">
        <h1 className="text-3xl font-bold mb-6 text-center text-red-600">🔥 Hot Deals</h1>
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading deals...</div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-500 py-20">No hot deals available right now.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
