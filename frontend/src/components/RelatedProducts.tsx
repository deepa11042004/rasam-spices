import ProductCard from "@/components/ProductCard";
import type { Product } from "@/data/products";

/**
 * Up to 3 other products from the same category as `product`, shown at the
 * bottom of the product detail page. Reuses the existing ProductCard design
 * and product data -- nothing new is introduced. Renders nothing when the
 * category has no other products.
 */
export default function RelatedProducts({
  product,
  categoryProducts,
}: {
  product: Product;
  categoryProducts: Product[];
}) {
  const related = categoryProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-products-heading" className="mt-20 lg:mt-28">
      <div className="flex items-end justify-between gap-4 border-t border-turmeric/30 pt-10">
        <div>
          <p className="eyebrow">You may also like</p>
          <h2 id="related-products-heading" className="display-heading mt-3 text-3xl text-earth sm:text-4xl">
            More from this range
          </h2>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
