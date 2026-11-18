import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import DishPlatterManager from "@/components/admin/DishPlatterManager";
import {
  MAX_PLATTER_DISHES,
  getEligiblePlatterProducts,
  getPlatterConfig,
} from "@/lib/dish-platter";

export const metadata: Metadata = { title: "Homepage Dish Platter" };

export default async function DishPlatterPage() {
  const [config, products] = await Promise.all([
    getPlatterConfig(),
    getEligiblePlatterProducts(),
  ]);

  // Drop any saved slug that is no longer an eligible product, so the admin
  // never sees a selection that cannot be rendered publicly.
  const eligibleSlugs = new Set(products.map((p) => p.slug));
  const initialSelected = config.productSlugs.filter((s) => eligibleSlugs.has(s));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        title="Homepage Dish Platter"
        description="Choose which blended masalas appear on the rotating platter on the homepage, and in what order."
      />

      <DishPlatterManager
        maxDishes={MAX_PLATTER_DISHES}
        initialEnabled={config.enabled}
        initialSelected={initialSelected}
        products={products}
      />
    </div>
  );
}
