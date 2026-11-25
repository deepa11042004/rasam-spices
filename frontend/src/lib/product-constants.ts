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
  /**
   * Optional photo of the prepared dish for this product, shown on the public
   * dish platter. Stored as a reference string such as
   * "/media/dishes/<file>"; empty string means "no dish image".
   * This is NOT the product packaging image (see imageSrc).
   */
  dishPhotoSrc?: string;
  isVisible: boolean;
  isFeatured: boolean;
};

/** Standard pack-size options offered in the admin form. */
export const PACK_SIZE_OPTIONS = ["25 g", "50 g", "100 g", "200 g", "250 g", "500 g", "1 kg"] as const;

export const VALID_CATEGORIES = ["ground-spices", "blended-masalas", "spices-seasonings"];
export const VALID_PACK_FORMATS = ["Box", "Pouch", ""];
