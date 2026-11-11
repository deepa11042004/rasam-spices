import Image from "next/image";
import OrnamentDivider from "@/components/OrnamentDivider";

type Founder = {
  id: string;
  name: string;
  role: string;
  description: string;
  image: { src: string; alt: string };
};

/**
 * Honey first, then Ajay — matches the uploaded reference screenshot's visual layout.
 * Each founder is a two-column row on desktop; the second row swaps column order so the
 * photographs sit on opposite sides of the page. On mobile both rows stack photo-first.
 *
 * Descriptions are the company's own copy, used verbatim.
 */
const FOUNDERS: Founder[] = [
  {
    id: "honey",
    name: "Honey",
    role: "Co-Founder & CEO",
    description:
      "A dynamic leader with a strong academic foundation in B.Tech and MBA, Honey brings expertise in the FMCG industry, with a vision to build a trusted and innovative brand. As Co-Founder & CEO, Honey drives business strategy, product excellence, and brand development, focusing on delivering quality products and creating lasting customer relationships.",
    image: {
      src: "/images/Founder2.png",
      alt: "Honey, Co-Founder & CEO of RASAM Spices",
    },
  },
  {
    id: "ajay",
    name: "Ajay Ruhela",
    role: "Co-Founder",
    description:
      "An accomplished business professional with an MBA and over 11 years of business experience, Ajay Ruhela brings valuable expertise in business development, strategic planning, and operations. As Co-Founder, he focuses on driving sustainable growth, strengthening business relationships, and building a strong foundation for long-term success through strategic thinking and effective leadership.",
    image: {
      src: "/images/Founder 1.png",
      alt: "Ajay Ruhela, Co-Founder of RASAM Spices",
    },
  },
];

export default function FoundersSection() {
  return (
    <section
      aria-labelledby="founders-heading"
      className="relative isolate overflow-hidden border-y border-cacao/40 bg-botanical-green text-ivory"
    >
      {/* Subtle decorative botanical hairline in the top-right corner, same treatment as the
          "Small Beginnings" section below (mandala-corner.svg from public/patterns/). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 bg-[url('/patterns/mandala-corner.svg')] bg-contain bg-no-repeat opacity-[0.08] sm:h-96 sm:w-96"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow eyebrow-light justify-center">Leadership</p>
          <h2
            id="founders-heading"
            className="display-heading mt-4 text-3xl leading-tight text-ivory sm:text-4xl lg:text-5xl"
          >
            Our leadership team brings a wealth of experience and expertise.
          </h2>
          <OrnamentDivider className="mx-auto mt-6 text-turmeric" />
        </div>

        <div className="mt-16 space-y-20 md:mt-20 md:space-y-24 lg:space-y-28">
          {FOUNDERS.map((founder, index) => {
            const photoOnLeft = index === 0; // row 1 Honey: photo LEFT, text RIGHT; row 2 Ajay: text LEFT, photo RIGHT.
            return (
              <article
                key={founder.id}
                className="grid items-center gap-10 md:grid-cols-[minmax(0,0.9fr)_1.1fr] md:gap-14 lg:gap-20"
              >
                {/* Photo */}
                <div
                  className={`mx-auto w-full max-w-sm md:mx-0 md:max-w-none ${
                    photoOnLeft ? "md:order-1" : "md:order-2"
                  }`}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-ivory/15">
                    <Image
                      src={founder.image.src}
                      alt={founder.image.alt}
                      fill
                      sizes="(min-width: 1024px) 40vw, (min-width: 768px) 45vw, 90vw"
                      quality={90}
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Text */}
                <div
                  className={`text-center md:text-left ${
                    photoOnLeft ? "md:order-2" : "md:order-1 md:text-right"
                  }`}
                >
                  <h3 className="display-heading text-4xl sm:text-5xl">{founder.name}</h3>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-turmeric">
                    — {founder.role}
                  </p>
                  <p className="mt-6 text-base leading-7 text-ivory/85 sm:text-lg sm:leading-8">
                    {founder.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
