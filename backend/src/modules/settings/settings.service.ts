/**
 * Company settings, editable site content blocks and social links.
 * Reads return raw records; defaults are applied by the frontend.
 */
import { prisma } from "@/lib/prisma";
import { sanitize, type ActionResult } from "@/lib/sanitize";

const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g; // eslint-disable-line no-control-regex

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function getCompanySettings() {
  return prisma.companySettings.findFirst();
}

/** Visible social links in admin order; blank or non-http URLs are dropped. */
export async function listPublicSocialLinks() {
  const rows = await prisma.socialLink.findMany({
    where: { isVisible: true },
    orderBy: [{ sortOrder: "asc" }, { platform: "asc" }],
    select: { platform: true, url: true },
  });
  return rows.filter((r) => typeof r.url === "string" && /^https?:\/\//i.test(r.url.trim()));
}

export function listSiteContent(keys?: string[]) {
  return prisma.siteContent.findMany(keys ? { where: { key: { in: keys } } } : undefined);
}

export function listAllSocialLinks() {
  return prisma.socialLink.findMany({ orderBy: { sortOrder: "asc" } });
}

// ---------------------------------------------------------------------------
// Company settings
// ---------------------------------------------------------------------------

export type CompanySettingsData = {
  companyName: string;
  email: string;
  address: string;
  fssaiNumber: string;
  phone: string;
  phoneHref: string;
  brandLine: string;
  launchDate: string;
  websiteDisplay: string;
  websiteHref: string;
  siteDescription: string;
  footerTagline: string;
};

export async function updateCompanySettings(data: CompanySettingsData): Promise<ActionResult> {
  const companyName = sanitize(data?.companyName, 200);
  if (!companyName) return { ok: false, message: "Company name is required" };

  const payload = {
    companyName,
    email: sanitize(data.email, 254) || null,
    address: sanitize(data.address, 2000) || null,
    fssaiNumber: sanitize(data.fssaiNumber, 100) || null,
    phone: sanitize(data.phone, 50) || null,
    phoneHref: sanitize(data.phoneHref, 100) || null,
    brandLine: sanitize(data.brandLine, 300) || null,
    launchDate: sanitize(data.launchDate, 100) || null,
    websiteDisplay: sanitize(data.websiteDisplay, 200) || null,
    websiteHref: sanitize(data.websiteHref, 500) || null,
    siteDescription: sanitize(data.siteDescription, 2000) || null,
    footerTagline: sanitize(data.footerTagline, 2000) || null,
  };

  try {
    const existing = await prisma.companySettings.findFirst();
    if (existing) {
      await prisma.companySettings.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.companySettings.create({ data: payload });
    }
    return { ok: true, message: "Settings saved" };
  } catch (err) {
    console.error("[updateCompanySettings]", err);
    return { ok: false, message: "Failed to save settings" };
  }
}

// ---------------------------------------------------------------------------
// Site content
// ---------------------------------------------------------------------------

export type SiteContentData = { key: string; title?: string; content: string };

function cleanContent(content: unknown): string {
  return typeof content === "string" ? content.replace(CONTROL_CHARS, "").trim().slice(0, 50000) : "";
}

export async function upsertManySiteContent(items: SiteContentData[]): Promise<ActionResult> {
  if (!Array.isArray(items)) return { ok: false, message: "Invalid content" };

  try {
    for (const item of items) {
      const key = sanitize(item?.key, 100);
      if (!key) continue;
      const title = item.title ? sanitize(item.title, 200) : null;
      const content = cleanContent(item.content);

      await prisma.siteContent.upsert({
        where: { key },
        update: { title, content },
        create: { key, title, content },
      });
    }
    return { ok: true, message: "Content saved" };
  } catch (err) {
    console.error("[upsertManySiteContent]", err);
    return { ok: false, message: "Failed to save content" };
  }
}

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export type SocialLinkData = {
  id?: string;
  platform: string;
  url: string;
  isVisible: boolean;
  sortOrder: number;
};

export async function upsertSocialLink(data: SocialLinkData): Promise<ActionResult> {
  const platform = sanitize(data?.platform, 50);
  if (!platform) return { ok: false, message: "Platform is required" };

  const url = sanitize(data.url, 1000);
  if (!url) return { ok: false, message: "URL is required" };

  const fields = {
    platform,
    url,
    isVisible: Boolean(data.isVisible),
    sortOrder: Math.max(0, Math.floor(Number(data.sortOrder) || 0)),
  };

  try {
    if (data.id) {
      await prisma.socialLink.update({ where: { id: data.id }, data: fields });
    } else {
      await prisma.socialLink.create({ data: fields });
    }
    return { ok: true, message: "Social link saved" };
  } catch (err) {
    console.error("[upsertSocialLink]", err);
    return { ok: false, message: "Failed to save social link" };
  }
}

export async function deleteSocialLink(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, message: "Invalid ID" };
  try {
    await prisma.socialLink.delete({ where: { id } });
    return { ok: true, message: "Social link deleted" };
  } catch {
    return { ok: false, message: "Failed to delete social link" };
  }
}
