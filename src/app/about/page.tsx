import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import FoundersSection from "@/components/FoundersSection";
import OrnamentDivider from "@/components/OrnamentDivider";
import SpiceBackdrop from "@/components/SpiceBackdrop";

export const metadata: Metadata = {
  title: "About Us",
};

export default function AboutPage() {
  return (
    <>
      {/* OUR STORY: image-led intro, same language as the homepage's About teaser. */}
      <section className="text-earth">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-10 lg:py-24">
          <div className="image-frame relative mx-auto aspect-[4/5] w-full max-w-md lg:max-w-none">
            <Image
              src="/images/about.png"
              alt="Glass jars of ground turmeric, Kashmiri chilli, black pepper and whole spices"
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              quality={90}
              className="object-cover object-center"
            />
          </div>

          <div>
            <p className="eyebrow">Our story</p>
            <h1 className="display-heading mt-4 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              Rooted in Our Roots.
              <br />
              <span className="text-chilli">Driven by a Bigger Vision.</span>
            </h1>

            <div className="mt-7 max-w-xl space-y-5 text-lg leading-8 text-earth-muted">
              <p>
                Every great journey begins with a dream. Ours began in the heart of rural India,
                with a simple belief — that a small beginning should never limit a big ambition.
              </p>
              <p>
                RASAM Spices was born from our desire to bring authentic flavours, dependable
                quality, and the richness of Indian spices to every kitchen.
              </p>
              <p>
                Coming from a rural background, we understand the value of hard work, trust, and
                building something with our own hands. We believe that meaningful businesses are
                not built overnight; they are built through dedication, honest relationships, and
                the courage to dream beyond boundaries.
              </p>
              <p>
                We started RASAM Spices with a vision that goes beyond selling spices. We want to
                build a brand that people recognise, trust, and proudly welcome into their homes.
                From everyday cooking to the needs of retailers, wholesalers, hotels, and food
                businesses, our goal is to make quality spices accessible to more people and more
                markets.
              </p>
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/products" className="btn btn-primary">
                Explore products
              </Link>
              <Link href="/contact?form=business" className="btn btn-ghost-dark">
                Business enquiries
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SMALL BEGINNINGS. BIG AMBITIONS: deep botanical-green band, same dark-panel language as
          the homepage's business-enquiries section, with a faint mandala-corner ornament. */}
      <section className="relative isolate overflow-hidden border-y border-cacao/40 bg-botanical-green text-ivory">
        <SpiceBackdrop tone="dark" imageSrc="/images/about.png" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 bg-[url('/patterns/mandala-corner.svg')] bg-contain bg-no-repeat opacity-[0.08] sm:h-96 sm:w-96"
        />

        <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center lg:px-10 lg:py-28">
          <h2 className="display-heading text-4xl sm:text-5xl">Small Beginnings. Big Ambitions.</h2>
          <OrnamentDivider className="mx-auto mt-6 text-turmeric" />
          <div className="mx-auto mt-8 max-w-2xl space-y-6 text-lg leading-8 text-ivory/85">
            <p>
              Our journey is just beginning, but our vision is much bigger. We aspire to grow from
              our roots in rural India into a recognised name across the country, creating
              opportunities, building lasting partnerships, and taking the richness of Indian
              spices to new markets.
            </p>
            <p>
              For us, success is not just about how far a business grows. It is also about the
              trust it earns, the relationships it builds, and the opportunities it creates along
              the way.
            </p>
          </div>
        </div>
      </section>

      {/* MORE THAN SPICES. A PROMISE WE GROW WITH: ivory again, with the same diffused
          Kashmiri-chilli glow used on the Products page heading, closing with the brand
          signature line in the same gold script treatment as the homepage hero tagline. */}
      <section className="relative overflow-hidden bg-parchment">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
          <div className="relative mx-auto max-w-3xl text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-10 -inset-y-14 -z-10 bg-[radial-gradient(65%_90%_at_50%_30%,rgb(140_47_34_/_0.18),transparent_72%)] blur-3xl"
            />
            <h2 className="display-heading text-4xl text-earth sm:text-5xl">
              More Than Spices. A Promise We Grow With.
            </h2>
            <div className="mx-auto mt-7 max-w-2xl space-y-6 text-lg leading-8 text-earth-muted">
              <p>
                At RASAM Spices, we believe that every strong brand begins with a clear purpose.
                Ours is to grow with integrity, remain committed to quality, and build
                relationships that last.
              </p>
              <p>
                We may have started small, but we are building with a bigger vision — one that
                honours our roots while reaching for new possibilities.
              </p>
              <p>
                From rural India to kitchens across the nation, this is only the beginning of our
                journey.
              </p>
            </div>
          </div>

          <OrnamentDivider className="mx-auto mt-14 text-turmeric" />

          <p className="rasam-tagline rasam-tagline-on-light mx-auto mt-8 text-center">
            RASAM Spices — Rooted in Tradition. Growing with Ambition.
          </p>
        </div>
      </section>

      {/* OUR LEADERSHIP (collapsible): a compact Founders header at the very bottom of the About
          page that expands on click to reveal Honey + Ajay bios with small profile photos. */}
      <FoundersSection />
    </>
  );
}
