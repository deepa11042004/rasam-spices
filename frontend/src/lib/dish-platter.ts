/**
 * Homepage dish platter configuration.
 *
 * Which products appear on the platter, in what order, and whether the
 * section shows at all. The configuration is stored by the backend; this
 * module adds the website's presentation rules on top of it.
 *
 * The product records themselves remain the source of truth for name,
 * category, visibility and the prepared-dish image. src/data/dishes.ts is
 * kept as the seed for the initial configuration and as the fallback source
 * of dish photographs for products that have never had one uploaded.
 */
import { cache } from "react";
import { api, rethrowNextSignal } from "@/lib/api";
import { DISH_SLICE_COUNT, dishes, type DishEntry } from "@/data/dishes";

/** The platter's geometry tops out at six wedges. */
export const MAX_PLATTER_DISHES = DISH_SLICE_COUNT;

export type PlatterConfig = {
  enabled: boolean;
  /** Product slugs, in the order they appear on the platter. */
  productSlugs: string[];
};

/** Seeded from the dishes currently hard-coded for the platter. */
export function defaultPlatterConfig(): PlatterConfig {
  return {
    enabled: true,
    productSlugs: dishes.map((dish) => dish.productId),
  };
}

/**
 * Read the saved configuration, falling back to the dishes currently in
 * src/data/dishes.ts so the platter is never empty before an admin has saved
 * anything. A malformed or missing row resolves to that same default.
 */
export const getPlatterConfig = cache(async (): Promise<PlatterConfig> => {
  try {
    const { config } = await api<{ config: PlatterConfig | null }>("/api/platter/config");
    return config ?? defaultPlatterConfig();
  } catch (err) {
    rethrowNextSignal(err);
    console.error("[getPlatterConfig]", err);
    return defaultPlatterConfig();
  }
});

// ---------------------------------------------------------------------------
// Eligible products (admin picker)
// ---------------------------------------------------------------------------

export type EligibleProduct = {
  id: string;
  slug: string;
  name: string;
  /** Packaging photo, used only to identify the product in the admin list. */
  imageSrc: string | null;
  /** Prepared-dish photo: uploaded, else the static fallback, else null. */
  dishSrc: string | null;
};

/** Static dish photo for a product slug, if src/data/dishes.ts has one. */
function staticDishFor(slug: string): DishEntry | undefined {
  return dishes.find((dish) => dish.productId === slug);
}

/**
 * Products an admin may put on the platter: visible blended masalas that have
 * a slug. A newly created eligible product appears here automatically, and is
 * never selected by default.
 */
export async function getEligiblePlatterProducts(): Promise<EligibleProduct[]> {
  const records = await api<
    {
      id: string;
      slug: string | null;
      name: string;
      imageSrc: string | null;
      dishPhotoSrc: string | null;
    }[]
  >("/api/admin/platter/eligible", { admin: true });

  return records.map((r) => {
    const slug = r.slug as string;
    return {
      id: r.id,
      slug,
      name: r.name,
      imageSrc: r.imageSrc,
      // Uploaded dish photo wins; the static entry is the fallback. Packaging
      // is deliberately never used as a prepared-dish photograph.
      dishSrc: r.dishPhotoSrc ?? staticDishFor(slug)?.src ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Public platter resolution
// ---------------------------------------------------------------------------

/** A dish ready for the platter, shaped like the existing DishEntry. */
export type ResolvedDish = DishEntry;

/**
 * The dishes the public platter should render, or null when the section is
 * switched off.
 *
 * Products that have become hidden, been deleted, or moved out of the blended
 * masalas category simply drop out, because the backend re-checks eligibility
 * rather than trusting the saved slug list. A product with no dish photograph
 * at all is skipped too, since a wedge cannot render without one.
 */
export async function getPlatterDishes(): Promise<ResolvedDish[] | null> {
  const config = await getPlatterConfig();
  if (!config.enabled) return null;
  if (config.productSlugs.length === 0) return [];

  const records = await api<
    { slug: string | null; name: string; dishPhotoSrc: string | null }[]
  >("/api/platter/products", { query: { slugs: config.productSlugs.join(",") } });

  const bySlug = new Map(records.map((r) => [r.slug as string, r]));

  const resolved: ResolvedDish[] = [];
  for (const slug of config.productSlugs) {
    const record = bySlug.get(slug);
    if (!record) continue; // hidden, deleted or no longer a blended masala

    const fallback = staticDishFor(slug);
    const src = record.dishPhotoSrc ?? fallback?.src;
    if (!src) continue; // nothing to show in the wedge

    resolved.push({
      // Keep the static entry's id so React keys stay stable where it exists.
      id: fallback?.id ?? slug,
      name: fallback?.name ?? record.name,
      src,
      alt: record.dishPhotoSrc
        ? `${record.name} prepared dish`
        : (fallback?.alt ?? `${record.name} prepared dish`),
      // Framing hints only apply to the curated static photos.
      focus: record.dishPhotoSrc ? undefined : fallback?.focus,
      zoom: record.dishPhotoSrc ? undefined : fallback?.zoom,
      productId: slug,
    });
  }

  return resolved.slice(0, MAX_PLATTER_DISHES);
}
