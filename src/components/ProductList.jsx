import React, { useEffect, useState, useRef } from "react";
import ProductCard from "./ProductCard.jsx";
import ProductFilters from "./ProductFilters.jsx";
import ProductCardSkeleton from "./ProductCardSkeleton.jsx";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("none");
  const [visibleCount, setVisibleCount] = useState(9);
  const [loading, setLoading] = useState(true);

  const loaderRef = useRef(null); // 👈 Referencia al elemento observador

  // 🔹 Traer productos una sola vez
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const res = await fetch("https://dummyjson.com/products?limit=100");
      const data = await res.json();
      setProducts(data.products);
      setFiltered(data.products);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // 🔹 Aplicar filtros, búsqueda y orden
  useEffect(() => {
    let results = [...products];

    if (search) {
      results = results.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category !== "all") {
      results = results.filter((p) => p.category === category);
    }

    if (sort === "asc") {
      results.sort((a, b) => a.price - b.price);
    } else if (sort === "desc") {
      results.sort((a, b) => b.price - a.price);
    }

    setFiltered(results);
    setVisibleCount(9); // reinicia el conteo
  }, [search, category, sort, products]);

  // 🔹 Cargar más productos cuando el loader sea visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && visibleCount < filtered.length) {
          setVisibleCount((prev) => prev + 9);
        }
      },
      {
        root: null, // viewport
        rootMargin: "200px", // empieza antes de llegar al final
        threshold: 0,
      }
    );

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
            ? Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : filtered.slice(0, visibleCount).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>

        {/* 👇 Loader invisible para el IntersectionObserver */}
        {!loading && visibleCount < filtered.length && (
          <div ref={loaderRef} className="h-10 flex justify-center items-center mt-10">
            <span className="text-gray-500 text-sm">Cargando más productos...</span>
          </div>
        )}

        {/* Si ya no quedan más */}
        {!loading && visibleCount >= filtered.length && (
          <div className="text-center py-10 text-gray-400 text-sm">
            No hay más productos para mostrar
          </div>
        )}
      </main>
    </div>
  );
}
