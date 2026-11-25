/** Allowed values and validators for enquiry submissions. Re-checked server-side; never trust the browser. */

export const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "CONVERTED", "CLOSED_LOST"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const BUSINESS_TYPES = [
  "Distributor",
  "Wholesaler",
  "Retailer",
  "Supermarket / Grocery Chain",
  "Restaurant / Hotel / Catering",
  "Export / International Buyer",
  "Private Label / Manufacturing",
  "Other Business",
] as const;

export const ENQUIRY_TYPES = [
  "Product Information",
  "Pricing Enquiry",
  "Order Related",
  "Product Availability",
  "Feedback or Complaint",
  "Other",
] as const;

export const CUSTOMER_TYPES = [
  "Individual Customer",
  "Retailer",
  "Distributor",
  "Wholesaler",
  "Restaurant / Hotel",
  "Other Business",
] as const;

export const QUANTITY_UNITS = ["kg", "g", "tonnes", "packs"] as const;

export type SelectedProduct = {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: (typeof QUANTITY_UNITS)[number];
};

export function isValidEmail(value: string): boolean {
  if (!value.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidIndianMobile(value: string): boolean {
  const digits = value.replace(/[\s()+-]/g, "");
  // 10-digit Indian mobile, optionally prefixed with country code 91.
  return /^(91)?[6-9]\d{9}$/.test(digits);
}

export function isValidPinCode(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

export function isPositiveQuantity(value: string): boolean {
  if (!value.trim()) return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}
