"use server";

/**
 * Public enquiry submission actions.
 *
 * Called from the public Contact page forms, so unlike admin-actions.ts these
 * do NOT require an admin session. Everything that reaches the database is
 * re-validated and sanitised here: the checks in
 * src/components/contact/validation.ts run in the browser and exist for UX
 * only, so they cannot be trusted.
 *
 * Submissions always enter the CRM at the first lifecycle stage, NEW. The
 * existing five-stage workflow is unchanged:
 *   NEW -> CONTACTED -> IN_PROGRESS -> CONVERTED -> CLOSED_LOST
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/enquiry-constants";
import { BUSINESS_TYPES, CUSTOMER_TYPES, ENQUIRY_TYPES } from "@/components/contact/types";
import type {
  BusinessEnquiryFormData,
  BusinessType,
  CustomerType,
  EnquiryType,
  GeneralEnquiryFormData,
  QuantityUnit,
  SampleRequestFormData,
  SelectedProduct,
} from "@/components/contact/types";
import {
  isPositiveQuantity,
  isValidEmail,
  isValidIndianMobile,
  isValidPinCode,
} from "@/components/contact/validation";

/** Shown to the customer when something fails on our side. Deliberately
 *  generic: internal error detail is logged, never returned. */
const GENERIC_FAILURE =
  "We couldn't submit your enquiry right now. Please try again in a moment, or contact us directly using the details on this page.";

/** Window within which an identical repeat submission is treated as the same
 *  enquiry rather than a second one, guarding against double-clicks, retries
 *  and duplicate POSTs. */
const DUPLICATE_WINDOW_MS = 30_000;

const VALID_UNITS = new Set<string>(["kg", "g", "tonnes", "packs"]);
const VALID_BUSINESS_TYPES = new Set<string>(BUSINESS_TYPES);
const VALID_ENQUIRY_TYPES = new Set<string>(ENQUIRY_TYPES);
const VALID_CUSTOMER_TYPES = new Set<string>(CUSTOMER_TYPES);

function sanitize(value: unknown, maxLen = 2000): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .slice(0, maxLen);
}

/**
 * Validate and normalise the selected products.
 * Returns null when the selection is empty or any entry is malformed.
 */
function normalizeProducts(input: unknown): SelectedProduct[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;

  const out: SelectedProduct[] = [];

  // Cap the list so an oversized payload can't be used to bloat a row.
  for (const raw of input.slice(0, 100)) {
    if (!raw || typeof raw !== "object") return null;
    const entry = raw as Record<string, unknown>;

    const id = sanitize(entry.id, 100);
    const name = sanitize(entry.name, 200);
    const category = sanitize(entry.category, 100);
    const quantity = sanitize(entry.quantity, 50);
    const unit = sanitize(entry.unit, 20);

    if (!id || !name) return null;
    if (!isPositiveQuantity(quantity)) return null;
    if (!VALID_UNITS.has(unit)) return null;

    out.push({ id, name, category, quantity, unit: unit as QuantityUnit });
  }

  return out;
}

/**
 * Store a business enquiry submitted from the public Contact page.
 *
 * Writes to the existing BusinessEnquiry CRM table so the enquiry shows up at
 * /admin/business-enquiries with status NEW.
 */
