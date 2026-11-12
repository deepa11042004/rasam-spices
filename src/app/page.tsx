
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import CategoryCard from "@/components/CategoryCard";
import HeroVisual from "@/components/HeroVisual";
import OrnamentDivider from "@/components/OrnamentDivider";
import ProductCarousel from "@/components/ProductCarousel";
import RotatingDishSection from "@/components/RotatingDishSection";
import SpiceBackdrop from "@/components/SpiceBackdrop";
import RasamAnimatedLogo from "@/components/RasamAnimatedLogo";
import TypingStatement from "@/components/TypingStatement";

import { company } from "@/data/company";
import { categories, featuredProducts, getProductsByCategory } from "@/data/products";


export default function Home() {
  return (
    <>
      {/* HERO: spice photograph (blurred, visible around the card) + solid charcoal card with a gold border */}
      <section className="relative isolate overflow-hidden px-4 pb-12 pt-8 sm:px-6 lg:px-10 lg:pb-20 lg:pt-12">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 scale-110 blur-sm">
          <Image src="/images/hero-background.png" alt="" fill priority sizes="100vw" quality={75} className="object-cover object-center" />
        </div>
        {/* Light tint only, so the photograph stays visible around the card */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-charcoal/30" />
        {/* Fades the photo into the ivory "Our range" section instead of ending in a hard edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-20 bg-linear-to-b from-transparent to-parchment lg:h-28"
        />

        <div
          data-hero-card
          className="relative z-10 mx-auto max-w-[1480px] overflow-hidden rounded-[1.25rem] border border-turmeric/80 bg-charcoal shadow-lift"
        >
          {/* Warm light behind the products, hairline gold inset */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_75%_55%,rgba(200,154,69,0.14),transparent_70%)]"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-[0.9rem] border border-turmeric/20" />

          <div className="relative z-10 grid items-center gap-6 px-6 py-12 sm:px-12 lg:grid-cols-[1fr_1.1fr] lg:gap-4 lg:px-16 lg:py-20">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              {/* Official logo, lightened slightly so the green pot reads on charcoal */}
              <div className="hero-in w-[190px] [filter:brightness(1.55)_saturate(1.05)] sm:w-[240px]">
                <RasamAnimatedLogo />
              </div>

              <p className="rasam-tagline hero-in mt-5 !mx-0" style={{ "--hero-delay": "0.3s" } as CSSProperties}>
                {company.brandLine}
              </p>

              <div className="hero-in" style={{ "--hero-delay": "0.4s" } as CSSProperties}>
                <OrnamentDivider className="mt-3" />
              </div>

              <h1
                className="hero-in display-heading mt-6 text-[2.75rem] text-parchment sm:text-6xl lg:text-7xl"
                style={{ "--hero-delay": "0.5s" } as CSSProperties}
              >
                Rich aroma.
                <br />
                <span className="text-turmeric">Authentic flavours.</span>
              </h1>

              <div className="hero-in mt-9 flex flex-wrap justify-center gap-3 lg:justify-start" style={{ "--hero-delay": "0.75s" } as CSSProperties}>
                <Link href="/products" className="btn btn-primary">
                  Explore products
                </Link>
                <Link href="/contact?form=business" className="btn btn-ghost-light">
                  Business enquiries
                </Link>
              </div>
            </div>

            {/* Animated product collection (client component: entrance, float, light parallax) */}
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS: same slider used on the Products page, now the homepage's first
          product moment right after the hero. Removed from the Products page to avoid
          duplication. */}
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

      {/* SHOP BY CATEGORY: two cards straight to the Products page's category anchors. Blended
          Masalas is represented by the dish platter below instead of a third card here. */}
      <section aria-label="Shop by category" className="bg-parchment pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-2xl">
            <p className="eyebrow">Browse</p>
            <h2 className="display-heading mt-4 text-4xl text-earth sm:text-5xl">Shop by category</h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <CategoryCard
              title="Individual Spices & Seasonings"
              description="Jeera, kasuri methi and pink salt for everyday seasoning."
              href="/products#spices-seasonings"
              image={{
                src: "/images/blackmirch.png",
                alt: "A close pile of whole black peppercorns",
              }}
            />
            <CategoryCard
              title="Ground Spices"
              description="Single-spice powders for everyday Indian cooking."
              href="/products#ground-spices"
              image={{
                src: "/images/Ground%20Spices.png",
                alt: "Wooden bowls of ground turmeric, coriander, red chilli and black pepper on a wooden board with fresh ginger, garlic and cinnamon",
              }}
              imagePosition="50% 58%"
            />
          </div>
        </div>
      </section>

      {/* DISH PLATTER: charcoal band with the spice photograph sunk into it. The homepage's
          introduction to Blended Masalas -- see the text beside the plate in DishDiscovery.tsx. */}
      <div className="relative isolate overflow-hidden border-y border-turmeric/40">
        <SpiceBackdrop tone="dark" />
        <RotatingDishSection />
      </div>

      {/* PARTNER STATEMENT: a quiet, typed-in line of welcome to trade partners, giving the
          page room to breathe between the dish platter and the Our Story panel below. */}
      <section className="border-t border-turmeric/30 bg-parchment">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center lg:px-10 lg:py-24">
          <div className="gold-rule mx-auto w-20" />
          <TypingStatement
            text="We welcome retailers, distributors, wholesalers, and business partners to grow with RASAM and bring the authentic taste of our spices to more customers."
            className="display-heading mt-8 text-2xl italic leading-snug text-earth sm:text-3xl lg:text-4xl"
          />
        </div>
      </section>

      {/* ABOUT: image-led panel beside the story */}
      <section className="bg-ivory-deep/60 py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-10">
          <div className="image-frame relative mx-auto aspect-[4/5] w-full max-w-md lg:max-w-none">
            <Image
              src="/images/spice-background.jpg"
              alt="Whole spices: turmeric, star anise and chillies"
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              quality={90}
              className="object-cover object-[50%_35%]"
            />
          </div>

          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="display-heading mt-4 text-5xl leading-[1.05] text-earth sm:text-6xl">
              Spices are the heart of Indian cuisine.
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-earth-muted">
              Launched on {company.launchDate}, RASAM Spices was founded with a
              simple vision: to bring the authentic taste of India to every
              home through spices that make everyday cooking more delicious
              and memorable.
            </p>
            <Link href="/about" className="btn btn-ghost-dark mt-9">
              About RASAM Spices
            </Link>
          </div>
        </div>
      </section>

      {/* BUSINESS ENQUIRIES */}
      <section className="relative isolate overflow-hidden border-t border-turmeric bg-forest text-ivory [&_:focus-visible]:outline-turmeric">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_120%_at_85%_40%,rgba(200,154,69,0.16),transparent_65%),linear-gradient(135deg,#354638,#2b3a2e)]"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-[1.3fr_1fr] lg:px-10 lg:py-24">
          <div>
            <p className="eyebrow eyebrow-light">Business enquiries</p>
            <h2 className="display-heading mt-4 text-5xl sm:text-6xl">Let&apos;s grow together.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ivory/85">
              We invite retailers, distributors, wholesalers and business
              partners to join us in bringing authentic Indian flavours to
              every corner of the country.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/contact?form=business" className="btn btn-light">
              Send a business enquiry
            </Link>
            <a href={company.phone.href} className="btn btn-ghost-light">
              Call {company.phone.display}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
