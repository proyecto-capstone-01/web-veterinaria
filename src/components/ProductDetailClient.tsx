import React, { useEffect, useState } from 'react';
import { fetchProducts } from '@/lib/cms.ts';
import ProductImages from './ProductImages';
import type { Product } from './ProductList';
// @ts-ignore
import { PUBLIC_CMS_API_URL } from 'astro:env/client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';

interface ProductDetailClientProps {
  id: string;
}

export default function ProductDetailClient({ id }: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const numId = parseInt(id, 10);
        if (Number.isNaN(numId)) {
          setError('Identificador de producto inválido.');
          setLoading(false);
          return;
        }
        const data = await fetchProducts(numId);
        setProduct(data);
      } catch (e: any) {
        setError('No se pudo cargar el producto.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-gray-200 rounded" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-gray-200 rounded" />
            <div className="h-32 w-full bg-gray-200 rounded" />
            <div className="h-10 w-40 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 font-semibold">{error}</div>;
  }

  if (!product) {
    return <div className="text-gray-500">Producto no encontrado.</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/products">Productos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-primary font-semibold">{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <ProductImages product={product} />

        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold mt-4 mb-4">{product.name}</h1>
            {product.description && (
              <p className="text-gray-700 leading-relaxed mb-6">{product.description}</p>
            )}
            {product.price && (
              <div className="text-4xl font-extrabold text-indigo-600 mb-4">
                {product.price.toLocaleString('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0,
                })}
              </div>
            )}
            {product.outOfStock && (
              <div className="text-red-600 font-semibold mb-4">Agotado</div>
            )}
            {product.discount && !product.outOfStock && (
              <div className="text-green-600 font-semibold mb-4">
                {product.discount}% de descuento
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

