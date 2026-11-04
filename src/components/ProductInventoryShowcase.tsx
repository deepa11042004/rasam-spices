"use client";

import type { FocusEvent, MouseEvent } from "react";
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
  /** The real dish photo already paired with this product in src/data/dishes.ts. */
  dish: ShowcaseDish;
};

type ProductInventoryShowcaseProps = {
  items: ShowcaseItem[];
};

function packLine(product: Product): string {
  const sizes = product.packSizes?.join(", ");
  const format = product.packFormat;
  if (sizes && format) return `${sizes} ${format}`;
  return sizes ?? format ?? "";
}

/**
 * Horizontal inventory showcase for the Products page, built after the client's reference
 * design: equal-width cards that redistribute with a single expanded "inventory card" on
 * hover / keyboard focus / tap. Only `flex-grow` is transitioned on desktop (basis and shrink
 * stay constant), so the row's own width never changes -- cards resize into each other rather
 * than causing horizontal overflow or a page reflow. `min-width: 0` on every card lets them
 * shrink past their content's natural size instead of forcing the row wider than its container.
 *
 * Exactly one card is ever expanded: a single `activeId` is the source of truth for every
 * trigger (mouse, keyboard focus, touch), so hover and keyboard can never leave two cards
 * expanded at once.
 */
export default function ProductInventoryShowcase({ items }: ProductInventoryShowcaseProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const activate = (id: string) => setActiveId(id);
  const deactivate = () => setActiveId(null);

  // Tabbing between cards shouldn't flicker the expanded state closed and open again; only
  // collapse once focus has actually left the whole row.
  const handleRowBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (!next || !rowRef.current?.contains(next)) deactivate();
  };

  // On touch devices there is no hover to expand a card first, so the first tap on an
  // inactive card previews it instead of immediately navigating away; tapping it again (now
  // active) or tapping a different card follows the link / switches the preview as normal.
  // Devices that do support hover already have the card expanded before the click lands, so
  // this never intercepts a genuine desktop click.
  const handleCardClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const supportsHover =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (supportsHover) return;
    if (activeId !== id) {
      event.preventDefault();
      activate(id);
    }
  };

  return (
    <div
      ref={rowRef}
      onMouseLeave={deactivate}
      onBlur={handleRowBlur}
      className="mt-10 flex flex-col gap-4 overflow-hidden lg:flex-row"
    >
      {items.map(({ product, dish }) => {
        const isActive = activeId === product.id;
        const dimmed = activeId !== null && !isActive;
        const pack = packLine(product);

        return (
          <article
            key={product.id}
            className={`showcase-card min-w-0 rounded-card ${isActive ? "showcase-card--active" : ""}`}
            style={{ flexGrow: isActive ? 5 : dimmed ? 0.65 : 1 }}
            onMouseEnter={() => activate(product.id)}
          >
            <Link
              href={`/products/${product.id}`}
              onFocus={() => activate(product.id)}
              onClick={(event) => handleCardClick(event, product.id)}
              aria-expanded={isActive}
              className="flex h-full min-h-[300px] flex-col focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-turmeric lg:min-h-[420px] lg:flex-row lg:items-stretch"
            >
              {/* Always-visible core: pack photo, name, and (collapsed) the tagline as the
                  card's short description. */}
              <div className="flex min-w-0 flex-col items-center justify-center p-5 text-center lg:basis-[160px]">
                <div className="w-full max-w-[140px]">
                  <ProductImage onDark product={product} sizes="140px" />
                </div>
                <h3 className="mt-3 line-clamp-2 font-serif text-lg font-semibold text-parchment">
                  {product.name}
                </h3>
                {!isActive && product.tagline && (
                  <p className="mt-1 line-clamp-2 text-xs text-parchment/70">{product.tagline}</p>
                )}
              </div>

              {/* Expanded showcase: full tagline + description, real pack/category facts, and
                  the matching dish photo. Kept in the DOM (not conditionally rendered) so the
                  transition has real content to reveal instead of popping in; collapsed to
                  zero height so it never reserves space on a card that isn't active. */}
              <div
                aria-hidden={!isActive}
                className={`showcase-card__expanded flex min-w-0 flex-1 flex-col justify-center gap-4 overflow-hidden px-5 transition-[max-height,opacity] duration-300 motion-reduce:transition-none lg:flex-row lg:items-center lg:gap-6 lg:px-6 ${
                  isActive
                    ? "max-h-[640px] pb-5 opacity-100 delay-150 lg:py-6"
                    : "pointer-events-none max-h-0 pb-0 opacity-0"
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
                </div>

                <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-[0.6rem] border border-parchment/25 sm:h-48 lg:h-full lg:w-56">
                  <Image
                    src={dish.src}
                    alt={dish.alt}
                    fill
                    sizes="(min-width: 1024px) 224px, 100vw"
                    quality={85}
                    className="object-cover"
                    style={{
                      objectPosition: dish.focus ?? "50% 50%",
                      transform: dish.zoom ? `scale(${dish.zoom})` : undefined,
                    }}
                  />
                </div>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
