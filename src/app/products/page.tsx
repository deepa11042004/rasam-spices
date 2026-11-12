import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ProductCarousel from "@/components/ProductCarousel";
import ProductHeroSlider from "@/components/ProductHeroSlider";
import ProductInventoryShowcase, { type ShowcaseItem } from "@/components/ProductInventoryShowcase";
import { heroSlides } from "@/data/productHeroSlides";
import {
  featuredProducts,
  getCategory,
  getProductsByCategory,
  products,
  type CategoryId,
} from "@/data/products";
import { productDishPhotos } from "@/data/productDishPhotos";

// Display order of the three category showcases (and of the category links in the hero).
const CATEGORY_ORDER: CategoryId[] = ["ground-spices", "spices-seasonings", "blended-masalas"];

// Every product in each category is listed, whether or not a verified dish / usage photo exists
// for it (src/data/productDishPhotos.ts is the only place that pairing is made). A product
// without one still appears; its pinned panel just shows the pack and details.
const showcases = CATEGORY_ORDER.map((id) => ({
  category: getCategory(id),
  items: getProductsByCategory(id).map(
    (product): ShowcaseItem => ({ product, dish: productDishPhotos[product.id] }),
  ),
}));

export const metadata: Metadata = {
  title: "Products",
  description:
    "The RASAM Spices range: ground spices, blended masalas and individual spices & seasonings.",
};

export default function ProductsPage() {
  return (
    <>
      {/* ── Hero: auto-slider with blurred spice-photo backdrop ── */}
      <section className="relative overflow-hidden border-b border-turmeric/40">
        <div className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 scale-110 blur-sm">
            <Image src="/images/hero-background.png" alt="" fill sizes="100vw" quality={75} className="object-cover object-center" />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-charcoal/30" />

          <div className="relative z-10 mx-auto max-w-7xl px-6 pt-8 pb-8 lg:px-10 lg:pt-10 lg:pb-10">
            <ProductHeroSlider slides={heroSlides} aspectClassName="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[2/1]" />
          </div>
        </div>
      </section>

      {/* ── Our Products: heading cluster + category pills on solid chilli-red ── */}
      <section className="border-b border-turmeric/40" style={{ backgroundColor: "#912D27" }}>
        <div className="mx-auto max-w-7xl px-6 pb-12 pt-10 lg:px-10 lg:pb-16 lg:pt-14">
          <div>
            <p className="eyebrow eyebrow-light">The catalogue</p>
            <h1 className="display-heading mt-4 text-5xl text-ivory sm:text-7xl">Our products</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-parchment/85">
              {products.length} spices and masalas in three categories. For orders and trade
              terms, please{" "}
              <Link
                href="/contact"
                className="font-semibold text-turmeric underline underline-offset-4 hover:text-parchment"
              >
                send an enquiry
              </Link>
              .
            </p>
          </div>

          <nav aria-label="Product categories" className="mt-8">
            <ul className="flex flex-wrap gap-3">
              {showcases.map(({ category }) => (
                <li key={category.id}>
                  <a
                    href={`#${category.id}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-turmeric/70 bg-[#7a2520] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-parchment transition-colors hover:border-turmeric hover:bg-turmeric hover:text-charcoal"
                  >
                    {category.name} ({getProductsByCategory(category.id).length})
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* Featured slider: real products flagged `featured` in src/data/products.ts */}
      {featuredProducts.length > 0 && (
        <section id="featured" aria-label="Featured products" className="border-b border-turmeric/40 bg-parchment">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
            <ProductCarousel
              category={{ id: "featured", name: "Featured products" }}
              products={featuredProducts}
            />
          </div>
        </section>
      )}

      {/* Product inventory: one interactive showcase per category, in a wide container that uses
          ~92% of the viewport on desktop. See ProductInventoryShowcase.tsx. */}
      <section aria-labelledby="inventory-heading" className="bg-parchment">
        <div className="mx-auto w-full px-4 pt-14 text-center sm:px-6 lg:w-[92%] lg:px-0 lg:pt-20">
          <p className="eyebrow">Our products</p>
          <h2 id="inventory-heading" className="display-heading mt-4 text-4xl text-earth sm:text-5xl">
            Spices for Every Kitchen
          </h2>
        </div>

        {showcases.map(({ category, items }, index) => (
          <section
            key={category.id}
            id={category.id}
            aria-labelledby={`${category.id}-heading`}
            className={`scroll-mt-24 ${index % 2 === 1 ? "bg-ivory-deep/50" : ""} ${
              index < showcases.length - 1 ? "" : "border-b border-turmeric/40"
            }`}
          >
            <div className="mx-auto w-full px-4 py-12 sm:px-6 lg:w-[92%] lg:px-0 lg:py-16">
              <div className="text-center">
                <h3 id={`${category.id}-heading`} className="display-heading text-4xl text-earth sm:text-5xl">
                  {category.name}
                </h3>
                <p className="mt-3 text-lg text-earth-muted">
                  {category.summary} <span className="whitespace-nowrap">({items.length} products)</span>
                </p>
              </div>
              <ProductInventoryShowcase items={items} label={`${category.name} products`} />
            </div>
          </section>
        ))}
      </section>
    </>
  );
}
