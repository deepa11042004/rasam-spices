"use server";

/**
 * Public enquiry submission actions.
 *
 * Called from the public Contact page forms, so unlike admin-actions.ts these
 * do NOT require an admin session. The checks in
 * src/components/contact/validation.ts run in the browser and exist for UX
 * only: the backend re-validates and sanitises everything before it reaches
 * the database, and always files submissions at the first lifecycle stage, NEW.
 */
import { revalidatePath } from "next/cache";
import { apiAction } from "@/lib/api";
import type { ActionResult } from "@/lib/enquiry-constants";
import type {
  BusinessEnquiryFormData,
  GeneralEnquiryFormData,
  SampleRequestFormData,
} from "@/components/contact/types";

async function submit(
  kind: "business" | "general" | "sample",
  adminPath: string,
  input: unknown,
): Promise<ActionResult> {
  const result = await apiAction(`/api/enquiries/${kind}`, {
    method: "POST",
    body: input,
    admin: false,
  });

  if (result.ok) revalidatePath(adminPath);
  return result;
}

/** Store a business enquiry; it appears at /admin/business-enquiries with status NEW. */
export async function submitBusinessEnquiry(
  input: BusinessEnquiryFormData,
): Promise<ActionResult> {
  return submit("business", "/admin/business-enquiries", input);
}

/** Store a general enquiry; it appears at /admin/general-enquiries with status NEW. */
export async function submitGeneralEnquiry(
  input: GeneralEnquiryFormData,
): Promise<ActionResult> {
  return submit("general", "/admin/general-enquiries", input);
}

/** Store a sample request; it appears at /admin/sample-requests with status NEW. */
export async function submitSampleRequest(
  input: SampleRequestFormData,
): Promise<ActionResult> {
  return submit("sample", "/admin/sample-requests", input);
}
