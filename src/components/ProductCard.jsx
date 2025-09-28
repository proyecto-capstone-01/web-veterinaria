import React from "react";

export default function ProductCard({ product }) {
    return (
        <a
            href={`/products/${product.id}`}
            className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden block"
        >
            <img
                src={product.images[0]}
                alt={product.title}
                className="w-full h-48 object-contain bg-gray-100"
            />
            <div className="p-4">
                <h2 className="text-lg font-semibold line-clamp-1">{product.title}</h2>
                <p className="text-gray-600 text-sm line-clamp-2 pt-2">{product.description}</p>
                <p className="mt-2 font-bold text-indigo-600 pt-2">${product.price}</p>
            </div>
        </a>
    );
}
