/**
 * Looks up admin-uploaded dish images for the public dish platter.
 *
 * The platter's dish list stays in src/data/dishes.ts. This only answers the
 * question "has an admin uploaded a photo for this dish's product?", so an
 * uploaded image can override the static one without making the platter
 * database-driven.
 *
 * Join key: a dish's `productId` ("biryani-masala") matches the database
 * product's `slug`, which is generated from the product name. It does NOT
 * match the numeric database `id`.
 */
import { cache } from "react";
import { api, rethrowNextSignal } from "@/lib/api";

/**
 * Map of productId (dish slug) -> uploaded dish image reference.
 *
 * Products with no uploaded image are simply absent from the map, so callers
 * fall back to the static photo. Any backend problem resolves to an empty
 * map rather than throwing: a missing override must never take down the
 * homepage, it just means the static photos are used.
 */
export const getDishImageOverrides = cache(
  async (productIds: readonly string[]): Promise<Map<string, string>> => {
    const slugs = [...new Set(productIds)].filter(Boolean);
    if (slugs.length === 0) return new Map();

    try {
      const rows = await api<{ slug: string | null; dishPhotoSrc: string | null }[]>(
        "/api/products/dish-photos",
        { query: { slugs: slugs.join(",") } },
      );

      const map = new Map<string, string>();
      for (const row of rows) {
        if (row.slug && row.dishPhotoSrc) {
          map.set(row.slug, row.dishPhotoSrc);
        }
      }
      return map;
    } catch (err) {
      rethrowNextSignal(err);
      console.error("[getDishImageOverrides]", err);
      return new Map();
    }
  },
);
