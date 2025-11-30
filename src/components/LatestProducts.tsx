import React, { useEffect, useState } from 'react';
import { fetchProducts } from '@/lib/cms.ts';
import ProductCard from './ProductCard';
import type { Product } from './ProductList';

export default function LatestProducts() {
  const [latest, setLatest] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const products = await fetchProducts();
        // Assuming products have a numeric ID or we could rely on createdAt if exposed.
        const sorted = [...products].sort((a, b) => parseInt(b.id) - parseInt(a.id));
        setLatest(sorted.slice(0, 3));
      } catch (e) {
        setError('No se pudieron cargar los últimos productos.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Últimos productos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl shadow p-4 h-64 flex flex-col">
              <div className="flex-1 bg-gray-200 rounded mb-4" />
              <div className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-3/4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="mt-16 text-red-600">{error}</div>;
  }

  if (!latest.length) {
    return null;
  }

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-6">Últimos productos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {latest.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

