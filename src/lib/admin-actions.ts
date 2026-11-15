"use server";

/**
 * Server actions for admin CRM operations.
 * Every action verifies the admin session before performing mutations.
 *
 * Business-approved status workflow (same across all enquiry types):
 *   NEW → CONTACTED → IN_PROGRESS → CONVERTED → CLOSED_LOST
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionAdmin } from "@/lib/admin-session";
import { ENQUIRY_STATUSES } from "@/lib/enquiry-constants";
import type { EnquiryStatus, ActionResult } from "@/lib/enquiry-constants";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const VALID_STATUSES = new Set<string>(ENQUIRY_STATUSES.map((s) => s.value));

function isValidStatus(s: unknown): s is EnquiryStatus {
  return typeof s === "string" && VALID_STATUSES.has(s);
}

function sanitize(value: unknown, maxLen = 2000): string {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, maxLen);
}

// ---------------------------------------------------------------------------
// General Enquiry actions
// ---------------------------------------------------------------------------

export async function updateGeneralEnquiryStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };
  if (!isValidStatus(status)) return { ok: false, message: "Invalid status" };
  if (!id || typeof id !== "string") return { ok: false, message: "Invalid ID" };

  try {
    await prisma.generalEnquiry.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/admin/general-enquiries");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to update status" };
  }
}

export async function updateGeneralEnquiryNotes(
  id: string,
  notes: string,
): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };
  if (!id || typeof id !== "string") return { ok: false, message: "Invalid ID" };

  const sanitized = sanitize(notes, 5000);

  try {
    await prisma.generalEnquiry.update({
      where: { id },
      data: { adminNotes: sanitized || null },
    });
    revalidatePath("/admin/general-enquiries");
    return { ok: true, message: "Notes saved" };
  } catch {
    return { ok: false, message: "Failed to save notes" };
  }
}

// ---------------------------------------------------------------------------
// Business Enquiry actions
// ---------------------------------------------------------------------------

export async function updateBusinessEnquiryStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };
  if (!isValidStatus(status)) return { ok: false, message: "Invalid status" };
  if (!id || typeof id !== "string") return { ok: false, message: "Invalid ID" };

  try {
    await prisma.businessEnquiry.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/admin/business-enquiries");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to update status" };
  }
}

export async function updateBusinessEnquiryNotes(
  id: string,
  notes: string,
): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };
  if (!id || typeof id !== "string") return { ok: false, message: "Invalid ID" };

  const sanitized = sanitize(notes, 5000);

  try {
    await prisma.businessEnquiry.update({
      where: { id },
      data: { adminNotes: sanitized || null },
    });
    revalidatePath("/admin/business-enquiries");
    return { ok: true, message: "Notes saved" };
  } catch {
    return { ok: false, message: "Failed to save notes" };
  }
}

// ---------------------------------------------------------------------------
// Sample Request actions
// ---------------------------------------------------------------------------

export async function updateSampleRequestStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };
  if (!isValidStatus(status)) return { ok: false, message: "Invalid status" };
  if (!id || typeof id !== "string") return { ok: false, message: "Invalid ID" };

  try {
    await prisma.sampleRequest.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/admin/sample-requests");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to update status" };
  }
}

export async function updateSampleRequestNotes(
  id: string,
  notes: string,
): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };
  if (!id || typeof id !== "string") return { ok: false, message: "Invalid ID" };

  const sanitized = sanitize(notes, 5000);

  try {
    await prisma.sampleRequest.update({
      where: { id },
      data: { adminNotes: sanitized || null },
    });
    revalidatePath("/admin/sample-requests");
    return { ok: true, message: "Notes saved" };
  } catch {
    return { ok: false, message: "Failed to save notes" };
  }
}
