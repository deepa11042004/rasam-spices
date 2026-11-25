/**
 * Enquiries: public submissions from the Contact page, and the admin CRM views.
 *
 * Submissions always enter the CRM at the first lifecycle stage, NEW:
 *   NEW -> CONTACTED -> IN_PROGRESS -> CONVERTED -> CLOSED_LOST
 */
import { prisma } from "@/lib/prisma";
import { sanitize, type ActionResult } from "@/lib/sanitize";
import {
  BUSINESS_TYPES,
  CUSTOMER_TYPES,
  ENQUIRY_STATUSES,
  ENQUIRY_TYPES,
  QUANTITY_UNITS,
  isPositiveQuantity,
  isValidEmail,
  isValidIndianMobile,
  isValidPinCode,
  type SelectedProduct,
} from "./enquiries.constants";

/** Shown to the customer when something fails on our side; detail is logged, never returned. */
const GENERIC_FAILURE =
  "We couldn't submit your enquiry right now. Please try again in a moment, or contact us directly using the details on this page.";

/** An identical repeat within this window is the same enquiry (double-clicks, retries). */
const DUPLICATE_WINDOW_MS = 30_000;

const asSet = (values: readonly string[]) => new Set<string>(values);
const VALID_UNITS = asSet(QUANTITY_UNITS);
const VALID_BUSINESS_TYPES = asSet(BUSINESS_TYPES);
const VALID_ENQUIRY_TYPES = asSet(ENQUIRY_TYPES);
const VALID_CUSTOMER_TYPES = asSet(CUSTOMER_TYPES);
const VALID_STATUSES = asSet(ENQUIRY_STATUSES);

function text(value: unknown, maxLen = 2000): string {
  return sanitize(value, maxLen);
}

/** Validate and normalise selected products; null when empty or any entry is malformed. */
function normalizeProducts(input: unknown): SelectedProduct[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;

  const out: SelectedProduct[] = [];
  // Cap the list so an oversized payload cannot bloat a row.
  for (const raw of input.slice(0, 100)) {
    if (!raw || typeof raw !== "object") return null;
    const entry = raw as Record<string, unknown>;

    const id = text(entry.id, 100);
    const name = text(entry.name, 200);
    const category = text(entry.category, 100);
    const quantity = text(entry.quantity, 50);
    const unit = text(entry.unit, 20);

    if (!id || !name) return null;
    if (!isPositiveQuantity(quantity)) return null;
    if (!VALID_UNITS.has(unit)) return null;

    out.push({ id, name, category, quantity, unit: unit as SelectedProduct["unit"] });
  }
  return out;
}

const PRODUCTS_REQUIRED =
  "Select at least one product and enter a quantity greater than 0 for each.";

// ---------------------------------------------------------------------------
// Public submissions
// ---------------------------------------------------------------------------

export async function submitBusinessEnquiry(input: Record<string, unknown>): Promise<ActionResult> {
  try {
    const contactPerson = text(input?.contactPerson, 200);
    const businessName = text(input?.businessName, 200);
    const businessEmail = text(input?.businessEmail, 254);
    const mobileNumber = text(input?.mobileNumber, 30);
    const businessType = text(input?.businessType, 100);
    const businessLocation = text(input?.businessLocation, 300);
    const website = text(input?.website, 500);
    const gstin = text(input?.gstin, 50);
    const message = text(input?.message, 5000);

    if (!contactPerson) return { ok: false, message: "Enter the contact person's name." };
    if (!businessName) return { ok: false, message: "Enter your business name." };
    if (!isValidEmail(businessEmail)) return { ok: false, message: "Enter a valid business email address." };
    if (!isValidIndianMobile(mobileNumber)) return { ok: false, message: "Enter a valid 10-digit mobile number." };
    if (!VALID_BUSINESS_TYPES.has(businessType)) return { ok: false, message: "Select a valid business type." };
    if (!businessLocation) return { ok: false, message: "Enter your business location." };

    const products = normalizeProducts(input?.selectedProducts);
    if (!products) return { ok: false, message: PRODUCTS_REQUIRED };

    const duplicate = await prisma.businessEnquiry.findFirst({
      where: {
        businessEmail,
        businessName,
        createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      },
      select: { id: true },
    });
    if (duplicate) return { ok: true, message: "Enquiry already received." };

    await prisma.businessEnquiry.create({
      data: {
        contactPerson,
        businessName,
        businessEmail,
        mobileNumber,
        businessType,
        businessLocation,
        website: website || null,
        gstin: gstin || null,
        products,
        message: message || null,
        status: "NEW",
      },
    });
    return { ok: true };
  } catch (err) {
    console.error("[submitBusinessEnquiry]", err);
    return { ok: false, message: GENERIC_FAILURE };
  }
}

