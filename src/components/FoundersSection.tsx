"use client";

import Image from "next/image";
import { useId, useState } from "react";

type Founder = {
  id: string;
  name: string;
  role: string;
  description: string;
  image: { src: string; alt: string };
};

/**
 * Honey first, then Ajay — matches the reference order established earlier in the session.
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
      alt: "Portrait of Honey, Co-Founder & CEO of RASAM Spices",
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
      alt: "Portrait of Ajay Ruhela, Co-Founder of RASAM Spices",
    },
  },
];

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Collapsible Founders panel for the bottom of the About page.
 *
 * Collapsed by default: a compact clickable header with the "Founders" title, a one-line
 * description and a chevron. Expanding smoothly reveals two founder rows (small square photo
 * beside the name, role and bio) using the CSS grid-template-rows 0fr↔1fr trick so the
 * animation works at any content height without JS-measured heights. The chevron rotates to
 * indicate state; `prefers-reduced-motion` suppresses both transitions and the state change
 * still happens instantly. Full keyboard support via the semantic <button> trigger with
 * aria-expanded / aria-controls / focus-visible outline.
 *
 * Styling reuses the existing RASAM tokens only (parchment, ivory-deep, turmeric, earth,
 * display-heading, eyebrow, rounded-card, shadow-card) — no new palette, no new fonts, no
 * decorative patterns borrowed from the reference image.
 */
export default function FoundersSection() {
  const [open, setOpen] = useState(false);
  const idBase = useId();
  const triggerId = `${idBase}-trigger`;
  const panelId = `${idBase}-panel`;

  return (
    <section aria-labelledby={triggerId} className="bg-parchment">
      <div className="mx-auto max-w-4xl px-6 pb-16 pt-10 lg:px-10 lg:pb-20 lg:pt-14">
        <button
          type="button"
          id={triggerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="group flex w-full items-center justify-between gap-6 rounded-card border border-turmeric/40 bg-ivory px-6 py-5 text-left shadow-card transition-colors hover:border-turmeric hover:bg-ivory-deep/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-turmeric sm:px-8 sm:py-6"
        >
          <div className="min-w-0">
            <p className="eyebrow">Leadership</p>
            <h2 className="display-heading mt-2 text-3xl text-earth sm:text-4xl">Founders</h2>
            <p className="mt-2 max-w-prose text-base leading-7 text-earth-muted">
              Meet the people behind RASAM and the vision driving our journey.
            </p>
          </div>
          <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-turmeric/50 bg-ivory text-earth transition-transform duration-300 ease-out motion-reduce:transition-none ${
              open ? "rotate-180" : ""
            }`}
          >
            <ChevronIcon />
          </span>
        </button>

        {/* grid-template-rows: 0fr → 1fr lets us animate to the content's natural height without
            knowing it in advance; the inner min-h-0 is what lets the grid child actually collapse. */}
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className={`grid overflow-hidden transition-[grid-template-rows,margin-top,opacity] duration-500 ease-in-out motion-reduce:transition-none ${
            open ? "mt-6 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <div className="rounded-card border border-turmeric/30 bg-ivory p-6 shadow-card sm:p-8">
              <p className="text-base leading-7 text-earth-muted">
                Our leadership team brings a wealth of experience and expertise:
              </p>

              <ul className="mt-6 divide-y divide-turmeric/20">
                {FOUNDERS.map((founder, index) => (
                  <li
                    key={founder.id}
                    className={`grid gap-5 sm:grid-cols-[88px_1fr] sm:items-start sm:gap-6 ${
                      index === 0 ? "pb-8" : "pb-2 pt-8"
                    }`}
                  >
                    <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-xl ring-1 ring-turmeric/30 sm:mx-0 sm:h-[88px] sm:w-[88px]">
                      <Image
                        src={founder.image.src}
                        alt={founder.image.alt}
                        fill
                        sizes="88px"
                        quality={90}
                        className="object-cover"
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="display-heading text-2xl text-earth sm:text-3xl">
                        {founder.name}
                      </h3>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-green">
                        — {founder.role}
                      </p>
                      <p className="mt-4 text-base leading-7 text-earth-muted">
                        {founder.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
