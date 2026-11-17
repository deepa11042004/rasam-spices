"use server";

/**
 * Server actions for company settings, site content, and social links.
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionAdmin } from "@/lib/admin-session";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

function sanitize(value: unknown, maxLen = 500): string {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, maxLen);
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
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };

  const companyName = sanitize(data.companyName, 200);
  if (!companyName) return { ok: false, message: "Company name is required" };

  const email = sanitize(data.email, 254);
  const address = sanitize(data.address, 2000);
  const fssaiNumber = sanitize(data.fssaiNumber, 100);
  const phone = sanitize(data.phone, 50);
  const phoneHref = sanitize(data.phoneHref, 100);
  const brandLine = sanitize(data.brandLine, 300);
  const launchDate = sanitize(data.launchDate, 100);
  const websiteDisplay = sanitize(data.websiteDisplay, 200);
  const websiteHref = sanitize(data.websiteHref, 500);
  const siteDescription = sanitize(data.siteDescription, 2000);
  const footerTagline = sanitize(data.footerTagline, 2000);

  try {
    const existing = await prisma.companySettings.findFirst();

    const payload = {
      companyName,
      email: email || null,
      address: address || null,
      fssaiNumber: fssaiNumber || null,
      phone: phone || null,
      phoneHref: phoneHref || null,
      brandLine: brandLine || null,
      launchDate: launchDate || null,
      websiteDisplay: websiteDisplay || null,
      websiteHref: websiteHref || null,
      siteDescription: siteDescription || null,
      footerTagline: footerTagline || null,
    };

    if (existing) {
      await prisma.companySettings.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.companySettings.create({ data: payload });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/contact");
    return { ok: true, message: "Settings saved" };
  } catch (err) {
    console.error("[updateCompanySettings]", err);
    return { ok: false, message: "Failed to save settings" };
  }
}

// ---------------------------------------------------------------------------
// Site content (page-level editable text blocks)
// ---------------------------------------------------------------------------

export type SiteContentData = {
  key: string;
  title?: string;
  content: string;
};

export async function upsertSiteContent(data: SiteContentData): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };

  const key = sanitize(data.key, 100);
  if (!key) return { ok: false, message: "Key is required" };

  const title = data.title ? sanitize(data.title, 200) : null;
  // Allow longer content for page blocks (up to 50k chars)
  const content = typeof data.content === "string"
    ? data.content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, 50000)
    : "";

  try {
    const existing = await prisma.siteContent.findUnique({ where: { key } });

    if (existing) {
      await prisma.siteContent.update({
        where: { key },
        data: { title, content },
      });
    } else {
      await prisma.siteContent.create({
        data: { key, title, content },
      });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/contact");
    return { ok: true, message: "Content saved" };
  } catch (err) {
    console.error("[upsertSiteContent]", err);
    return { ok: false, message: "Failed to save content" };
  }
}

export async function upsertManySiteContent(items: SiteContentData[]): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };

  try {
    for (const item of items) {
      const key = sanitize(item.key, 100);
      if (!key) continue;
      const title = item.title ? sanitize(item.title, 200) : null;
      const content = typeof item.content === "string"
        ? item.content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, 50000)
        : "";

      await prisma.siteContent.upsert({
        where: { key },
        update: { title, content },
        create: { key, title, content },
      });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/contact");
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
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };

  const platform = sanitize(data.platform, 50);
  if (!platform) return { ok: false, message: "Platform is required" };

  const url = sanitize(data.url, 1000);
  if (!url) return { ok: false, message: "URL is required" };

  try {
    if (data.id) {
      await prisma.socialLink.update({
        where: { id: data.id },
        data: { platform, url, isVisible: Boolean(data.isVisible), sortOrder: Math.max(0, Math.floor(Number(data.sortOrder) || 0)) },
      });
    } else {
      await prisma.socialLink.create({
        data: { platform, url, isVisible: Boolean(data.isVisible), sortOrder: Math.max(0, Math.floor(Number(data.sortOrder) || 0)) },
      });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { ok: true, message: "Social link saved" };
  } catch (err) {
    console.error("[upsertSocialLink]", err);
    return { ok: false, message: "Failed to save social link" };
  }
}

export async function deleteSocialLink(id: string): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };
  if (!id || typeof id !== "string") return { ok: false, message: "Invalid ID" };

  try {
    await prisma.socialLink.delete({ where: { id } });
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { ok: true, message: "Social link deleted" };
  } catch {
    return { ok: false, message: "Failed to delete social link" };
  }
}
