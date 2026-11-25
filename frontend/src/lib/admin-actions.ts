"use server";

/**
 * Server actions for admin CRM operations.
 * The backend verifies the admin session on every call.
 *
 * Business-approved status workflow (same across all enquiry types):
 *   NEW → CONTACTED → IN_PROGRESS → CONVERTED → CLOSED_LOST
 */
import { revalidatePath } from "next/cache";
import { apiAction } from "@/lib/api";
import type { ActionResult } from "@/lib/enquiry-constants";
import type { EnquiryKind } from "@/lib/api-types";

const LIST_PATH: Record<EnquiryKind, string> = {
  general: "/admin/general-enquiries",
  business: "/admin/business-enquiries",
  sample: "/admin/sample-requests",
};

async function updateStatus(kind: EnquiryKind, id: string, status: string): Promise<ActionResult> {
  if (!id || typeof id !== "string") return { ok: false, message: "Invalid ID" };

  const result = await apiAction(`/api/admin/enquiries/${kind}/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { status },
  });
  if (result.ok) {
    revalidatePath(LIST_PATH[kind]);
    revalidatePath("/admin");
  }
  return result;
}

async function updateNotes(kind: EnquiryKind, id: string, notes: string): Promise<ActionResult> {
  if (!id || typeof id !== "string") return { ok: false, message: "Invalid ID" };

  const result = await apiAction(`/api/admin/enquiries/${kind}/${encodeURIComponent(id)}/notes`, {
    method: "PATCH",
    body: { notes },
  });
  if (result.ok) revalidatePath(LIST_PATH[kind]);
  return result;
}

export async function updateGeneralEnquiryStatus(id: string, status: string): Promise<ActionResult> {
  return updateStatus("general", id, status);
}

export async function updateGeneralEnquiryNotes(id: string, notes: string): Promise<ActionResult> {
  return updateNotes("general", id, notes);
}

export async function updateBusinessEnquiryStatus(id: string, status: string): Promise<ActionResult> {
  return updateStatus("business", id, status);
}

export async function updateBusinessEnquiryNotes(id: string, notes: string): Promise<ActionResult> {
  return updateNotes("business", id, notes);
}

export async function updateSampleRequestStatus(id: string, status: string): Promise<ActionResult> {
  return updateStatus("sample", id, status);
}

export async function updateSampleRequestNotes(id: string, notes: string): Promise<ActionResult> {
  return updateNotes("sample", id, notes);
}