export async function submitGeneralEnquiry(input: Record<string, unknown>): Promise<ActionResult> {
  try {
    const fullName = text(input?.fullName, 200);
    const companyName = text(input?.companyName, 200);
    const email = text(input?.email, 254);
    const mobileNumber = text(input?.mobileNumber, 30);
    const enquiryType = text(input?.enquiryType, 100);
    const subject = text(input?.subject, 300);
    const message = text(input?.message, 5000);

    if (!fullName) return { ok: false, message: "Enter your full name." };
    if (!isValidEmail(email)) return { ok: false, message: "Enter a valid email address." };
    if (!isValidIndianMobile(mobileNumber)) return { ok: false, message: "Enter a valid 10-digit mobile number." };
    if (!VALID_ENQUIRY_TYPES.has(enquiryType)) return { ok: false, message: "Select a valid enquiry type." };
    if (!subject) return { ok: false, message: "Enter a subject." };
    if (!message) return { ok: false, message: "Enter your message." };

    const duplicate = await prisma.generalEnquiry.findFirst({
      where: { email, subject, createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) } },
      select: { id: true },
    });
    if (duplicate) return { ok: true, message: "Enquiry already received." };

    await prisma.generalEnquiry.create({
      data: {
        fullName,
        companyName: companyName || null,
        email,
        mobileNumber,
        enquiryType,
        subject,
        message,
        status: "NEW",
      },
    });
    return { ok: true };
  } catch (err) {
    console.error("[submitGeneralEnquiry]", err);
    return { ok: false, message: GENERIC_FAILURE };
  }
}

export async function submitSampleRequest(input: Record<string, unknown>): Promise<ActionResult> {
  try {
    const fullName = text(input?.fullName, 200);
    const companyName = text(input?.companyName, 200);
    const email = text(input?.email, 254);
    const mobileNumber = text(input?.mobileNumber, 30);
    const customerType = text(input?.customerType, 100);
    const address = text(input?.address, 2000);
    const city = text(input?.city, 150);
    const state = text(input?.state, 150);
    const pinCode = text(input?.pinCode, 20);
    const country = text(input?.country, 150);
    const message = text(input?.message, 5000);

    if (!fullName) return { ok: false, message: "Enter your full name." };
    if (!isValidEmail(email)) return { ok: false, message: "Enter a valid email address." };
    if (!isValidIndianMobile(mobileNumber)) return { ok: false, message: "Enter a valid 10-digit mobile number." };
    if (!VALID_CUSTOMER_TYPES.has(customerType)) return { ok: false, message: "Select a valid customer type." };
    if (!address) return { ok: false, message: "Enter your full delivery address." };
    if (!city) return { ok: false, message: "Enter your city." };
    if (!state) return { ok: false, message: "Enter your state." };
    if (!isValidPinCode(pinCode)) return { ok: false, message: "Enter a valid 6-digit PIN code." };
    if (!country) return { ok: false, message: "Enter your country." };

    const products = normalizeProducts(input?.selectedProducts);
    if (!products) return { ok: false, message: PRODUCTS_REQUIRED };

    const duplicate = await prisma.sampleRequest.findFirst({
      where: { email, pinCode, createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) } },
      select: { id: true },
    });
    if (duplicate) return { ok: true, message: "Request already received." };

    await prisma.sampleRequest.create({
      data: {
        fullName,
        companyName: companyName || null,
        email,
        mobileNumber,
        customerType,
        products,
        address,
        city,
        state,
        pinCode,
        country,
        message: message || null,
        status: "NEW",
      },
    });
    return { ok: true };
  } catch (err) {
    console.error("[submitSampleRequest]", err);
    return { ok: false, message: GENERIC_FAILURE };
  }
}

