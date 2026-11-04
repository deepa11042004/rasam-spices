"use client";

import type { FocusEvent, KeyboardEvent, MouseEvent } from "react";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { getCategory, type Product } from "@/data/products";

export type ShowcaseDish = {
  src: string;
  alt: string;
  focus?: string;
  zoom?: number;
};

export type ShowcaseItem = {
  product: Product;
  /** The real dish photo paired with this product in src/data/productDishPhotos.ts, when one
   *  has been supplied yet. A product with none still appears, with a clearly labelled
   *  placeholder in place of the photo -- never an invented path or a reused, unrelated image. */
  dish?: ShowcaseDish;
};

type ProductInventoryShowcaseProps = {
  items: ShowcaseItem[];
};

type Tier = "base" | "preview" | "pinned" | "dimmed-preview" | "dimmed-pinned";

function packLine(product: Product): string {
  const sizes = product.packSizes?.join(", ");
  const format = product.packFormat;
  if (sizes && format) return `${sizes} ${format}`;
  return sizes ?? format ?? "";
}

// How much of the row's free space each tier claims. Basis is fixed at 0% in CSS (.showcase-card),
// so these ratios are the ONLY thing driving each card's width -- without that fixed basis, cards
// size to their content first and leave almost no free space for these ratios to redistribute.
// Tuned for the 9 blended masalas: the previewed / pinned card needs enough room for a readable
// description column (and, once pinned, the dish photo), so neighbours shrink to a slim strip
// that shows the pack and a vertical name label instead of a squeezed horizontal one.
const FLEX_GROW: Record<Tier, number> = {
  base: 1,
  preview: 5,
  pinned: 7,
  "dimmed-preview": 0.5,
  "dimmed-pinned": 0.4,
};

/**
 * Horizontal inventory showcase for the Products page: equal-width cards by default, a medium
 * hover/focus "preview" (tagline, description, highlights -- no dish photo yet), and a larger
 * click/tap "pinned" showcase (adds the matching dish photo and a link to the full product
 * page) that stays open until another card is picked or it is explicitly closed.
 *
 * A click or tap always means "toggle this card's pinned state" -- it never navigates by
 * itself, on desktop or mobile alike, so the same handler covers both. Real navigation to
 * `/products/[id]` only happens through the explicit "View full product details" link that
 * appears once a card is pinned, which is why the card's own wrapper is a `role="button"` div
 * rather than a `<Link>`: a real `<a>` cannot contain another interactive `<a>` or `<button>`.
 */
