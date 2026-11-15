"use server";

/**
 * Server actions for company settings and social links.
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
};

export async function updateCompanySettings(data: CompanySettingsData): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };

  const companyName = sanitize(data.companyName, 200);
  if (!companyName) return { ok: false, message: "Company name is required" };

  const email = sanitize(data.email, 254);
  const address = sanitize(data.address, 2000);
  const fssaiNumber = sanitize(data.fssaiNumber, 100);

  try {
    // Get or create the single settings record
    const existing = await prisma.companySettings.findFirst();

    if (existing) {
      await prisma.companySettings.update({
        where: { id: existing.id },
        data: { companyName, email: email || null, address: address || null, fssaiNumber: fssaiNumber || null },
      });
    } else {
      await prisma.companySettings.create({
        data: { companyName, email: email || null, address: address || null, fssaiNumber: fssaiNumber || null },
      });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { ok: true, message: "Settings saved" };
  } catch (err) {
    console.error("[updateCompanySettings]", err);
    return { ok: false, message: "Failed to save settings" };
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
