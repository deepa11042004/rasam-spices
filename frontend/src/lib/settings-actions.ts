"use server";

/**
 * Server actions for company settings, site content, and social links.
 * Validation and persistence happen in the backend.
 */
import { revalidatePath } from "next/cache";
import { apiAction } from "@/lib/api";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

/** The footer lives in the root layout, so every public page shows these. */
function revalidateSite() {
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  revalidatePath("/about");
  revalidatePath("/contact");
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
  const result = await apiAction("/api/admin/settings/company", { method: "PUT", body: data });
  if (result.ok) revalidateSite();
  return result;
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
  return upsertManySiteContent([data]);
}

export async function upsertManySiteContent(items: SiteContentData[]): Promise<ActionResult> {
  const result = await apiAction("/api/admin/settings/content", {
    method: "PUT",
    body: { items },
  });
  if (result.ok) revalidateSite();
  return result;
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
  const result = await apiAction("/api/admin/settings/social-links", {
    method: "PUT",
    body: data,
  });
  if (result.ok) {
    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
  }
  return result;
}

export async function deleteSocialLink(id: string): Promise<ActionResult> {
  if (!id || typeof id !== "string") return { ok: false, message: "Invalid ID" };

  const result = await apiAction(`/api/admin/settings/social-links/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (result.ok) {
    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
  }
  return result;
}
