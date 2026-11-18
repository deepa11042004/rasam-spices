import DishDiscovery, { type DishStageItem } from "@/components/DishDiscovery";
import { dishes } from "@/data/dishes";
import { getProduct } from "@/data/products";
import { getDishImageOverrides } from "@/lib/dish-images";

/**
 * Interactive dish platter, between the hero and "Our range".
 *
 * Server component: it pairs every dish in src/data/dishes.ts with its real product from
 * src/data/products.ts, then hands plain data to the client component that handles the interaction.
 * A dish whose product ID is not found gets `product: null` (the panel says so; nothing is invented).
 *
 * Dish photos still come from src/data/dishes.ts by default. If an admin has
 * uploaded a Dish Image for the matching product, that image is used instead;
 * removing it restores the static photo. Everything else — names, order,
 * product associations, animation — is unchanged.
 */
export default async function RotatingDishSection() {
  const overrides = await getDishImageOverrides(dishes.map((dish) => dish.productId));

  const items: DishStageItem[] = dishes.map((dish) => {
    const uploaded = overrides.get(dish.productId);

    return {
      dish: uploaded ? { ...dish, src: uploaded } : dish,
      product: getProduct(dish.productId) ?? null,
    };
  });

  return <DishDiscovery items={items} />;
}
