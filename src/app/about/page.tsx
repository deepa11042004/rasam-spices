import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import FoundersSection from "@/components/FoundersSection";
import OrnamentDivider from "@/components/OrnamentDivider";
import SpiceBackdrop from "@/components/SpiceBackdrop";
import { getSiteContentBatch } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "About Us",
};

/** Split a text block at double-newlines into an array of paragraph strings. */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default async function AboutPage() {
  const content = await getSiteContentBatch({
    "about.storyIntro":
      "Every great journey begins with a dream. Ours began in the heart of rural India, with a simple belief — that a small beginning should never limit a big ambition.\n\nRASAM Spices was born from our desire to bring authentic flavours, dependable quality, and the richness of Indian spices to every kitchen.\n\nComing from a rural background, we understand the value of hard work, trust, and building something with our own hands. We believe that meaningful businesses are not built overnight; they are built through dedication, honest relationships, and the courage to dream beyond boundaries.\n\nWe started RASAM Spices with a vision that goes beyond selling spices. We want to build a brand that people recognise, trust, and proudly welcome into their homes. From everyday cooking to the needs of retailers, wholesalers, hotels, and food businesses, our goal is to make quality spices accessible to more people and more markets.",
    "about.smallBeginnings":
      "Our journey is just beginning, but our vision is much bigger. We aspire to grow from our roots in rural India into a recognised name across the country, creating opportunities, building lasting partnerships, and taking the richness of Indian spices to new markets.\n\nFor us, success is not just about how far a business grows. It is also about the trust it earns, the relationships it builds, and the opportunities it creates along the way.",
    "about.promise":
      "At RASAM Spices, we believe that every strong brand begins with a clear purpose. Ours is to grow with integrity, remain committed to quality, and build relationships that last.\n\nWe may have started small, but we are building with a bigger vision — one that honours our roots while reaching for new possibilities.\n\nFrom rural India to kitchens across the nation, this is only the beginning of our journey.",
    "about.founderAjay":
      "An accomplished business professional with an MBA and over 11 years of business experience, Ajay Ruhela brings valuable expertise in business development, strategic planning, and operations. As Co-Founder, he focuses on driving sustainable growth, strengthening business relationships, and building a strong foundation for long-term success through strategic thinking and effective leadership.",
    "about.founderHoney":
      "A dynamic leader with a strong academic foundation in B.Tech and MBA, Honey brings expertise in the FMCG industry, with a vision to build a trusted and innovative brand. As Co-Founder & CEO, Honey drives business strategy, product excellence, and brand development, focusing on delivering quality products and creating lasting customer relationships.",
  });

  return (
    <>
      {/* OUR STORY: image-led intro */}
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
              {toParagraphs(content["about.storyIntro"]).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
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

      {/* SMALL BEGINNINGS. BIG AMBITIONS */}
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
            {toParagraphs(content["about.smallBeginnings"]).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* MORE THAN SPICES. A PROMISE WE GROW WITH */}
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
              {toParagraphs(content["about.promise"]).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          <OrnamentDivider className="mx-auto mt-14 text-turmeric" />

          <p className="rasam-tagline rasam-tagline-on-light mx-auto mt-8 text-center">
            RASAM Spices — Rooted in Tradition. Growing with Ambition.
          </p>
        </div>
      </section>

      {/* OUR LEADERSHIP */}
      <FoundersSection
        founderAjayBio={content["about.founderAjay"]}
        founderHoneyBio={content["about.founderHoney"]}
      />
    </>
  );
}
