import React, { useEffect, useState, useRef } from "react";
import ProductCard from "./ProductCard.js";
import ProductFilters from "./ProductFilters.js";
import ProductCardSkeleton from "./ProductCardSkeleton.jsx";
import { fetchProducts } from "@/lib/cms.ts";

interface ImageSizesObject {
    _key: string;
    url: string;
    width: number;
    height: number;
    mimeType: string;
    filesize: number;
    filename: string;
}

interface ImageObject {
    id: string;
    url: string;
    thumbnailURL: string;
    filename: string;
    width: number;
    height: number
    alt: string;
    sizes: {
        thumbnail: ImageSizesObject;
        square: ImageSizesObject;
        small: ImageSizesObject;
        medium: ImageSizesObject;
        large: ImageSizesObject;
        xlarge: ImageSizesObject;
        og: ImageSizesObject;
    }
}

export interface Product {
    id: string;
    name: string;
    price?: number;
    images: ImageObject[];
    description?: string;
    outOfStock: boolean;
    discount?: number;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("none");
  const [visibleCount, setVisibleCount] = useState(9);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(null);

  useEffect(() => {
    const loadProducts = async () => {
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data);
        setLoading(false);
    };
    loadProducts();
  }, []);

  useEffect(() => {
    let updated = [...products];

    if (search) {
        updated = updated.filter((product) =>
            product.name.toLowerCase().includes(search.toLowerCase())
        );
    }
    if (sort === "price-asc") {
        updated.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === "price-desc") {
        updated.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === "name-asc") {
        updated.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "name-desc") {
        updated.sort((a, b) => b.name.localeCompare(a.name));
    }

    setFiltered(updated);
    setVisibleCount(9); // Reset visible count on filter change
  }, [search, category, sort, products]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => prev + 6);
      }
    }, {
      rootMargin: '100px',
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [filtered, visibleCount]);

  return (
    <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <ProductFilters
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          sort={sort}
          setSort={setSort}
          products={products}
        />
      </aside>

      <main className="md:col-span-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : filtered.slice(0, visibleCount).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>

        {!loading && visibleCount < filtered.length && (
          <div ref={loaderRef} className="h-10 flex justify-center items-center mt-10">
            <span className="text-gray-500 text-sm">Cargando más productos...</span>
          </div>
        )}

        {!loading && visibleCount >= filtered.length && (
          <div className="text-center py-10 text-gray-400 text-sm">
            No hay más productos para mostrar
          </div>
        )}
      </main>
    </div>
  );
}