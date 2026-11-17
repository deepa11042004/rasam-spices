/**
 * Public-facing helpers that read company settings and site content from the
 * database, falling back to the hardcoded defaults in src/data/company.ts
 * when a value hasn't been set in the admin panel yet.
 *
 * These are server-only functions (no "use server" — they're not actions,
 * just data fetchers called from Server Components).
 */
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { company as defaults } from "@/data/company";

// ---------------------------------------------------------------------------
// Company settings
// ---------------------------------------------------------------------------

export type PublicCompanySettings = {
  displayName: string;
  brandLine: string;
  launchDate: string;
  phone: { display: string; href: string };
  email: string;
  website: { display: string; href: string };
  address: { lines: string[] };
  fssaiLicence: string;
  siteDescription: string;
  footerTagline: string;
};

/**
 * Fetch company settings once per request (React `cache` deduplicates within
 * a single render pass). Falls back to hardcoded defaults for any field not
 * yet saved in the database.
 */
export const getPublicSettings = cache(async (): Promise<PublicCompanySettings> => {
  const row = await prisma.companySettings.findFirst();

  return {
    displayName: row?.companyName || defaults.displayName,
    brandLine: row?.brandLine || defaults.brandLine,
    launchDate: row?.launchDate || defaults.launchDate,
    phone: {
      display: row?.phone || defaults.phone.display,
      href: row?.phoneHref || defaults.phone.href,
    },
    email: row?.email || defaults.email,
    website: {
      display: row?.websiteDisplay || defaults.website.display,
      href: row?.websiteHref || defaults.website.href,
    },
    address: {
      lines: row?.address
        ? row.address.split("\n").map((l) => l.trim()).filter(Boolean)
        : [...defaults.address.lines],
    },
    fssaiLicence: row?.fssaiNumber || defaults.fssaiLicence,
    siteDescription:
      row?.siteDescription ||
      "Authentic Indian ground spices and blended masalas by RASAM. Retail, wholesale and distributorship enquiries welcome.",
    footerTagline:
      row?.footerTagline ||
      "Authentic Indian spices and masalas for every home. For retail, wholesale and distributorship enquiries, get in touch.",
  };
});

// ---------------------------------------------------------------------------
// Site content (page blocks)
// ---------------------------------------------------------------------------

/**
 * Known content keys used across the site. When adding a new editable text
 * section, add its key here as documentation.
 */
export const SITE_CONTENT_KEYS = {
  // Homepage
  "home.heroHeading": "Homepage hero heading (line 1)",
  "home.heroHighlight": "Homepage hero heading highlight (line 2)",
  "home.partnerStatement": "Homepage partner statement",
  "home.aboutText": "Homepage about section paragraph",

  // About page
  "about.storyIntro": "About page — Our Story introduction paragraphs",
  "about.smallBeginnings": "About page — Small Beginnings section",
  "about.promise": "About page — More Than Spices section",
  "about.founderAjay": "About page — Ajay Ruhela bio",
  "about.founderHoney": "About page — Honey bio",

  // Contact page
  "contact.heading": "Contact page main heading",
  "contact.subtext": "Contact page subtitle paragraph",
} as const;

export type SiteContentKey = keyof typeof SITE_CONTENT_KEYS;

/**
 * Fetch a single content block by key. Returns the DB value or the provided
 * fallback string.
 */
export const getSiteContent = cache(
  async (key: string, fallback: string): Promise<string> => {
    const row = await prisma.siteContent.findUnique({ where: { key } });
    return row?.content || fallback;
  },
);

/**
 * Fetch multiple content blocks in one query. Returns a map of key → content,
 * using provided defaults for any missing keys.
 */
export const getSiteContentBatch = cache(
  async (defaults: Record<string, string>): Promise<Record<string, string>> => {
    const keys = Object.keys(defaults);
    const rows = await prisma.siteContent.findMany({
      where: { key: { in: keys } },
    });

    const map: Record<string, string> = { ...defaults };
    for (const row of rows) {
      if (row.content) {
        map[row.key] = row.content;
      }
    }
    return map;
  },
);
