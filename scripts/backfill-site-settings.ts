/**
 * Backfill CompanySettings and SiteContent with the current website content.
 *
 * This is a one-time script that moves the values previously hardcoded in
 * src/data/company.ts and the public page components into the database, so the
 * admin Settings panel shows the live content as saved values rather than
 * empty fields.
 *
 * It is safe to re-run: existing non-empty values are left untouched unless
 * --force is passed.
 *
 * Run with:
 *   node --experimental-strip-types --import ./scripts/ts-loader-register.mjs --env-file=.env scripts/backfill-site-settings.ts
 *
 * To overwrite values already saved in the admin panel:
 *   node --experimental-strip-types --import ./scripts/ts-loader-register.mjs --env-file=.env scripts/backfill-site-settings.ts --force
 */

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.ts";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "127.0.0.1",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: requiredEnv("DATABASE_USER"),
  password: requiredEnv("DATABASE_PASSWORD"),
  database: requiredEnv("DATABASE_NAME"),
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

const FORCE = process.argv.includes("--force");

// ---------------------------------------------------------------------------
// Values currently hardcoded in the site
// ---------------------------------------------------------------------------

const COMPANY_VALUES = {
  companyName: "RASAM",
  email: "info@rasamfoods.com",
  address: "H-73, Sector 63\nNoida 201301\nUttar Pradesh, India",
  fssaiNumber: "12726054000026",
  phone: "+91 99581 68136",
  phoneHref: "tel:+919958168136",
  brandLine: "Swad Aisa Rasamo Jaisa",
  launchDate: "11 October 2025",
  websiteDisplay: "rasamfoods.com",
  websiteHref: "https://rasamfoods.com",
  siteDescription:
    "RASAM Spices brings the authentic taste of India to every home: ground spices, blended masalas and seasonings. Business enquiries welcome from retailers, wholesalers and distributors.",
  footerTagline:
    "Authentic Indian spices and masalas for every home. For retail, wholesale and distributorship enquiries, get in touch.",
};

