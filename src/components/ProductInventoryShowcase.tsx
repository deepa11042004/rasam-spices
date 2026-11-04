"use client";

import type { CSSProperties, FocusEvent, KeyboardEvent, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  /** A verified food / dish / usage photo for this product (src/data/productDishPhotos.ts), when
   *  one exists. Without one the pinned panel simply shows the pack and the product details --
   *  never an invented path or a reused, unrelated image. */
  dish?: ShowcaseDish;
};

type ProductInventoryShowcaseProps = {
  items: ShowcaseItem[];
  /** Accessible name for the row, e.g. "Ground Spices products". */
  label: string;
};

type Tier = "base" | "preview" | "pinned" | "dimmed-preview" | "dimmed-pinned";

function packLine(product: Product): string {
  const sizes = product.packSizes?.join(", ");
  const format = product.packFormat;
  if (sizes && format) return `${sizes} ${format}`;
  return sizes ?? format ?? "";
}

// How much of the row's width each tier claims. flex-basis is fixed at 0% in CSS (.showcase-card),
// so these ratios alone drive each card's width. The previewed / pinned card gets enough room for
// a readable description column (and, once pinned, the dish photo); neighbours shrink to a slim
// strip that shows the pack and a vertical whole-word name label.
const FLEX_GROW: Record<Tier, number> = {
  base: 1,
  preview: 5,
  pinned: 7,
  "dimmed-preview": 0.5,
  "dimmed-pinned": 0.4,
};

/**
 * Interactive inventory row used by every category on the Products page.
 *
 * - Hover / keyboard focus: temporary "preview" (tagline, description, pack facts).
 * - First click / tap / Enter: pins the card open (adds the verified dish photo when one exists).
 * - Second click / tap / Enter on the SAME pinned card: opens its existing /products/[id] page.
 * - Click another card: switches the pinned product; it needs its own second click to navigate.
 * - Close button: collapses back to equal cards without navigating.
 *
 * On desktop the row never shrinks cards below a readable minimum (see .showcase-row in
 * globals.css); when the category has more cards than fit, the row scrolls horizontally inside its
 * own container instead, so the page itself never overflows. Below `lg` the cards stack.
 */