export default function ProductInventoryShowcase({ items }: ProductInventoryShowcaseProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const preview = (id: string) => {
    if (!pinnedId) setHoveredId(id);
  };
  const clearPreview = () => setHoveredId(null);

  const togglePin = (id: string) => setPinnedId((current) => (current === id ? null : id));
  const closePin = () => setPinnedId(null);

  // Tabbing between cards shouldn't flicker the preview closed and open again; only clear it
  // once focus has actually left the whole row. A pinned card is never cleared by blur -- only
  // picking another card or the explicit close button changes it.
  const handleRowBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (!next || !rowRef.current?.contains(next)) clearPreview();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePin(id);
    }
  };

  return (
    <div
      ref={rowRef}
      onMouseLeave={clearPreview}
      onBlur={handleRowBlur}
      className="mt-10 flex flex-col gap-4 overflow-hidden lg:flex-row lg:gap-3"
    >
      {items.map(({ product, dish }) => {
        const isPinned = pinnedId === product.id;
        const isPreview = !pinnedId && hoveredId === product.id;
        const tier: Tier = isPinned
          ? "pinned"
          : pinnedId
            ? "dimmed-pinned"
            : isPreview
              ? "preview"
              : hoveredId
                ? "dimmed-preview"
                : "base";
        const expanded = isPinned || isPreview;
        const dimmed = tier === "dimmed-preview" || tier === "dimmed-pinned";
        const pack = packLine(product);

        return (
          <article
            key={product.id}
            className={`showcase-card min-w-0 rounded-card ${isPinned ? "showcase-card--active" : ""}`}
            style={{ flexGrow: FLEX_GROW[tier] }}
            onMouseEnter={() => preview(product.id)}
          >
            {/* The whole card is the toggle target (click/tap/Enter pins or unpins it); it is a
                div, not a button or link, so it can legally contain the real link and close
                button that appear once pinned. */}
            <div
              role="button"
              tabIndex={0}
              aria-expanded={expanded}
              aria-pressed={isPinned}
              aria-label={`${product.name}: ${isPinned ? "expanded, press to collapse" : "press to expand"}`}
              onFocus={() => preview(product.id)}
              onClick={() => togglePin(product.id)}
              onKeyDown={(event) => handleKeyDown(event, product.id)}
              className="flex h-full min-h-[300px] w-full min-w-0 cursor-pointer flex-col focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-turmeric lg:min-h-[420px] lg:flex-row lg:items-stretch"
            >
              {/* Always-visible core: pack photo, name, and (collapsed) the tagline as the
                  card's short description. Names wrap only between whole words and are never
                  line-clamped; on desktop a slim neighbour strip turns the name into a vertical
                  label so it stays fully readable without breaking a word. */}
              <div
                className={`flex min-w-0 flex-col items-center justify-center p-5 text-center lg:basis-[160px] ${
                  dimmed ? "lg:px-1.5" : "lg:px-3"
                }`}
              >
                <div className="w-full max-w-[140px]">
                  <ProductImage onDark product={product} sizes="140px" />
                </div>
                <h3
                  className={`mt-3 font-serif text-lg font-semibold leading-snug text-parchment lg:text-[15px] ${
                    dimmed ? "lg:rotate-180 lg:whitespace-nowrap lg:text-sm lg:[writing-mode:vertical-rl]" : ""
                  }`}
                >
                  {product.name}
                </h3>
                {!expanded && product.tagline && (
                  <p className={`mt-1 line-clamp-2 text-xs text-parchment/70 ${dimmed ? "lg:hidden" : ""}`}>
                    {product.tagline}
                  </p>
                )}
              </div>

              {/* Preview + pinned showcase: full tagline, description and real pack/category
                  facts appear from the "preview" tier up; the dish photo, the explicit link to
                  the full product page and the close control only appear once pinned. Kept in
                  the DOM throughout (not conditionally rendered) so the width/height transition
                  has real content to reveal instead of popping in; collapsed to zero height so
                  it never reserves space on a card that is neither previewed nor pinned. */}
              <div
                aria-hidden={!expanded}
                className={`showcase-card__expanded flex min-w-0 flex-col justify-center gap-4 overflow-hidden transition-[max-height,opacity] duration-300 motion-reduce:transition-none lg:flex-row lg:items-center lg:gap-6 ${
                  expanded
                    ? "max-h-[640px] flex-1 px-5 pb-5 opacity-100 delay-150 lg:px-6 lg:py-6"
                    : "pointer-events-none max-h-0 flex-none p-0 opacity-0 lg:w-0"
                }`}
              >
                <div className="min-w-0 flex-1">
                  {product.tagline && (
                    <p className="text-sm font-semibold uppercase tracking-[0.1em] text-turmeric">
                      {product.tagline}
                    </p>
                  )}
                  {product.description && (
                    <p className="mt-2 line-clamp-4 text-sm leading-6 text-parchment/85 lg:line-clamp-5">
                      {product.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-parchment/70">
                    <span>{getCategory(product.category).name}</span>
                    {pack && (
                      <>
                        <span aria-hidden="true" className="text-turmeric/50">
                          &bull;
                        </span>
                        <span>{pack}</span>
                      </>
                    )}
                  </div>

                  {isPinned ? (
                    <Link
                      href={`/products/${product.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-parchment underline decoration-turmeric/50 underline-offset-4 transition-colors hover:text-turmeric hover:decoration-turmeric focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric"
                    >
                      View full product details
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  ) : (
                    isPreview && (
                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-parchment/60">
                        Click to see more
                      </p>
                    )
                  )}
                </div>

                {isPinned && (
                  <div className="relative flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-[0.6rem] border border-parchment/25 bg-charcoal/20 sm:h-48 lg:h-full lg:w-[36%]">
                    {dish ? (
                      <Image
                        src={dish.src}
                        alt={dish.alt}
                        fill
                        sizes="(min-width: 1024px) 320px, 100vw"
                        quality={90}
                        className="object-cover"
                        style={{
                          objectPosition: dish.focus ?? "50% 50%",
                          transform: dish.zoom ? `scale(${dish.zoom})` : undefined,
                        }}
                      />
                    ) : (
                      <p className="px-4 text-center text-xs font-medium text-parchment/60">
                        [Dish photo to be added]
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isPinned && (
              <button
                type="button"
                onClick={(event: MouseEvent<HTMLButtonElement>) => {
                  event.stopPropagation();
                  closePin();
                }}
                aria-label={`Close ${product.name} details`}
                className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-parchment/40 bg-charcoal/40 text-parchment transition-colors hover:border-turmeric hover:text-turmeric focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
