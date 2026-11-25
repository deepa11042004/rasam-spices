"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import DishPlatter from "@/components/DishPlatter";
import FeaturedMasala from "@/components/FeaturedMasala";
import type { DishEntry } from "@/data/dishes";
import type { Product } from "@/data/products";

export type DishStageItem = { dish: DishEntry; product: Product | null };

/**
 * Holds the one piece of state that keeps food and masala in step: `selected` (an index, or null for
 * the six-dish view). The plate and the featured masala both read it, so they can never disagree.
 */
export default function DishDiscovery({ items }: { items: DishStageItem[] }) {
  const count = items.length;
  const [selected, setSelected] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [opened, setOpened] = useState(false);
  // Visibility of the platter: the endless rotation pauses while it is off screen, and the wood texture
  // is only requested once the visitor is within ~900px of it (it is far below the fold).
  const stageRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [near, setNear] = useState(false);

  const select = useCallback((index: number) => {
    setDirection(1);
    setOpened(true);
    setSelected(index);
  }, []);

  const step = useCallback(
    (delta: 1 | -1) => {
      setDirection(delta);
      setOpened(false);
      setSelected((current) => (current === null ? 0 : (current + delta + count) % count));
    },
    [count],
  );

  const reset = useCallback(() => setSelected(null), []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const live = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "150px 0px" });
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          preload.disconnect();
        }
      },
      { rootMargin: "900px 0px" },
    );
    live.observe(el);
    preload.observe(el);
    return () => {
      live.disconnect();
      preload.disconnect();
    };
  }, []);

  // Escape returns to the six-dish view.
  useEffect(() => {
    if (selected === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const isSelected = selected !== null;
  return (
    <section
      aria-label="Dishes and the RASAM masalas that make them"
      className="relative py-12 sm:py-16 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div ref={stageRef} className="dish-stage relative" data-sel={isSelected ? "true" : "false"} data-visible={visible} data-near={near}>
          <div className="grid items-center lg:grid-cols-2">
            <div className="dish-slot">
              <DishPlatter
                items={items}
                selected={selected}
                onSelect={select}
                onReset={reset}
              />
            </div>

            <div className="dish-panel">
              {selected !== null ? (
                <FeaturedMasala
                  item={items[selected]}
                  index={selected}
                  count={count}
                  direction={direction}
                  justOpened={opened}
                  previous={items[(selected - 1 + count) % count]}
                  next={items[(selected + 1) % count]}
                  onPrevious={() => step(-1)}
                  onNext={() => step(1)}
                />
              ) : (
                /* Default state (no dish picked yet): the homepage's introduction to Blended
                   Masalas, beside the platter. Replaced by the FeaturedMasala panel above once a
                   dish is selected, same as before. */
                <div className="mx-auto max-w-md px-2 text-center lg:px-8 lg:text-left">
                  <p className="eyebrow eyebrow-light">Blended masalas</p>
                  <h3 className="display-heading mt-4 text-4xl text-parchment sm:text-5xl">
                    Blended Masale
                  </h3>
                  <p className="mt-5 text-lg leading-8 text-parchment/80">
                    Ready spice blends for classic dishes from across India. Pick a dish on the
                    platter to see the masala behind it, or browse the full range.
                  </p>
                  <Link href="/products#blended-masalas" className="btn btn-light mt-8">
                    View All Blended Masalas
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
