import React, { useMemo, useState } from 'react';
import type { ProductType } from '../types';

// Props: expects a product with images. It renders a main image and clickable thumbnails.
// Clicking a thumbnail updates the main image.
// Images coming from the CMS API may be relative; we prefix with PUBLIC_CMS_API_URL.

type ProductImagesProps = {
  product: Pick<ProductType, 'name' | 'images'>;
  className?: string;
};

const prefixCmsUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  const base = import.meta.env.PUBLIC_CMS_API_URL || '';
  // Avoid double prefixing
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${base}${path}`;
};

export default function ProductImages({ product, className }: ProductImagesProps) {
  const images = useMemo(() => product.images ?? [], [product.images]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Compute sources with fallbacks
  const getMainSrc = (index: number): string | undefined => {
    const img = images[index];
    if (!img) return undefined;
    const main = img.url ?? img.sizes?.['original']?.url ?? undefined;
    return prefixCmsUrl(main ?? undefined);
  };

  const getMainAlt = (index: number): string => {
    const img = images[index];
    return (
      (img?.altText ?? img?.sizes?.['original']?.filename ?? product.name ?? 'Product image') ||
      'Product image'
    );
  };

  const getThumbSrc = (index: number): string | undefined => {
    const img = images[index];
    if (!img) return undefined;
    const thumb = img.thumbnailUrl ?? img.sizes?.['thumbnail']?.url ?? img.url ?? undefined;
    return prefixCmsUrl(thumb ?? undefined);
  };

  // Guard empty state
  if (!images || images.length === 0) {
    return (
      <div className={className}>
        <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
          <span className="text-gray-500 text-sm">No images available</span>
        </div>
      </div>
    );
  }

  const mainSrc = getMainSrc(activeIndex);
  const mainAlt = getMainAlt(activeIndex);

  return (
    <div className={`flex gap-4 ${className ?? ''}`.trim()}>
      <div className="flex flex-col gap-3 w-20">
        {images.map((image, index) => {
          const thumbSrc = getThumbSrc(index);
          const thumbAlt = image.altText ?? image.sizes?.['thumbnail']?.filename ?? product.name ?? 'Thumbnail';
          const isActive = index === activeIndex;
          return (
            <button
              key={image.id ?? index}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isActive ? 'ring-2 ring-indigo-500' : ''
              }`}
              aria-label={`View image ${index + 1}`}
            >
              {thumbSrc ? (
                <img
                  src={thumbSrc}
                  alt={thumbAlt ?? 'Thumbnail'}
                  className="w-full h-20 object-contain bg-gray-100 rounded-lg"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-20 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 text-xs">
                  No thumb
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1">
        {mainSrc ? (
          <img
            src={mainSrc}
            alt={mainAlt}
            className="w-full h-96 object-contain bg-gray-100 rounded-lg shadow"
          />
        ) : (
          <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400">
            Image unavailable
          </div>
        )}
      </div>
    </div>
  );
}

