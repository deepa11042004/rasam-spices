/**
 * Homepage dish platter configuration.
 *
 * Which products appear on the platter, in what order, and whether the
 * section shows at all. This is configuration, not catalogue data: it lives
 * in the existing SiteContent key/value table under PLATTER_CONFIG_KEY, so
 * removing a product from the platter never touches the product record, and
 * no schema change was required.
 *
 * The product records themselves remain the source of truth for name,
 * category, visibility and the prepared-dish image. src/data/dishes.ts is
 * kept as the seed for the initial configuration and as the fallback source
 * of dish photographs for products that have never had one uploaded.
 */
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DISH_SLICE_COUNT, dishes, type DishEntry } from "@/data/dishes";

export const PLATTER_CONFIG_KEY = "homepage.dishPlatter";

/** The platter's geometry tops out at six wedges. */
export const MAX_PLATTER_DISHES = DISH_SLICE_COUNT;

/** Only this category may appear on the platter. */
export const PLATTER_CATEGORY = "blended-masalas";

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

function parseConfig(raw: string | null | undefined): PlatterConfig | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;

    const slugs = Array.isArray(obj.productSlugs)
      ? obj.productSlugs
          .filter((s): s is string => typeof s === "string" && s.length > 0)
          .slice(0, MAX_PLATTER_DISHES)
      : [];

    return {
      enabled: obj.enabled !== false, // default on
      productSlugs: [...new Set(slugs)], // never the same product twice
    };
  } catch {
    return null;
  }
}

export function serializePlatterConfig(config: PlatterConfig): string {
  return JSON.stringify({
    enabled: Boolean(config.enabled),
    productSlugs: [...new Set(config.productSlugs)].slice(0, MAX_PLATTER_DISHES),
  });
}

/**
 * Read the saved configuration, falling back to the dishes currently in
 * src/data/dishes.ts so the platter is never empty before an admin has saved
 * anything. A malformed or missing row resolves to that same default.
 */
export const getPlatterConfig = cache(async (): Promise<PlatterConfig> => {
  try {
    const row = await prisma.siteContent.findUnique({
      where: { key: PLATTER_CONFIG_KEY },
      select: { content: true },
    });
    return parseConfig(row?.content) ?? defaultPlatterConfig();
  } catch (err) {
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
  const records = await prisma.product.findMany({
    where: {
      category: PLATTER_CATEGORY,
      isVisible: true,
      slug: { not: null },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      imageSrc: true,
      dishPhotoSrc: true,
    },
  });

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
 * masalas category simply drop out, because the query re-checks eligibility
 * rather than trusting the saved slug list. A product with no dish photograph
 * at all is skipped too, since a wedge cannot render without one.
 */
export async function getPlatterDishes(): Promise<ResolvedDish[] | null> {
  const config = await getPlatterConfig();
  if (!config.enabled) return null;
  if (config.productSlugs.length === 0) return [];

  const records = await prisma.product.findMany({
    where: {
      slug: { in: config.productSlugs },
      category: PLATTER_CATEGORY,
      isVisible: true,
    },
    select: { slug: true, name: true, dishPhotoSrc: true },
  });

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
