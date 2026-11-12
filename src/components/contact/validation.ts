// Shared validation helpers for the Contact page enquiry forms.

import type { SelectedProduct } from "./types";

export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidEmail(value: string): boolean {
  if (!value.trim()) return false;
  // Simple, permissive RFC-5322-ish check — good enough for client-side validation.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidIndianMobile(value: string): boolean {
  const digits = value.replace(/[\s()+-]/g, "");
  // Accept a 10-digit Indian mobile number, optionally prefixed with country code 91.
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

export function validateSelectedProductQuantities(
  products: SelectedProduct[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const product of products) {
    if (!isPositiveQuantity(product.quantity)) {
      errors[product.id] = "Enter a quantity greater than 0";
    }
  }
  return errors;
}