const SITE_CONTENT: { key: string; title: string; content: string }[] = [
  // --- Homepage ---
  {
    key: "home.heroHeading",
    title: "Hero Heading (line 1)",
    content: "Rich aroma.",
  },
  {
    key: "home.heroHighlight",
    title: "Hero Heading Highlight (line 2)",
    content: "Authentic flavours.",
  },
  {
    key: "home.partnerStatement",
    title: "Partner Statement",
    content:
      "Whether you’re a retailer, distributor, wholesaler, or business partner, we’d love to grow together and bring the authentic taste of RASAM to more kitchens.",
  },
  {
    key: "home.aboutText",
    title: "About Section Paragraph",
    content:
      "Launched on 11 October 2025, RASAM Spices was founded with a simple vision: to bring the authentic taste of India to every home through spices that make everyday cooking more delicious and memorable.",
  },

  // --- About page ---
  {
    key: "about.storyIntro",
    title: "Our Story — Introduction",
    content: [
      "Every great journey begins with a dream. Ours began in the heart of rural India, with a simple belief — that a small beginning should never limit a big ambition.",
      "RASAM Spices was born from our desire to bring authentic flavours, dependable quality, and the richness of Indian spices to every kitchen.",
      "Coming from a rural background, we understand the value of hard work, trust, and building something with our own hands. We believe that meaningful businesses are not built overnight; they are built through dedication, honest relationships, and the courage to dream beyond boundaries.",
      "We started RASAM Spices with a vision that goes beyond selling spices. We want to build a brand that people recognise, trust, and proudly welcome into their homes. From everyday cooking to the needs of retailers, wholesalers, hotels, and food businesses, our goal is to make quality spices accessible to more people and more markets.",
    ].join("\n\n"),
  },
  {
    key: "about.smallBeginnings",
    title: "Small Beginnings. Big Ambitions.",
    content: [
      "Our journey is just beginning, but our vision is much bigger. We aspire to grow from our roots in rural India into a recognised name across the country, creating opportunities, building lasting partnerships, and taking the richness of Indian spices to new markets.",
      "For us, success is not just about how far a business grows. It is also about the trust it earns, the relationships it builds, and the opportunities it creates along the way.",
    ].join("\n\n"),
  },
  {
    key: "about.promise",
    title: "More Than Spices. A Promise We Grow With.",
    content: [
      "At RASAM Spices, we believe that every strong brand begins with a clear purpose. Ours is to grow with integrity, remain committed to quality, and build relationships that last.",
      "We may have started small, but we are building with a bigger vision — one that honours our roots while reaching for new possibilities.",
      "From rural India to kitchens across the nation, this is only the beginning of our journey.",
    ].join("\n\n"),
  },
  {
    key: "about.founderAjay",
    title: "Ajay Ruhela — Bio",
    content:
      "An accomplished business professional with an MBA and over 11 years of business experience, Ajay Ruhela brings valuable expertise in business development, strategic planning, and operations. As Co-Founder, he focuses on driving sustainable growth, strengthening business relationships, and building a strong foundation for long-term success through strategic thinking and effective leadership.",
  },
  {
    key: "about.founderHoney",
    title: "Honey — Bio",
    content:
      "A dynamic leader with a strong academic foundation in B.Tech and MBA, Honey brings expertise in the FMCG industry, with a vision to build a trusted and innovative brand. As Co-Founder & CEO, Honey drives business strategy, product excellence, and brand development, focusing on delivering quality products and creating lasting customer relationships.",
  },

  // --- Contact page ---
  {
    key: "contact.heading",
    title: "Contact Page Heading",
    content: "Let’s Grow Together.\nLet’s Spice Up Every Kitchen.",
  },
  {
    key: "contact.subtext",
    title: "Contact Page Subtitle",
    content:
      "Whether you’re exploring a business partnership, curious about a product, or just saying hello — we’d love to hear from you.",
  },
];

// ---------------------------------------------------------------------------

async function backfillCompanySettings() {
  console.log("--- CompanySettings ---");

  const existing = await prisma.companySettings.findFirst();

  if (!existing) {
    await prisma.companySettings.create({ data: COMPANY_VALUES });
    console.log("Created CompanySettings record with all values.");
    return;
  }

  // Only fill fields that are currently empty (unless --force)
  const updates: Record<string, string> = {};
  for (const [key, value] of Object.entries(COMPANY_VALUES)) {
    const current = (existing as Record<string, unknown>)[key];
    if (FORCE || current === null || current === undefined || current === "") {
      updates[key] = value;
      console.log(`  ${key}: ${current ? "overwritten" : "filled"}`);
    } else {
      console.log(`  ${key}: kept existing value`);
    }
  }

  if (Object.keys(updates).length > 0) {
    await prisma.companySettings.update({
      where: { id: existing.id },
      data: updates,
    });
    console.log(`Updated ${Object.keys(updates).length} field(s).`);
  } else {
    console.log("Nothing to update.");
  }
}

async function backfillSiteContent() {
  console.log();
  console.log("--- SiteContent ---");

  for (const item of SITE_CONTENT) {
    const existing = await prisma.siteContent.findUnique({
      where: { key: item.key },
    });

    if (!existing) {
      await prisma.siteContent.create({ data: item });
      console.log(`  ${item.key}: created`);
    } else if (FORCE) {
      await prisma.siteContent.update({
        where: { key: item.key },
        data: { title: item.title, content: item.content },
      });
      console.log(`  ${item.key}: overwritten`);
    } else {
      console.log(`  ${item.key}: kept existing value`);
    }
  }
}

async function main() {
  if (FORCE) {
    console.log("Running with --force: existing values will be overwritten.");
    console.log();
  }

  await backfillCompanySettings();
  await backfillSiteContent();

  console.log();
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
