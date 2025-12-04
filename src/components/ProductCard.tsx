import React from "react";
import type { Product } from "./ProductList";
// @ts-ignore
import { PUBLIC_CMS_API_URL } from "astro:env/client";

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {

    const formatPrice = (price: number) => {
        return price.toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0  });
    };

    return (
        <div className="bg-white rounded-xl shadow hover:shadow-lg hover:scale-[1.01] transition overflow-hidden block">
            <img
                src={PUBLIC_CMS_API_URL + product.images[0].thumbnailURL}
                alt={product.images[0].alt || product.name}
                className="w-full h-48 object-contain bg-gray-100"
            />
            <div className="p-4">
                <h2 className="text-lg font-semibold line-clamp-1">{product.name}</h2>
                <p className="text-gray-600 text-sm line-clamp-2 pt-2">{product.description}</p>
                {product.outOfStock && (
                    <p className="mt-2 text-sm font-semibold text-red-600">Agotado</p>
                ) }
                {product.discount && !product.outOfStock && (
                    <p className="mt-2 text-sm font-semibold text-green-600">
                        {product.discount}% de descuento
                    </p>
                )}
                { product.price && (
                    <p className="mt-2 font-bold text-indigo-600 pt-2">{formatPrice(product.price)}</p>
                ) }
            </div>
        </div>
    );
}