// ---------------------------------------------------------------------------
// Admin CRM
// ---------------------------------------------------------------------------

export type EnquiryKind = "general" | "business" | "sample";

export function isEnquiryKind(value: string): value is EnquiryKind {
  return value === "general" || value === "business" || value === "sample";
}

const SEARCH_FIELDS: Record<EnquiryKind, string[]> = {
  general: ["fullName", "email", "mobileNumber", "companyName", "subject"],
  business: ["contactPerson", "businessName", "businessEmail", "mobileNumber", "businessLocation"],
  sample: ["fullName", "email", "mobileNumber", "companyName", "city", "state"],
};

export async function listEnquiries(
  kind: EnquiryKind,
  opts: { q: string; status: string; type: string; page: number; pageSize: number },
) {
  const where: Record<string, unknown> = {};
  if (opts.q) where.OR = SEARCH_FIELDS[kind].map((field) => ({ [field]: { contains: opts.q } }));
  if (opts.status) where.status = opts.status;
  if (kind === "general" && opts.type) where.enquiryType = opts.type;

  const args = {
    where,
    orderBy: { createdAt: "desc" as const },
    skip: (opts.page - 1) * opts.pageSize,
    take: opts.pageSize,
  };

  switch (kind) {
    case "general": {
      const [items, total] = await Promise.all([
        prisma.generalEnquiry.findMany(args),
        prisma.generalEnquiry.count({ where }),
      ]);
      return { items, total };
    }
    case "business": {
      const [items, total] = await Promise.all([
        prisma.businessEnquiry.findMany(args),
        prisma.businessEnquiry.count({ where }),
      ]);
      return { items, total };
    }
    case "sample": {
      const [items, total] = await Promise.all([
        prisma.sampleRequest.findMany(args),
        prisma.sampleRequest.count({ where }),
      ]);
      return { items, total };
    }
  }
}

export function getEnquiry(kind: EnquiryKind, id: string) {
  switch (kind) {
    case "general":
      return prisma.generalEnquiry.findUnique({ where: { id } });
    case "business":
      return prisma.businessEnquiry.findUnique({ where: { id } });
    case "sample":
      return prisma.sampleRequest.findUnique({ where: { id } });
  }
}

async function updateEnquiry(kind: EnquiryKind, id: string, data: { status?: string; adminNotes?: string | null }) {
  switch (kind) {
    case "general":
      await prisma.generalEnquiry.update({ where: { id }, data });
      return;
    case "business":
      await prisma.businessEnquiry.update({ where: { id }, data });
      return;
    case "sample":
      await prisma.sampleRequest.update({ where: { id }, data });
      return;
  }
}

export async function setEnquiryStatus(kind: EnquiryKind, id: string, status: unknown): Promise<ActionResult> {
  if (typeof status !== "string" || !VALID_STATUSES.has(status)) return { ok: false, message: "Invalid status" };
  if (!id) return { ok: false, message: "Invalid ID" };
  try {
    await updateEnquiry(kind, id, { status });
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to update status" };
  }
}

export async function setEnquiryNotes(kind: EnquiryKind, id: string, notes: unknown): Promise<ActionResult> {
  if (!id) return { ok: false, message: "Invalid ID" };
  try {
    await updateEnquiry(kind, id, { adminNotes: text(notes, 5000) || null });
    return { ok: true, message: "Notes saved" };
  } catch {
    return { ok: false, message: "Failed to save notes" };
  }
}
