import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard.jsx";
import ProductFilters from "./ProductFilters.jsx";
import ProductCardSkeleton from "./ProductCardSkeleton.jsx";
import Separator from "./Separator.astro";

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [sort, setSort] = useState("none");
    const [visibleCount, setVisibleCount] = useState(9);
    const [loading, setLoading] = useState(true);

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
        setVisibleCount(9);
    }, [search, category, sort, products]);

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 9);
    };

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

            {!loading && visibleCount < filtered.length && (
            <div className="flex justify-center py-10">
                <button
                onClick={handleLoadMore}
                className="inline-block px-5 py-3 text-md rounded-lg transition duration-200 ease-in-out text-center bg-primary text-white hover:bg-primary-dark"
                >
                Cargar más
                </button>
            </div>
            )}
        </main>
        </div>
    );
}
