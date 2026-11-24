import Link from "next/link";
import type { Product } from "@/data/products";

// z-10 lifts the desktop arrows above the PackagingGallery card edge they overlap; the ivory
// ring makes the green button read as a distinct floating element against the gallery panel.
const circleButton =
  "group z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green text-ivory shadow-lift ring-2 ring-parchment transition-colors hover:bg-green-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric sm:h-12 sm:w-12";

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 sm:h-6 sm:w-6"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 sm:h-6 sm:w-6"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function useAdjacent(product: Product, categoryProducts: Product[]) {
  if (categoryProducts.length < 2) return null;
  const index = categoryProducts.findIndex((p) => p.id === product.id);
  if (index === -1) return null;
  return {
    previous: categoryProducts[(index - 1 + categoryProducts.length) % categoryProducts.length],
    next: categoryProducts[(index + 1) % categoryProducts.length],
  };
}

/**
 * Circular previous/next arrows that cycle through the OTHER products in the same category as
 * `product` (same order as the category's inventory listing), wrapping around at either end.
 * Renders nothing when the category has no other product to go to.
 *
 * Two variants, placed by the caller (see `[id]/page.tsx`):
 * - "desktop": absolutely positioned at the left/right edge of a `relative` ancestor the caller
 *   provides, vertically centred with `top-1/2`. Hidden below `md`.
 * - "mobile": a small centred row, meant to sit somewhere that doesn't overlap the gallery or
 *   details (placed under the breadcrumb). Hidden at `md` and up.
 */
export default function ProductPrevNextNav({
  product,
  categoryProducts,
  variant,
}: {
  product: Product;
  categoryProducts: Product[];
  variant: "desktop" | "mobile";
}) {
  const adjacent = useAdjacent(product, categoryProducts);
  if (!adjacent) return null;
  const { previous, next } = adjacent;

  if (variant === "desktop") {
    return (
      <>
        <Link
          href={`/products/${previous.slug ?? previous.id}`}
          aria-label={`Previous product: ${previous.name}`}
          className={`${circleButton} absolute left-0 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex`}
        >
          <ChevronLeftIcon />
        </Link>
        <Link
          href={`/products/${next.slug ?? next.id}`}
          aria-label={`Next product: ${next.name}`}
          className={`${circleButton} absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 md:flex`}
        >
          <ChevronRightIcon />
        </Link>
      </>
    );
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-4 md:hidden">
      <Link href={`/products/${previous.slug ?? previous.id}`} aria-label={`Previous product: ${previous.name}`} className={circleButton}>
        <ChevronLeftIcon />
      </Link>
      <Link href={`/products/${next.slug ?? next.id}`} aria-label={`Next product: ${next.name}`} className={circleButton}>
        <ChevronRightIcon />
      </Link>
    </div>
  );
}