export async function submitBusinessEnquiry(
  input: BusinessEnquiryFormData,
): Promise<ActionResult> {
  try {
    const contactPerson = sanitize(input?.contactPerson, 200);
    const businessName = sanitize(input?.businessName, 200);
    const businessEmail = sanitize(input?.businessEmail, 254);
    const mobileNumber = sanitize(input?.mobileNumber, 30);
    const businessType = sanitize(input?.businessType, 100);
    const businessLocation = sanitize(input?.businessLocation, 300);
    const website = sanitize(input?.website, 500);
    const gstin = sanitize(input?.gstin, 50);
    const message = sanitize(input?.message, 5000);

    // --- Required fields, re-checked server-side ---
    if (!contactPerson) {
      return { ok: false, message: "Enter the contact person's name." };
    }
    if (!businessName) {
      return { ok: false, message: "Enter your business name." };
    }
    if (!isValidEmail(businessEmail)) {
      return { ok: false, message: "Enter a valid business email address." };
    }
    if (!isValidIndianMobile(mobileNumber)) {
      return { ok: false, message: "Enter a valid 10-digit mobile number." };
    }
    if (!VALID_BUSINESS_TYPES.has(businessType)) {
      return { ok: false, message: "Select a valid business type." };
    }
    if (!businessLocation) {
      return { ok: false, message: "Enter your business location." };
    }

    const products = normalizeProducts(input?.selectedProducts);
    if (!products) {
      return {
        ok: false,
        message:
          "Select at least one product and enter a quantity greater than 0 for each.",
      };
    }

    // --- Duplicate guard ---
    // A repeat of the same enquiry within the window is treated as the one
    // already stored, so a double-click never creates two CRM records.
    const recentDuplicate = await prisma.businessEnquiry.findFirst({
      where: {
        businessEmail,
        businessName,
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      select: { id: true },
    });

    if (recentDuplicate) {
      return { ok: true, message: "Enquiry already received." };
    }

    await prisma.businessEnquiry.create({
      data: {
        contactPerson,
        businessName,
        businessEmail,
        mobileNumber,
        businessType: businessType as BusinessType,
        businessLocation,
        website: website || null,
        gstin: gstin || null,
        products,
        message: message || null,
        // First stage of the existing CRM lifecycle.
        status: "NEW",
      },
    });

    revalidatePath("/admin/business-enquiries");

    return { ok: true };
  } catch (err) {
    // Log the real error for operators; return nothing internal to the client.
    console.error("[submitBusinessEnquiry]", err);
    return { ok: false, message: GENERIC_FAILURE };
  }
}

/**
 * Store a general enquiry submitted from the public Contact page.
 *
 * Writes to the existing GeneralEnquiry CRM table so the enquiry shows up at
 * /admin/general-enquiries with status NEW. The customer's chosen enquiry
 * type (Product Information, Pricing Enquiry, ...) is stored in enquiryType.
 */
export async function submitGeneralEnquiry(
  input: GeneralEnquiryFormData,
): Promise<ActionResult> {
  try {
    const fullName = sanitize(input?.fullName, 200);
    const companyName = sanitize(input?.companyName, 200);
    const email = sanitize(input?.email, 254);
    const mobileNumber = sanitize(input?.mobileNumber, 30);
    const enquiryType = sanitize(input?.enquiryType, 100);
    const subject = sanitize(input?.subject, 300);
    const message = sanitize(input?.message, 5000);

    // --- Required fields, re-checked server-side ---
    if (!fullName) {
      return { ok: false, message: "Enter your full name." };
    }
    if (!isValidEmail(email)) {
      return { ok: false, message: "Enter a valid email address." };
    }
    if (!isValidIndianMobile(mobileNumber)) {
      return { ok: false, message: "Enter a valid 10-digit mobile number." };
    }
    if (!VALID_ENQUIRY_TYPES.has(enquiryType)) {
      return { ok: false, message: "Select a valid enquiry type." };
    }
    if (!subject) {
      return { ok: false, message: "Enter a subject." };
    }
    if (!message) {
      return { ok: false, message: "Enter your message." };
    }

    // --- Duplicate guard ---
    const recentDuplicate = await prisma.generalEnquiry.findFirst({
      where: {
        email,
        subject,
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      select: { id: true },
    });

    if (recentDuplicate) {
      return { ok: true, message: "Enquiry already received." };
    }

    await prisma.generalEnquiry.create({
      data: {
        fullName,
        companyName: companyName || null,
        email,
        mobileNumber,
        enquiryType: enquiryType as EnquiryType,
        subject,
        message,
        // First stage of the existing CRM lifecycle.
        status: "NEW",
      },
    });

    revalidatePath("/admin/general-enquiries");

    return { ok: true };
  } catch (err) {
    console.error("[submitGeneralEnquiry]", err);
    return { ok: false, message: GENERIC_FAILURE };
  }
}

/**
 * Store a sample request submitted from the public Contact page.
 *
 * Writes to the existing SampleRequest CRM table so the request shows up at
 * /admin/sample-requests with status NEW.
 */
export async function submitSampleRequest(
  input: SampleRequestFormData,
): Promise<ActionResult> {
  try {
    const fullName = sanitize(input?.fullName, 200);
    const companyName = sanitize(input?.companyName, 200);
    const email = sanitize(input?.email, 254);
    const mobileNumber = sanitize(input?.mobileNumber, 30);
    const customerType = sanitize(input?.customerType, 100);
    const address = sanitize(input?.address, 2000);
    const city = sanitize(input?.city, 150);
    const state = sanitize(input?.state, 150);
    const pinCode = sanitize(input?.pinCode, 20);
    const country = sanitize(input?.country, 150);
    const message = sanitize(input?.message, 5000);

    // --- Required fields, re-checked server-side ---
    if (!fullName) {
      return { ok: false, message: "Enter your full name." };
    }
    if (!isValidEmail(email)) {
      return { ok: false, message: "Enter a valid email address." };
    }
    if (!isValidIndianMobile(mobileNumber)) {
      return { ok: false, message: "Enter a valid 10-digit mobile number." };
    }
    if (!VALID_CUSTOMER_TYPES.has(customerType)) {
      return { ok: false, message: "Select a valid customer type." };
    }
    if (!address) {
      return { ok: false, message: "Enter your full delivery address." };
    }
    if (!city) {
      return { ok: false, message: "Enter your city." };
    }
    if (!state) {
      return { ok: false, message: "Enter your state." };
    }
    if (!isValidPinCode(pinCode)) {
      return { ok: false, message: "Enter a valid 6-digit PIN code." };
    }
    if (!country) {
      return { ok: false, message: "Enter your country." };
    }

    const products = normalizeProducts(input?.selectedProducts);
    if (!products) {
      return {
        ok: false,
        message:
          "Select at least one product and enter a quantity greater than 0 for each.",
      };
    }

    // --- Duplicate guard ---
    const recentDuplicate = await prisma.sampleRequest.findFirst({
      where: {
        email,
        pinCode,
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      select: { id: true },
    });

    if (recentDuplicate) {
      return { ok: true, message: "Request already received." };
    }

    await prisma.sampleRequest.create({
      data: {
        fullName,
        companyName: companyName || null,
        email,
        mobileNumber,
        customerType: customerType as CustomerType,
        products,
        address,
        city,
        state,
        pinCode,
        country,
        message: message || null,
        // First stage of the existing CRM lifecycle.
        status: "NEW",
      },
    });

    revalidatePath("/admin/sample-requests");

    return { ok: true };
  } catch (err) {
    console.error("[submitSampleRequest]", err);
    return { ok: false, message: GENERIC_FAILURE };
  }
}
