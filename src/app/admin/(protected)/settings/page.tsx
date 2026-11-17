import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { company as defaults } from "@/data/company";
import CompanySettingsForm from "@/components/admin/CompanySettingsForm";
import SocialLinksManager from "@/components/admin/SocialLinksManager";
import SiteContentForm, { type ContentField } from "@/components/admin/SiteContentForm";

export const metadata: Metadata = { title: "Settings" };

// ---------------------------------------------------------------------------
// Content field definitions for each section
// ---------------------------------------------------------------------------

const HOMEPAGE_FIELDS: ContentField[] = [
  {
    key: "home.heroHeading",
    label: "Hero Heading (line 1)",
    hint: "The main heading on the homepage hero. e.g. \"Rich aroma.\"",
    rows: 2,
  },
  {
    key: "home.heroHighlight",
    label: "Hero Heading Highlight (line 2)",
    hint: "The highlighted second line. e.g. \"Authentic flavours.\"",
    rows: 2,
  },
  {
    key: "home.partnerStatement",
    label: "Partner Statement",
    hint: "The typed statement in the middle of the homepage.",
    rows: 4,
  },
  {
    key: "home.aboutText",
    label: "About Section Paragraph",
    hint: "The paragraph next to the spice photo in the homepage about section.",
    rows: 4,
  },
];

const ABOUT_FIELDS: ContentField[] = [
  {
    key: "about.storyIntro",
    label: "Our Story — Introduction",
    hint: "The paragraphs in the \"Our Story\" section. Separate paragraphs with a blank line.",
    rows: 10,
  },
  {
    key: "about.smallBeginnings",
    label: "Small Beginnings. Big Ambitions.",
    hint: "The paragraphs in the dark green band. Separate paragraphs with a blank line.",
    rows: 8,
  },
  {
    key: "about.promise",
    label: "More Than Spices. A Promise We Grow With.",
    hint: "The paragraphs in the closing section. Separate paragraphs with a blank line.",
    rows: 8,
  },
  {
    key: "about.founderAjay",
    label: "Ajay Ruhela — Bio",
    hint: "Bio text for the first founder.",
    rows: 5,
  },
  {
    key: "about.founderHoney",
    label: "Honey — Bio",
    hint: "Bio text for the second founder.",
    rows: 5,
  },
];

const CONTACT_FIELDS: ContentField[] = [
  {
    key: "contact.heading",
    label: "Contact Page Heading",
    hint: "The main heading. Use a line break to split into two lines.",
    rows: 3,
  },
  {
    key: "contact.subtext",
    label: "Contact Page Subtitle",
    hint: "The paragraph below the heading.",
    rows: 4,
  },
];

// ---------------------------------------------------------------------------
// Default content values (current hardcoded text, used as fallback)
// ---------------------------------------------------------------------------

const HOMEPAGE_DEFAULTS: Record<string, string> = {
  "home.heroHeading": "Rich aroma.",
  "home.heroHighlight": "Authentic flavours.",
  "home.partnerStatement":
    "Whether you’re a retailer, distributor, wholesaler, or business partner, we’d love to grow together and bring the authentic taste of RASAM to more kitchens.",
  "home.aboutText":
    `Launched on ${defaults.launchDate}, RASAM Spices was founded with a simple vision: to bring the authentic taste of India to every home through spices that make everyday cooking more delicious and memorable.`,
};

const ABOUT_DEFAULTS: Record<string, string> = {
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
};

const CONTACT_DEFAULTS: Record<string, string> = {
  "contact.heading":
    "Let’s Grow Together.\nLet’s Spice Up Every Kitchen.",
  "contact.subtext":
    "Whether you’re exploring a business partnership, curious about a product, or just saying hello — we’d love to hear from you.",
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function SettingsPage() {
  const [settings, socialLinks, siteContentRows] = await Promise.all([
    prisma.companySettings.findFirst(),
    prisma.socialLink.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.siteContent.findMany(),
  ]);

  // Build a lookup of saved content values
  const savedContent: Record<string, string> = {};
  for (const row of siteContentRows) {
    savedContent[row.key] = row.content;
  }

  // Merge saved values with defaults for each section
  function mergedValues(defs: Record<string, string>) {
    const merged: Record<string, string> = {};
    for (const [key, fallback] of Object.entries(defs)) {
      merged[key] = savedContent[key] ?? fallback;
    }
    return merged;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8 border-b border-neutral-200 pb-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-neutral-800">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage company information, website content, and social links
        </p>
      </div>

      {/* Company Information */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-neutral-700">
          Company Information
        </h2>
        <CompanySettingsForm
          initialData={{
            companyName: settings?.companyName ?? "",
            email: settings?.email ?? "",
            address: settings?.address ?? "",
            fssaiNumber: settings?.fssaiNumber ?? "",
            phone: settings?.phone ?? "",
            phoneHref: settings?.phoneHref ?? "",
            brandLine: settings?.brandLine ?? "",
            launchDate: settings?.launchDate ?? "",
            websiteDisplay: settings?.websiteDisplay ?? "",
            websiteHref: settings?.websiteHref ?? "",
            siteDescription: settings?.siteDescription ?? "",
            footerTagline: settings?.footerTagline ?? "",
          }}
        />
      </section>

      {/* Homepage Content */}
      <section className="mb-10 border-t border-neutral-200 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-700">
          Homepage Content
        </h2>
        <SiteContentForm
          sectionTitle="Hero & Text Sections"
          fields={HOMEPAGE_FIELDS}
          initialValues={mergedValues(HOMEPAGE_DEFAULTS)}
        />
      </section>

      {/* About Page Content */}
      <section className="mb-10 border-t border-neutral-200 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-700">
          About Page Content
        </h2>
        <SiteContentForm
          sectionTitle="Story & Founder Bios"
          fields={ABOUT_FIELDS}
          initialValues={mergedValues(ABOUT_DEFAULTS)}
        />
      </section>

      {/* Contact Page Content */}
      <section className="mb-10 border-t border-neutral-200 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-700">
          Contact Page Content
        </h2>
        <SiteContentForm
          sectionTitle="Heading & Subtitle"
          fields={CONTACT_FIELDS}
          initialValues={mergedValues(CONTACT_DEFAULTS)}
        />
      </section>

      {/* Social Links */}
      <section className="border-t border-neutral-200 pt-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-700">
          Social Links
        </h2>
        <SocialLinksManager
          initialLinks={socialLinks.map((l) => ({
            id: l.id,
            platform: l.platform,
            url: l.url,
            isVisible: l.isVisible,
            sortOrder: l.sortOrder,
          }))}
        />
      </section>
    </div>
  );
}
