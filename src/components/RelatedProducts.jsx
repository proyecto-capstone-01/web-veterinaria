import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard.jsx";
import ProductCardSkeleton from "./ProductCardSkeleton.jsx";

export default function RelatedProducts({ currentProductId, category }) {
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRelated() {
        setLoading(true);
        const res = await fetch("https://dummyjson.com/products?limit=100");
        const data = await res.json();
        const filtered = data.products
            .filter(
            (p) => p.category === category && p.id !== currentProductId
            )
            .slice(0, 4); // solo 4 productos
        setRelated(filtered);
        setLoading(false);
        }
        fetchRelated();
    }, [currentProductId, category]);

    if (loading) {
        return (
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
            ))}
        </div>
        );
    }

    if (!related.length) return null;

    return (
        <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">También te podría interesar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((product) => (
                <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}