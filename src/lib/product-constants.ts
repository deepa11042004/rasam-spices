/**
 * Types and constants for product catalogue management.
 * Extracted from product-actions.ts so that "use server" files
 * only export async functions (Next.js 16 requirement).
 */

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

export type ProductFormData = {
  id: string;
  name: string;
  category: string;
  description?: string;
  tagline?: string;
  imageSrc?: string;
  imageAlt?: string;
  backImageSrc?: string;
  backImageAlt?: string;
  packSizes?: string;        // JSON string of string[]
  packFormat?: string;
  pendingNote?: string;
  isVisible: boolean;
  isFeatured: boolean;
  sortOrder: number;
  // Dish photo fields
  dishPhotoSrc?: string;
  dishPhotoAlt?: string;
  dishPhotoFocus?: string;
  dishPhotoZoom?: number;
};

export const VALID_CATEGORIES = ["ground-spices", "blended-masalas", "spices-seasonings"];
export const VALID_PACK_FORMATS = ["Box", "Pouch", ""];
