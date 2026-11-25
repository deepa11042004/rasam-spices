/**
 * Homepage dish platter configuration.
 *
 * Which products appear on the platter, in what order, and whether the section
 * shows at all. Stored as JSON in the existing SiteContent key/value table, so
 * removing a product from the platter never touches the product record.
 *
 * The backend only deals in data: the default selection and the static dish
 * photograph fallbacks live with the website's presentation code in the
 * frontend.
 */
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/sanitize";

export const PLATTER_CONFIG_KEY = "homepage.dishPlatter";

/** The platter's geometry tops out at six wedges. */
export const MAX_PLATTER_DISHES = 6;

/** Only this category may appear on the platter. */
export const PLATTER_CATEGORY = "blended-masalas";

export type PlatterConfig = {
  enabled: boolean;
  /** Product slugs, in the order they appear on the platter. */
  productSlugs: string[];
};

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

    return { enabled: obj.enabled !== false, productSlugs: [...new Set(slugs)] };
  } catch {
    return null;
  }
}

function serializeConfig(config: PlatterConfig): string {
  return JSON.stringify({
    enabled: Boolean(config.enabled),
    productSlugs: [...new Set(config.productSlugs)].slice(0, MAX_PLATTER_DISHES),
  });
}

/** The saved configuration, or null when none was saved or it is malformed. */
export async function getSavedConfig(): Promise<PlatterConfig | null> {
  const row = await prisma.siteContent.findUnique({
    where: { key: PLATTER_CONFIG_KEY },
    select: { content: true },
  });
  return parseConfig(row?.content);
}

/**
 * Visible blended masalas among the given slugs. Re-checks eligibility rather
 * than trusting a saved slug list, so hidden or recategorised products drop out.
 */
export function listPlatterProducts(slugs: string[]) {
  if (slugs.length === 0) return Promise.resolve([]);
  return prisma.product.findMany({
    where: { slug: { in: slugs }, category: PLATTER_CATEGORY, isVisible: true },
    select: { slug: true, name: true, dishPhotoSrc: true },
  });
}

/** Products an admin may put on the platter: visible blended masalas with a slug. */
export function listEligibleProducts() {
  return prisma.product.findMany({
    where: { category: PLATTER_CATEGORY, isVisible: true, slug: { not: null } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, imageSrc: true, dishPhotoSrc: true },
  });
}

export async function saveConfig(input: {
  enabled: boolean;
  productSlugs: string[];
}): Promise<ActionResult> {
  try {
    const requested = Array.isArray(input?.productSlugs)
      ? [
          ...new Set(
            input.productSlugs.filter((s): s is string => typeof s === "string" && s.length > 0),
          ),
        ]
      : [];

    if (requested.length > MAX_PLATTER_DISHES) {
      return { ok: false, message: `The platter holds at most ${MAX_PLATTER_DISHES} dishes.` };
    }

    // The browser's list could be stale: re-check eligibility on the server.
    if (requested.length > 0) {
      const valid = await listPlatterProducts(requested);
      const validSlugs = new Set(valid.map((v) => v.slug));
      if (requested.some((s) => !validSlugs.has(s))) {
        return {
          ok: false,
          message:
            "Some selected products are no longer visible blended masalas. Reload the page and try again.",
        };
      }
    }

    const content = serializeConfig({
      enabled: Boolean(input?.enabled),
      productSlugs: requested,
    });

    await prisma.siteContent.upsert({
      where: { key: PLATTER_CONFIG_KEY },
      update: { content, title: "Homepage Dish Platter" },
      create: { key: PLATTER_CONFIG_KEY, title: "Homepage Dish Platter", content },
    });

    return { ok: true, message: "Platter saved" };
  } catch (err) {
    console.error("[savePlatterConfig]", err);
    return { ok: false, message: "Could not save the platter. Please try again." };
  }
}
