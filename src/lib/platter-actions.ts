"use server";

/**
 * Admin action for the homepage dish platter configuration.
 *
 * Writes only the configuration row in SiteContent. Product records are never
 * touched, so removing a product from the platter cannot hide or delete it.
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionAdmin } from "@/lib/admin-session";
import type { ActionResult } from "@/lib/enquiry-constants";
import {
  MAX_PLATTER_DISHES,
  PLATTER_CATEGORY,
  PLATTER_CONFIG_KEY,
  serializePlatterConfig,
} from "@/lib/dish-platter";

export async function savePlatterConfig(input: {
  enabled: boolean;
  productSlugs: string[];
}): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };

  try {
    const requested = Array.isArray(input?.productSlugs)
      ? [
          ...new Set(
            input.productSlugs.filter(
              (s): s is string => typeof s === "string" && s.length > 0,
            ),
          ),
        ]
      : [];

    if (requested.length > MAX_PLATTER_DISHES) {
      return {
        ok: false,
        message: `The platter holds at most ${MAX_PLATTER_DISHES} dishes.`,
      };
    }

    // Re-check eligibility server-side: the browser list could be stale, and a
    // product may have been hidden or recategorised since the page loaded.
    if (requested.length > 0) {
      const valid = await prisma.product.findMany({
        where: {
          slug: { in: requested },
          category: PLATTER_CATEGORY,
          isVisible: true,
        },
        select: { slug: true },
      });

      const validSlugs = new Set(valid.map((v) => v.slug));
      const rejected = requested.filter((s) => !validSlugs.has(s));
      if (rejected.length > 0) {
        return {
          ok: false,
          message:
            "Some selected products are no longer visible blended masalas. Reload the page and try again.",
        };
      }
    }

    const content = serializePlatterConfig({
      enabled: Boolean(input?.enabled),
      productSlugs: requested,
    });

    await prisma.siteContent.upsert({
      where: { key: PLATTER_CONFIG_KEY },
      update: { content, title: "Homepage Dish Platter" },
      create: { key: PLATTER_CONFIG_KEY, title: "Homepage Dish Platter", content },
    });

    // Refresh the homepage so the platter reflects the new configuration.
    revalidatePath("/");
    revalidatePath("/admin/dish-platter");

    return { ok: true, message: "Platter saved" };
  } catch (err) {
    // The existing saved configuration is left untouched on failure.
    console.error("[savePlatterConfig]", err);
    return { ok: false, message: "Could not save the platter. Please try again." };
  }
}
