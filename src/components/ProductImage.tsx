import Image from "next/image";
import type { Product } from "@/data/products";

type ProductImageProps = {
  product: Product;
  /** Which face of the pack to show. Defaults to the front. */
  side?: "front" | "back";
  /** Tells the browser how wide the image is drawn, so it can pick a smaller file. */
  sizes: string;
  className?: string;
  /** Set when the image sits on a dark surface, so the placeholder text stays readable. */
  onDark?: boolean;
};

/**
 * Shows an authentic pack photo inside a fixed 4:5 frame. When no photo is
 * set on the product yet, a plain, wordless jar silhouette fills the same
 * frame instead, so the layout never shifts once a real photo is added.
 */
export default function ProductImage({
  product,
  side = "front",
  sizes,
  className = "",
  onDark = false,
}: ProductImageProps) {
  const photo = side === "back" ? product.backImage : product.image;

  return (
    <div className={`relative aspect-[4/5] w-full ${className}`}>
      {photo ? (
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} quality={90} className="object-contain" />
      ) : (
        <div className="absolute inset-[18%] flex items-center justify-center" aria-hidden="true">
          <svg
            viewBox="0 0 64 80"
            className={`h-full w-full ${onDark ? "text-parchment/25" : "text-earth/15"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          >
            <path d="M22 6h20v8H22z" />
            <path d="M18 14h28l4 8v48a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V22z" />
            <path d="M14 30h36" />
          </svg>
        </div>
      )}
    </div>
  );
}
