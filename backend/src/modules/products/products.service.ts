/**
 * Product catalogue logic: public reads and admin mutations.
 *
 * Public reads return the raw database record; shaping it for the website
 * (image objects, category ids, defaults) is the frontend's job.
 */
import { prisma } from "@/lib/prisma";
import { sanitize, sanitizeId, type ActionResult } from "@/lib/sanitize";
import { deleteDishImage } from "@/modules/uploads/dish-image-storage";

export const VALID_CATEGORIES = ["ground-spices", "blended-masalas", "spices-seasonings"];
export const VALID_PACK_FORMATS = ["Box", "Pouch", ""];

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
  /** JSON string of string[] */
  packSizes?: string;
  packFormat?: string;
  pendingNote?: string;
  dishPhotoSrc?: string;
  isVisible: boolean;
  isFeatured: boolean;
};

const CATALOGUE_ORDER = [
  { category: "asc" as const },
  { sortOrder: "asc" as const },
  { name: "asc" as const },
];

// ---------------------------------------------------------------------------
// Public reads
// ---------------------------------------------------------------------------

export function listVisibleProducts() {
  return prisma.product.findMany({
    where: { isVisible: true },
    orderBy: CATALOGUE_ORDER,
  });
}

export function listFeaturedProducts() {
  return prisma.product.findMany({
    where: { isVisible: true, isFeatured: true },
    orderBy: CATALOGUE_ORDER,
  });
}

export function findVisibleBySlug(slug: string) {
  return prisma.product.findFirst({ where: { slug, isVisible: true } });
}

export function findVisibleById(id: string) {
  return prisma.product.findFirst({ where: { id, isVisible: true } });
}

export async function findSlugById(id: string): Promise<string | null> {
  const record = await prisma.product.findUnique({ where: { id }, select: { slug: true } });
  return record?.slug ?? null;
}

/** slug -> uploaded dish photo, for products that have one. */
export async function listDishPhotos(slugs: string[]) {
  const unique = [...new Set(slugs)].filter(Boolean);
  if (unique.length === 0) return [];
  return prisma.product.findMany({
    where: { slug: { in: unique }, dishPhotoSrc: { not: null } },
    select: { slug: true, dishPhotoSrc: true },
  });
}

// ---------------------------------------------------------------------------
// Admin reads
// ---------------------------------------------------------------------------

export async function searchProducts(opts: {
  q: string;
  category: string;
  visibility: string;
  page: number;
  pageSize: number;
}) {
  const where: Record<string, unknown> = {};
  if (opts.q) {
    where.OR = [
      { name: { contains: opts.q } },
      { id: { contains: opts.q } },
      { category: { contains: opts.q } },
    ];
  }
  if (opts.category) where.category = opts.category;
  if (opts.visibility === "visible" || opts.visibility === "hidden") {
    where.isVisible = opts.visibility === "visible";
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: CATALOGUE_ORDER,
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total };
}

export function getProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

// ---------------------------------------------------------------------------
// Slugs and ordering
// ---------------------------------------------------------------------------

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/** Unique slug from a name; appends -2, -3 ... when the base is taken. */
async function generateUniqueSlug(name: string): Promise<string> {
  const base = nameToSlug(name);
  if (!base) return `product-${Date.now()}`;

  if (!(await prisma.product.findUnique({ where: { slug: base } }))) return base;

  for (let i = 2; i <= 100; i++) {
    const candidate = `${base}-${i}`;
    if (!(await prisma.product.findUnique({ where: { slug: candidate } }))) return candidate;
  }

  return `${base}-${Date.now()}`;
}

async function getNextSortOrder(category: string): Promise<number> {
  const result = await prisma.product.aggregate({
    where: { category },
    _max: { sortOrder: true },
  });
  return (result._max.sortOrder ?? 0) + 1;
}

