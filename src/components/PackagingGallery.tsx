"use client";

import { useState } from "react";
import Image from "next/image";
import ProductImage from "@/components/ProductImage";
import type { Product } from "@/data/products";

type Side = "front" | "back";

/**
 * Packaging gallery for the product detail page: one large frame showing the
 * active side, with a thumbnail switcher below when a genuine back photo
 * exists. Front is always the default. Falls back to the single front frame
 * (no switcher) when there's no back photo -- same as before.
 */
export default function PackagingGallery({ product }: { product: Product }) {
  const hasBack = Boolean(product.backImage);
  const [side, setSide] = useState<Side>("front");
  const activeSide = hasBack ? side : "front";

  return (
    <div className="flex flex-col gap-4">
      <figure className="image-frame rounded-card border border-turmeric/35 bg-[linear-gradient(180deg,#f4eada_0%,#eadcc3_100%)] p-4 shadow-card sm:p-6">
        <ProductImage
          product={product}
          side={activeSide}
          sizes="(min-width: 1024px) 560px, (min-width: 640px) 80vw, 100vw"
        />
        {(activeSide === "back" || product.image) && (
          <figcaption className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gold-text">
            {activeSide === "front" ? "Front packaging" : "Back packaging"}
          </figcaption>
        )}
      </figure>

      {hasBack && (
        <div role="tablist" aria-label="Packaging side" className="flex gap-3">
          {(["front", "back"] as const).map((s) => {
            const photo = s === "front" ? product.image : product.backImage;
            const active = activeSide === s;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSide(s)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 bg-[linear-gradient(180deg,#f4eada_0%,#eadcc3_100%)] p-1.5 transition-colors sm:h-24 sm:w-24 ${
                  active ? "border-spice" : "border-turmeric/30 hover:border-turmeric/60"
                }`}
              >
                {photo ? (
                  <Image
                    src={photo.src}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-contain p-1"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] font-medium uppercase tracking-wide text-earth-muted">
                    {s}
                  </span>
                )}
                <span className="sr-only">{s === "front" ? "Show front packaging" : "Show back packaging"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
