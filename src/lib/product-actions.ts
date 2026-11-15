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

  try {
    await prisma.product.create({
      data: {
        id,
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
        isVisible: Boolean(data.isVisible),
        isFeatured: Boolean(data.isFeatured),
        sortOrder: Math.max(0, Math.floor(Number(data.sortOrder) || 0)),
        dishPhotoSrc: sanitize(data.dishPhotoSrc) || null,
        dishPhotoAlt: sanitize(data.dishPhotoAlt, 500) || null,
        dishPhotoFocus: sanitize(data.dishPhotoFocus, 100) || null,
        dishPhotoZoom: data.dishPhotoZoom ? Number(data.dishPhotoZoom) || null : null,
      },
    });
    revalidatePath("/admin/products");
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
        isVisible: Boolean(data.isVisible),
        isFeatured: Boolean(data.isFeatured),
        sortOrder: Math.max(0, Math.floor(Number(data.sortOrder) || 0)),
        dishPhotoSrc: sanitize(data.dishPhotoSrc) || null,
        dishPhotoAlt: sanitize(data.dishPhotoAlt, 500) || null,
        dishPhotoFocus: sanitize(data.dishPhotoFocus, 100) || null,
        dishPhotoZoom: data.dishPhotoZoom ? Number(data.dishPhotoZoom) || null : null,
      },
    });
    revalidatePath("/admin/products");
    revalidatePath(`/products/${id}`);
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
    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/products");
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
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to update featured status" };
  }
}
