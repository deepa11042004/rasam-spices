"use server";

/**
 * Server actions for product catalogue management.
 * Every action verifies the admin session before mutations.
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionAdmin } from "@/lib/admin-session";
import type { ActionResult, ProductFormData } from "@/lib/product-constants";
import { VALID_CATEGORIES, VALID_PACK_FORMATS } from "@/lib/product-constants";
import { deleteDishImage } from "@/lib/dish-image-storage";


function sanitize(value: unknown, maxLen = 1000): string {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, maxLen);
}

function sanitizeId(value: unknown): string {
  if (typeof value !== "string") return "";
  // IDs: lowercase alphanumeric + hyphens only
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 100);
}

/**
 * Convert a product name into a URL-safe slug.
 * e.g. "Garam Masala Powder" → "garam-masala-powder"
 */
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")  // non-alphanum → hyphen
    .replace(/^-+|-+$/g, "")       // trim leading/trailing hyphens
    .slice(0, 100);
}

/**
 * Generate a unique slug for a product. If the base slug is taken,
 * appends -2, -3, etc. until a unique one is found.
 * Safe for concurrent creation via unique constraint check.
 */
async function generateUniqueSlug(name: string): Promise<string> {
  const base = nameToSlug(name);
  if (!base) return `product-${Date.now()}`;

  // Try the base slug first
  const existing = await prisma.product.findUnique({ where: { slug: base } });
  if (!existing) return base;

  // Append incrementing suffix
  for (let i = 2; i <= 100; i++) {
    const candidate = `${base}-${i}`;
    const taken = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!taken) return candidate;
  }

  // Extremely unlikely fallback
  return `${base}-${Date.now()}`;
}

/**
 * Get the next sort order for a product in a given category.
 * Returns max(sortOrder) + 1 within the category, or 1 if the category is empty.
 */
async function getNextSortOrder(category: string): Promise<number> {
  const result = await prisma.product.aggregate({
    where: { category },
    _max: { sortOrder: true },
  });
  return (result._max.sortOrder ?? 0) + 1;
}


export async function createProduct(data: ProductFormData): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };

  const id = sanitizeId(data.id);
  if (!id) return { ok: false, message: "Product ID is required (lowercase, hyphens only)" };

  const name = sanitize(data.name, 200);
  if (!name) return { ok: false, message: "Product name is required" };

  const category = sanitize(data.category, 50);
  if (!VALID_CATEGORIES.includes(category)) return { ok: false, message: "Invalid category" };

  const packFormat = sanitize(data.packFormat, 20);
  if (packFormat && !VALID_PACK_FORMATS.includes(packFormat)) return { ok: false, message: "Invalid pack format" };

  let packSizes: string[] | null = null;
  if (data.packSizes) {
    try {
      const parsed = JSON.parse(data.packSizes);
      if (Array.isArray(parsed)) packSizes = parsed.filter((s: unknown) => typeof s === "string" && s.trim());
    } catch {
      return { ok: false, message: "Invalid pack sizes format" };
    }
  }

  // Check for duplicate ID
  const existing = await prisma.product.findUnique({ where: { id } });
  if (existing) return { ok: false, message: "A product with this ID already exists" };

  // Generate a unique slug from the product name
  const slug = await generateUniqueSlug(name);

  try {
    await prisma.product.create({
      data: {
        id,
        slug,
        name,
        category,
        description: sanitize(data.description, 5000) || null,
        tagline: sanitize(data.tagline, 500) || null,
        imageSrc: sanitize(data.imageSrc) || null,
        imageAlt: sanitize(data.imageAlt, 500) || null,
        backImageSrc: sanitize(data.backImageSrc) || null,
        backImageAlt: sanitize(data.backImageAlt, 500) || null,
        packSizes: packSizes ?? undefined,
        packFormat: packFormat || null,
        pendingNote: sanitize(data.pendingNote, 2000) || null,
        // Optional dish photo reference (e.g. "/media/dishes/<file>").
        dishPhotoSrc: sanitize(data.dishPhotoSrc) || null,
        isVisible: Boolean(data.isVisible),
        isFeatured: Boolean(data.isFeatured),
        sortOrder: await getNextSortOrder(category),
      },
    });
    revalidatePath("/admin/products");
    revalidatePath("/admin"); // dashboard category + inventory counts
    revalidatePath("/products");
    revalidatePath("/");
    return { ok: true, message: "Product created" };
  } catch (err) {
    console.error("[createProduct]", err);
    return { ok: false, message: "Failed to create product" };
  }
}