export default function ProductInventoryShowcase({ items, label }: ProductInventoryShowcaseProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const preview = (id: string) => {
    if (!pinnedId) setHoveredId(id);
  };
  const clearPreview = () => setHoveredId(null);
  const closePin = () => setPinnedId(null);

  // First activation pins; activating the already-pinned card opens its product page.
  const activate = (id: string) => {
    if (pinnedId === id) {
      router.push(`/products/${id}`);
      return;
    }
    setHoveredId(null);
    setPinnedId(id);
  };

  // Once the pinned card has finished growing, make sure it is fully inside the scroll area.
  useEffect(() => {
    if (!pinnedId) return;
    const scroller = scrollerRef.current;
    const card = rowRef.current?.querySelector<HTMLElement>(`[data-product-id="${pinnedId}"]`);
    if (!scroller || !card || scroller.scrollWidth <= scroller.clientWidth) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(
      () => {
        const left = card.offsetLeft - scroller.offsetLeft;
        const right = left + card.offsetWidth;
        const viewLeft = scroller.scrollLeft;
        const viewRight = viewLeft + scroller.clientWidth;
        if (left >= viewLeft && right <= viewRight) return;
        const target = right > viewRight ? right - scroller.clientWidth + 16 : left - 16;
        scroller.scrollTo({ left: Math.max(0, target), behavior: reduceMotion ? "auto" : "smooth" });
      },
      reduceMotion ? 0 : 600,
    );
    return () => window.clearTimeout(timer);
  }, [pinnedId]);

  // Tabbing between cards shouldn't flicker the preview closed and open again; only clear it
  // once focus has actually left the whole row. A pinned card is never cleared by blur.
  const handleRowBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (!next || !rowRef.current?.contains(next)) clearPreview();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (event.target !== event.currentTarget) return; // let the inner link / button handle their own keys
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate(id);
    }
  };

  return (
    <div ref={scrollerRef} className="showcase-scroller mt-10">
      <div
        ref={rowRef}
        role="group"
        aria-label={label}
        onMouseLeave={clearPreview}
        onBlur={handleRowBlur}
        className="showcase-row flex flex-col gap-4 lg:flex-row"
        style={{ "--showcase-count": items.length } as CSSProperties}
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
              id={product.id}
              data-product-id={product.id}
              className={`showcase-card min-w-0 rounded-card ${isPinned ? "showcase-card--active" : ""}`}
              style={{ flexGrow: FLEX_GROW[tier] }}
              onMouseEnter={() => preview(product.id)}
            >
              {/* The whole card is the activation target. It is a div (not a button or link) so it
                  can legally contain the real link and close button shown once pinned. */}
              <div
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                aria-label={
                  isPinned
                    ? `${product.name}: expanded. Activate again to open the product page.`
                    : `${product.name}: show details`
                }
                onFocus={() => preview(product.id)}
                onClick={() => activate(product.id)}
                onKeyDown={(event) => handleKeyDown(event, product.id)}
                className="flex h-full min-h-[320px] w-full min-w-0 cursor-pointer flex-col focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-turmeric lg:min-h-[480px] lg:flex-row lg:items-stretch"
              >
                {/* Pack, name and (collapsed) tagline. Names wrap only between whole words and are
                    never line-clamped; in a slim neighbour strip the name becomes a vertical label. */}
                <div
                  className={`flex min-w-0 flex-col items-center justify-center p-5 text-center ${
                    expanded ? "lg:flex-none lg:basis-[300px] lg:px-6" : dimmed ? "lg:flex-1 lg:px-1.5" : "lg:flex-1 lg:px-4"
                  }`}
                >
                  <div className={`w-full ${expanded ? "max-w-[250px]" : "max-w-[230px]"} ${dimmed ? "lg:[&_span]:hidden" : ""}`}>
                    <ProductImage onDark product={product} sizes="(min-width: 1024px) 250px, 230px" />
                  </div>
                  <h3
                    className={`mt-4 font-serif text-lg font-semibold leading-snug text-parchment ${
                      expanded ? "lg:text-xl" : "lg:text-[17px]"
                    } ${dimmed ? "lg:rotate-180 lg:whitespace-nowrap lg:text-sm lg:[writing-mode:vertical-rl]" : ""}`}
                  >
                    {product.name}
                  </h3>
                  {!expanded && product.tagline && (
                    <p className={`mt-1.5 line-clamp-2 text-xs leading-5 text-parchment/70 ${dimmed ? "lg:hidden" : ""}`}>
                      {product.tagline}
                    </p>
                  )}
                </div>

                {/* Preview + pinned details. Kept in the DOM so the transition has content to reveal;
                    a collapsed panel takes no width or height at all. */}
                <div
                  aria-hidden={!expanded}
                  className={`showcase-card__expanded flex min-w-0 flex-col justify-center gap-5 lg:justify-start overflow-hidden transition-[max-height,opacity] duration-300 motion-reduce:transition-none lg:flex-row lg:items-center lg:gap-8 ${
                    expanded
                      ? "max-h-[1200px] flex-1 px-5 pb-5 opacity-100 delay-150 lg:py-8 lg:pl-2 lg:pr-8"
                      : "pointer-events-none max-h-0 flex-none p-0 opacity-0 lg:w-0"
                  }`}
                >
                  <div className="min-w-0 max-w-2xl flex-1">
                    {product.tagline && (
                      <p className="text-sm font-semibold uppercase tracking-[0.1em] text-turmeric">
                        {product.tagline}
                      </p>
                    )}
                    {product.description && (
                      <p
                        className={`mt-2 text-sm leading-6 text-parchment/85 lg:text-[15px] lg:leading-7 ${
                          isPinned ? "" : "line-clamp-5"
                        }`}
                      >
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

                    {product.pendingNote && (
                      <p className="mt-3 rounded-md border border-turmeric/30 bg-parchment/5 px-3 py-2 text-xs leading-5 text-parchment/75">
                        <span className="font-semibold text-parchment">To be confirmed: </span>
                        {product.pendingNote}
                      </p>
                    )}

                    {isPinned ? (
                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                        <Link
                          href={`/products/${product.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-parchment underline decoration-turmeric/50 underline-offset-4 transition-colors hover:text-turmeric hover:decoration-turmeric focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric"
                        >
                          View full product details
                          <span aria-hidden="true">&rarr;</span>
                        </Link>
                        <Link
                          href="/contact"
                          onClick={(event) => event.stopPropagation()}
                          className="text-xs font-semibold uppercase tracking-[0.14em] text-parchment/70 underline decoration-turmeric/40 underline-offset-4 transition-colors hover:text-turmeric hover:decoration-turmeric focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric"
                        >
                          Enquire about {product.name}
                        </Link>
                      </div>
                    ) : (
                      isPreview && (
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-parchment/60">
                          Click to see more
                        </p>
                      )
                    )}
                  </div>

                  {isPinned && dish && (
                    <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-[0.6rem] border border-parchment/25 sm:h-56 lg:h-auto lg:min-h-[340px] lg:w-[38%] lg:self-stretch">
                      <Image
                        src={dish.src}
                        alt={dish.alt}
                        fill
                        sizes="(min-width: 1024px) 34vw, 100vw"
                        quality={90}
                        className="object-cover"
                        style={{
                          objectPosition: dish.focus ?? "50% 50%",
                          transform: dish.zoom ? `scale(${dish.zoom})` : undefined,
                        }}
                      />
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
                  onKeyDown={(event) => event.stopPropagation()}
                  aria-label={`Close ${product.name} details`}
                  className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-parchment/40 bg-charcoal/50 text-lg text-parchment transition-colors hover:border-turmeric hover:text-turmeric focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