function parsePackSizes(raw: string | undefined): { ok: true; value: string[] | null } | { ok: false } {
  if (!raw) return { ok: true, value: null };
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { ok: true, value: parsed.filter((s: unknown) => typeof s === "string" && s.trim()) };
    }
    return { ok: true, value: null };
  } catch {
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// Admin mutations
// ---------------------------------------------------------------------------

export async function createProduct(data: ProductFormData): Promise<ActionResult> {
  const id = sanitizeId(data.id);
  if (!id) return { ok: false, message: "Product ID is required (lowercase, hyphens only)" };

  const name = sanitize(data.name, 200);
  if (!name) return { ok: false, message: "Product name is required" };

  const category = sanitize(data.category, 50);
  if (!VALID_CATEGORIES.includes(category)) return { ok: false, message: "Invalid category" };

  const packFormat = sanitize(data.packFormat, 20);
  if (packFormat && !VALID_PACK_FORMATS.includes(packFormat)) {
    return { ok: false, message: "Invalid pack format" };
  }

  const packSizes = parsePackSizes(data.packSizes);
  if (!packSizes.ok) return { ok: false, message: "Invalid pack sizes format" };

  if (await prisma.product.findUnique({ where: { id } })) {
    return { ok: false, message: "A product with this ID already exists" };
  }

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
        packSizes: packSizes.value ?? undefined,
        packFormat: packFormat || null,
        pendingNote: sanitize(data.pendingNote, 2000) || null,
        dishPhotoSrc: sanitize(data.dishPhotoSrc) || null,
        isVisible: Boolean(data.isVisible),
        isFeatured: Boolean(data.isFeatured),
        sortOrder: await getNextSortOrder(category),
      },
    });
    return { ok: true, message: "Product created" };
  } catch (err) {
    console.error("[createProduct]", err);
    return { ok: false, message: "Failed to create product" };
  }
}

export async function updateProduct(data: ProductFormData): Promise<ActionResult & { slug?: string | null }> {
  const id = sanitize(data.id, 100);
  if (!id) return { ok: false, message: "Product ID is required" };

  const name = sanitize(data.name, 200);
  if (!name) return { ok: false, message: "Product name is required" };

  const category = sanitize(data.category, 50);
  if (!VALID_CATEGORIES.includes(category)) return { ok: false, message: "Invalid category" };

  const packFormat = sanitize(data.packFormat, 20);
  if (packFormat && !VALID_PACK_FORMATS.includes(packFormat)) {
    return { ok: false, message: "Invalid pack format" };
  }

  const packSizes = parsePackSizes(data.packSizes);
  if (!packSizes.ok) return { ok: false, message: "Invalid pack sizes format" };

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { slug: true, category: true, sortOrder: true, dishPhotoSrc: true },
  });

  // Legacy product without a slug: generate one now. An existing slug is never changed.
  let slugUpdate: string | undefined;
  if (existing && !existing.slug) slugUpdate = await generateUniqueSlug(name);

  // Empty string clears the dish photo, restoring the static platter fallback.
  const nextDishPhotoSrc = sanitize(data.dishPhotoSrc) || null;
  const categoryChanged = Boolean(existing && category !== existing.category);

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
        packSizes: packSizes.value ?? undefined,
        packFormat: packFormat || null,
        pendingNote: sanitize(data.pendingNote, 2000) || null,
        dishPhotoSrc: nextDishPhotoSrc,
        isVisible: Boolean(data.isVisible),
        isFeatured: Boolean(data.isFeatured),
        ...(categoryChanged ? { sortOrder: await getNextSortOrder(category) } : {}),
        ...(slugUpdate ? { slug: slugUpdate } : {}),
      },
    });

    // Category changed: close the gap left in the old category.
    if (existing && categoryChanged) {
      await prisma.product.updateMany({
        where: { category: existing.category, sortOrder: { gt: existing.sortOrder } },
        data: { sortOrder: { decrement: 1 } },
      });
    }

    // The dish photo was replaced or removed: delete the file it superseded.
    // Only managed uploads are touched, never the static photos in the repo.
    if (existing?.dishPhotoSrc && existing.dishPhotoSrc !== nextDishPhotoSrc) {
      await deleteDishImage(existing.dishPhotoSrc);
    }

    return { ok: true, message: "Product updated", slug: slugUpdate ?? existing?.slug ?? null };
  } catch (err) {
    console.error("[updateProduct]", err);
    return { ok: false, message: "Failed to update product" };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, message: "Invalid ID" };

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { category: true, sortOrder: true, dishPhotoSrc: true },
    });
    if (!product) return { ok: false, message: "Product not found" };

    await prisma.product.delete({ where: { id } });
    await deleteDishImage(product.dishPhotoSrc);

    // Close the gap in the category's sort sequence.
    await prisma.product.updateMany({
      where: { category: product.category, sortOrder: { gt: product.sortOrder } },
      data: { sortOrder: { decrement: 1 } },
    });

    return { ok: true, message: "Product deleted" };
  } catch (err) {
    console.error("[deleteProduct]", err);
    return { ok: false, message: "Failed to delete product" };
  }
}

export async function setVisibility(id: string, isVisible: boolean): Promise<ActionResult> {
  try {
    await prisma.product.update({ where: { id }, data: { isVisible: Boolean(isVisible) } });
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to update visibility" };
  }
}

export async function setFeatured(id: string, isFeatured: boolean): Promise<ActionResult> {
  try {
    await prisma.product.update({ where: { id }, data: { isFeatured: Boolean(isFeatured) } });
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to update featured status" };
  }
}