export async function updateProduct(data: ProductFormData): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };

  const id = sanitize(data.id, 100);
  if (!id) return { ok: false, message: "Product ID is required" };

  const name = sanitize(data.name, 200);
  if (!name) return { ok: false, message: "Product name is required" };

  const category = sanitize(data.category, 50);
  if (!VALID_CATEGORIES.includes(category)) return { ok: false, message: "Invalid category" };

  const packFormat = sanitize(data.packFormat, 20);
  if (packFormat && !VALID_PACK_FORMATS.includes(packFormat)) return { ok: false, message: "Invalid pack format" };

  let packSizes: string[] | null = null;
  if (data.packSizes) {
    try {
      const parsed = JSON.parse(data.packSizes);
      if (Array.isArray(parsed)) packSizes = parsed.filter((s: unknown) => typeof s === "string" && s.trim());
    } catch {
      return { ok: false, message: "Invalid pack sizes format" };
    }
  }

  // Look up the existing product to get its current slug, category and dish photo
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    select: { slug: true, category: true, sortOrder: true, dishPhotoSrc: true },
  });

  // If the product has no slug yet (legacy product), generate one now
  let slugUpdate: string | undefined;
  if (existingProduct && !existingProduct.slug) {
    slugUpdate = await generateUniqueSlug(name);
  }
  // If the product already has a slug, do NOT change it (requirement 4)

  // Dish photo: empty string clears it, restoring the static platter fallback.
  const nextDishPhotoSrc = sanitize(data.dishPhotoSrc) || null;

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        description: sanitize(data.description, 5000) || null,
        tagline: sanitize(data.tagline, 500) || null,
        imageSrc: sanitize(data.imageSrc) || null,
        imageAlt: sanitize(data.imageAlt, 500) || null,
        backImageSrc: sanitize(data.backImageSrc) || null,
        backImageAlt: sanitize(data.backImageAlt, 500) || null,
        packSizes: packSizes ?? undefined,
        packFormat: packFormat || null,
        pendingNote: sanitize(data.pendingNote, 2000) || null,
        // Optional dish photo reference; empty clears it back to the static fallback.
        dishPhotoSrc: nextDishPhotoSrc,
        isVisible: Boolean(data.isVisible),
        isFeatured: Boolean(data.isFeatured),
        // If category changed, assign sort order at end of new category and compact old category
        ...(existingProduct && category !== existingProduct.category
          ? { sortOrder: await getNextSortOrder(category) }
          : {}),
        ...(slugUpdate ? { slug: slugUpdate } : {}),
      },
    });
    // If category changed, compact the old category's sort order
    if (existingProduct && category !== existingProduct.category) {
      await prisma.product.updateMany({
        where: {
          category: existingProduct.category,
          sortOrder: { gt: existingProduct.sortOrder },
        },
        data: { sortOrder: { decrement: 1 } },
      });
    }

    // The dish photo was replaced or removed: delete the file it superseded.
    // Only files under the managed media prefix are touched, so the static
    // dish photos that ship with the repository are never removed.
    if (
      existingProduct?.dishPhotoSrc &&
      existingProduct.dishPhotoSrc !== nextDishPhotoSrc
    ) {
      await deleteDishImage(existingProduct.dishPhotoSrc);
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin"); // dashboard category + inventory counts
    revalidatePath(`/products/${id}`);
    // Also revalidate the slug path if it exists
    const finalSlug = slugUpdate ?? existingProduct?.slug;
    if (finalSlug) {
      revalidatePath(`/products/${finalSlug}`);
    }
    revalidatePath("/products");
    revalidatePath("/");
    return { ok: true, message: "Product updated" };
  } catch (err) {
    console.error("[updateProduct]", err);
    return { ok: false, message: "Failed to update product" };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };
  if (!id || typeof id !== "string") return { ok: false, message: "Invalid ID" };

  try {
    // Look up the product to know its category, sortOrder and dish photo before deleting
    const product = await prisma.product.findUnique({
      where: { id },
      select: { category: true, sortOrder: true, dishPhotoSrc: true },
    });
    if (!product) return { ok: false, message: "Product not found" };

    // Delete the product
    await prisma.product.delete({ where: { id } });

    // Remove its uploaded dish image file, if it had one.
    await deleteDishImage(product.dishPhotoSrc);

    // Compact sort order: close the gap in the category sequence.
    // All products in the same category with a higher sortOrder get decremented.
    await prisma.product.updateMany({
      where: {
        category: product.category,
        sortOrder: { gt: product.sortOrder },
      },
      data: {
        sortOrder: { decrement: 1 },
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin"); // dashboard category + inventory counts
    revalidatePath("/products");
    revalidatePath("/");
    return { ok: true, message: "Product deleted" };
  } catch (err) {
    console.error("[deleteProduct]", err);
    return { ok: false, message: "Failed to delete product" };
  }
}

export async function toggleProductVisibility(id: string, isVisible: boolean): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };

  try {
    await prisma.product.update({ where: { id }, data: { isVisible } });
    revalidatePath("/admin/products");
    revalidatePath("/admin"); // dashboard category + inventory counts
    revalidatePath("/products");
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to update visibility" };
  }
}

export async function toggleProductFeatured(id: string, isFeatured: boolean): Promise<ActionResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };

  try {
    await prisma.product.update({ where: { id }, data: { isFeatured } });
    revalidatePath("/admin/products");
    revalidatePath("/admin"); // dashboard category + inventory counts
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to update featured status" };
  }
}
