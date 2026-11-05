import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PackagingGallery from "@/components/PackagingGallery";
import ProductPrevNextNav from "@/components/ProductPrevNextNav";
import RelatedProducts from "@/components/RelatedProducts";
import { company } from "@/data/company";
import { getCategory, getProduct, products } from "@/data/products";

/** Build one static page per product at build time. */
export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

/** Any id not in the product list shows the 404 page. */
export const dynamicParams = false;

export async function generateMetadata(props: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const product = getProduct(id);
  if (!product) return {};
  return {
    title: product.name,
    description: product.tagline ?? `${product.name} from RASAM Spices.`,
  };
}

export default async function ProductPage(props: PageProps<"/products/[id]">) {
  const { id } = await props.params;
  const product = getProduct(id);
  if (!product) notFound();

  const category = getCategory(product.category);
  const sizes = product.packSizes?.join(", ");

  // A product-specific subject line, built the same way company.ts builds its generic one --
  // no change to the shared helper, just a local variant for this page's enquiry links.
  const productEnquiryMailto = `mailto:${company.email}?subject=${encodeURIComponent(
    `Business enquiry – RASAM ${product.name}`,
  )}`;

  return (
    <section className="bg-parchment">
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-8 lg:px-10 lg:pb-24">
        {/* A. Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-earth-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li className="flex items-center gap-2">
              <Link href="/" className="underline-offset-4 hover:text-spice hover:underline">
                Home
              </Link>
              <span aria-hidden="true">/</span>
            </li>
            <li className="flex items-center gap-2">
              <Link href="/products" className="underline-offset-4 hover:text-spice hover:underline">
                Products
              </Link>
              <span aria-hidden="true">/</span>
            </li>
            <li className="flex items-center gap-2">
              <Link
                href={`/products#${category.id}`}
                className="underline-offset-4 hover:text-spice hover:underline"
              >
                {category.name}
              </Link>
              <span aria-hidden="true">/</span>
            </li>
            <li aria-current="page" className="text-earth">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Prev/next (mobile): under the breadcrumb, out of the way of the gallery and details. */}
        <ProductPrevNextNav product={product} variant="mobile" />

        {/* B. Main product presentation */}
        <div className="relative mt-8 grid gap-8 md:grid-cols-[minmax(0,300px)_1fr] md:gap-10 lg:grid-cols-[minmax(0,480px)_1fr] lg:gap-16 xl:grid-cols-[minmax(0,560px)_1fr]">
          {/* Prev/next (desktop/tablet): outside both columns, vertically centred on this section. */}
          <ProductPrevNextNav product={product} variant="desktop" />

          <PackagingGallery product={product} />

          <div className="md:sticky md:top-28 md:self-start">
            <p className="eyebrow">{category.name}</p>
            <h1 className="display-heading mt-4 text-4xl text-earth sm:text-5xl lg:text-6xl">
              {product.name}
            </h1>
            {product.tagline && (
              <p className="mt-3 text-lg font-medium text-spice">{product.tagline}</p>
            )}
            {product.description && (
              <p className="mt-6 max-w-xl text-lg leading-8 text-earth-muted">
                {product.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <a href={productEnquiryMailto} className="btn btn-primary">
                Email an enquiry
              </a>
              <a href={company.phone.href} className="btn btn-ghost-dark">
                Call {company.phone.display}
              </a>
            </div>
          </div>
        </div>

        {/* C. Product information */}
        <section aria-labelledby="product-info-heading" className="mt-16 lg:mt-24">
          <div className="max-w-3xl border-t border-turmeric/30 pt-10">
            <h2 id="product-info-heading" className="display-heading text-3xl text-earth sm:text-4xl">
              Product information
            </h2>

            <dl className="mt-8 divide-y divide-turmeric/30 border-y border-turmeric/30">
              <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-4">
                <dt className="w-40 shrink-0 text-sm font-semibold text-earth">Category</dt>
                <dd className="text-sm leading-6 text-earth-muted">{category.name}</dd>
              </div>
              {product.packFormat && (
                <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-4">
                  <dt className="w-40 shrink-0 text-sm font-semibold text-earth">Packaging type</dt>
                  <dd className="text-sm leading-6 text-earth-muted">{product.packFormat}</dd>
                </div>
              )}
              {sizes && (
                <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-4">
                  <dt className="w-40 shrink-0 text-sm font-semibold text-earth">Pack sizes</dt>
                  <dd className="text-sm leading-6 text-earth-muted">{sizes}</dd>
                </div>
              )}
            </dl>

            {product.pendingNote && (
              <p className="mt-6 rounded-card bg-ivory-deep px-4 py-3 text-sm leading-6 text-earth-muted">
                <span className="font-semibold text-earth">To be confirmed: </span>
                {product.pendingNote}
              </p>
            )}
          </div>
        </section>

        {/* D. Related products */}
        <RelatedProducts product={product} />

        {/* E. Product enquiry section */}
        <section aria-labelledby="enquiry-heading" className="mt-20 lg:mt-28">
          <div className="rounded-card border border-turmeric/35 bg-forest-deep px-6 py-10 text-center shadow-card sm:px-10 sm:py-14">
            <p className="eyebrow eyebrow-light justify-center">Trade enquiries</p>
            <h2 id="enquiry-heading" className="display-heading mt-4 text-3xl text-parchment sm:text-4xl">
              Stock {product.name} at your business
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-parchment/80">
              We welcome enquiries from retailers, wholesalers and distributors interested in
              RASAM {product.name}. Reach out and our team will get back to you with pricing and
              availability.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={productEnquiryMailto} className="btn btn-primary">
                Email an enquiry
              </a>
              <a href={company.phone.href} className="btn btn-light">
                Call {company.phone.display}
              </a>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
