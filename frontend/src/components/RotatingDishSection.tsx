import DishDiscovery, { type DishStageItem } from "@/components/DishDiscovery";
import { getProduct } from "@/data/products";
import { getPlatterDishes } from "@/lib/dish-platter";

/**
 * Interactive dish platter, between the hero and "Our range".
 *
 * Server component. Which dishes appear, and in what order, now comes from
 * the platter configuration an admin saves (src/lib/dish-platter.ts), which
 * is seeded from src/data/dishes.ts and still falls back to those static
 * photographs for products with no uploaded dish image. Each dish is paired
 * with its product from src/data/products.ts for the side panel, exactly as
 * before; a dish whose product is not found gets `product: null`.
 *
 * Returns nothing when the admin has switched the section off, or when no
 * eligible dish resolves, so the homepage simply omits the band rather than
 * rendering an empty plate.
 */
export default async function RotatingDishSection() {
  const dishes = await getPlatterDishes();

  if (!dishes || dishes.length === 0) return null;

  const items: DishStageItem[] = dishes.map((dish) => ({
    dish,
    product: getProduct(dish.productId) ?? null,
  }));

  return <DishDiscovery items={items} />;
}
