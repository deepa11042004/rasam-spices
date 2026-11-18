"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { savePlatterConfig } from "@/lib/platter-actions";
import { buttonClass, Card, EmptyState, SectionHeading } from "@/components/admin/ui";

export type PlatterProductOption = {
  id: string;
  slug: string;
  name: string;
  imageSrc: string | null;
  dishSrc: string | null;
};

interface Props {
  maxDishes: number;
  initialEnabled: boolean;
  /** Saved slugs, in platter order. */
  initialSelected: string[];
  /** Every visible blended masala, the only products eligible for the platter. */
  products: PlatterProductOption[];
}

export default function DishPlatterManager({
  maxDishes,
  initialEnabled,
  initialSelected,
  products,
}: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  // Order matters, so selection is an array rather than a Set.
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const atLimit = selected.length >= maxDishes;

  function toggle(slug: string) {
    setFeedback(null);
    setSelected((current) =>
      current.includes(slug)
        ? current.filter((s) => s !== slug)
        : current.length >= maxDishes
          ? current
          : [...current, slug],
    );
  }

  function move(slug: string, delta: -1 | 1) {
    setFeedback(null);
    setSelected((current) => {
      const i = current.indexOf(slug);
      const j = i + delta;
      if (i === -1 || j < 0 || j >= current.length) return current;
      const next = [...current];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function handleSave() {
    if (isPending) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await savePlatterConfig({ enabled, productSlugs: selected });
      setFeedback({
        ok: result.ok,
        message: result.ok ? (result.message ?? "Saved") : result.message,
      });
    });
  }

  return (
    <div className="space-y-8">
      {/* ---- Master toggle ---- */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-admin-ink">
              Show Dish Platter on Homepage
            </h2>
            <p className="mt-0.5 text-xs text-admin-ink-muted">
              Turning this off hides the whole platter section. Your dish
              selections are kept.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => {
              setEnabled((v) => !v);
              setFeedback(null);
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-spice ${
              enabled ? "bg-admin-spice" : "bg-admin-border-strong"
            }`}
          >
            <span className="sr-only">Show dish platter on homepage</span>
            <span
              aria-hidden="true"
              className={`pointer-events-none mt-0.5 inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </Card>

      {/* ---- Selection ---- */}
      <section>
        <SectionHeading
          title="Select Blended Masalas"
          note="Only visible products in the Blended Masalas category can appear on the platter."
          actions={
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                atLimit
                  ? "bg-admin-spice/10 text-admin-spice"
                  : "bg-admin-cream text-admin-ink-muted"
              }`}
            >
              {selected.length} of {maxDishes} selected
            </span>
          }
        />

        {products.length === 0 ? (
          <EmptyState
            title="No eligible products"
            description="The platter needs visible products in the Blended Masalas category."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const isOn = selected.includes(product.slug);
              const blocked = !isOn && atLimit;
              return (
                <button
                  key={product.slug}
                  type="button"
                  onClick={() => toggle(product.slug)}
                  disabled={blocked}
                  aria-pressed={isOn}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    isOn
                      ? "border-admin-spice bg-admin-spice/5"
                      : "border-admin-border bg-admin-surface hover:bg-admin-cream/50"
                  } ${blocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-admin-cream">
                    {product.imageSrc && (
                      <Image
                        src={product.imageSrc}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-admin-ink">
                      {product.name}
                    </span>
                    <span className="block text-xs text-admin-ink-muted">
                      {product.dishSrc ? "Dish photo ready" : "No dish photo yet"}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                      isOn
                        ? "border-admin-spice bg-admin-spice text-white"
                        : "border-admin-border-strong bg-white"
                    }`}
                  >
                    {isOn ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {atLimit && (
          <p className="mt-3 text-xs text-admin-ink-muted">
            The platter is full. Remove a dish to select a different one.
          </p>
        )}
      </section>

      {/* ---- Order + preview ---- */}
      <section>
        <SectionHeading
          title="Platter order"
          note="The order here is the order shown on the homepage, clockwise from the top."
        />

        {selected.length === 0 ? (
          <EmptyState
            title="No dishes selected"
            description="Select at least one blended masala above to build the platter."
          />
        ) : (
          <ol className="space-y-2">
            {selected.map((slug, index) => {
              const product = bySlug.get(slug);
              return (
                <li
                  key={slug}
                  className="flex items-center gap-3 rounded-lg border border-admin-border bg-admin-surface p-3"
                >
                  <span className="w-5 shrink-0 text-center text-xs font-semibold text-admin-ink-muted">
                    {index + 1}
                  </span>

                  {/* Preview uses the real dish photograph, never packaging. */}
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-admin-gold/50 bg-admin-cream">
                    {product?.dishSrc && (
                      <Image
                        src={product.dishSrc}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-admin-ink">
                      {product?.name ?? slug}
                    </span>
                    {!product?.dishSrc && (
                      <span className="block text-xs text-admin-ink-muted">
                        No dish photo — this dish will be skipped on the homepage.
                      </span>
                    )}
                  </span>

                  <span className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => move(slug, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${product?.name ?? slug} up`}
                      className="rounded-md border border-admin-border px-2 py-1 text-xs text-admin-ink-muted hover:bg-admin-cream disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(slug, 1)}
                      disabled={index === selected.length - 1}
                      aria-label={`Move ${product?.name ?? slug} down`}
                      className="rounded-md border border-admin-border px-2 py-1 text-xs text-admin-ink-muted hover:bg-admin-cream disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(slug)}
                      aria-label={`Remove ${product?.name ?? slug} from the platter`}
                      className="rounded-md border border-admin-border px-2 py-1 text-xs text-admin-ink-muted hover:bg-admin-cream"
                    >
                      Remove
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ---- Save ---- */}
      <div className="flex flex-wrap items-center gap-3 border-t border-admin-border pt-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className={buttonClass.primary}
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
        {feedback && (
          <span
            role={feedback.ok ? "status" : "alert"}
            className={`text-sm ${feedback.ok ? "text-green-700" : "text-red-700"}`}
          >
            {feedback.message}
          </span>
        )}
      </div>
    </div>
  );
}
