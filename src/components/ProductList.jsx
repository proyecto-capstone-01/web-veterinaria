import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard.jsx";
import ProductFilters from "./ProductFilters.jsx";
import Buttons from "../components/Buttons.astro"

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [sort, setSort] = useState("none");

    const [visibleCount, setVisibleCount] = useState(8);

    useEffect(() => {
        async function fetchProducts() {
        const res = await fetch("https://fakestoreapi.com/products");
        const data = await res.json();
        setProducts(data);
        setFiltered(data);
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
        setVisibleCount(8);
    }, [search, category, sort, products]);

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 8);
    };

    return (
        <div className="space-y-6">
        <ProductFilters
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            sort={sort}
            setSort={setSort}
            products={products}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.slice(0, visibleCount).map((product) => (
            <ProductCard key={product.id} product={product} />
            ))}
        </div>

        {visibleCount < filtered.length && (
            <div className="flex justify-center">
                <button
                    onClick={handleLoadMore}
                    className="inline-block px-5 py-3 text-md rounded-lg transition duration-200 ease-in-out text-center bg-primary text-white hover:bg-primary-dark"
                >
                    Cargar más
                </button>
            </div>
        )}
        </div>
    );
}