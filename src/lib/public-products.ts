
import { prisma } from "@/lib/prisma";
import { categories, type CategoryId, type Product } from "@/data/products";

type ProductRecord = Awaited<
  ReturnType<typeof prisma.product.findMany>
>[number];

const validCategories = new Set<string>(
  categories.map((category) => category.id),
);

function toCategoryId(value: string): CategoryId {
  if (!validCategories.has(value)) {
    throw new Error(`Unsupported product category: ${value}`);
  }

  return value as CategoryId;
}

function toFrontendProduct(record: ProductRecord): Product {
  const packSizes = Array.isArray(record.packSizes)
    ? record.packSizes.filter(
        (size): size is string => typeof size === "string",
      )
    : undefined;

  return {
    id: record.id,
    slug: record.slug ?? undefined,
    name: record.name,
    category: toCategoryId(record.category),
    description: record.description ?? undefined,
    tagline: record.tagline ?? undefined,

    image: record.imageSrc
      ? {
          src: record.imageSrc,
          alt: record.imageAlt ?? record.name,
        }
      : undefined,

    backImage: record.backImageSrc
      ? {
          src: record.backImageSrc,
          alt: record.backImageAlt ?? `${record.name} packaging`,
        }
      : undefined,

    // Admin-uploaded prepared-dish photo for this product, if any.
    dishPhoto: record.dishPhotoSrc
      ? {
          src: record.dishPhotoSrc,
          alt: `${record.name} prepared dish`,
        }
      : undefined,

    packSizes,
    packFormat:
      record.packFormat === "Box" || record.packFormat === "Pouch"
        ? record.packFormat
        : undefined,
    pendingNote: record.pendingNote ?? undefined,
    featured: record.isFeatured,
  };
}

export async function getPublicProducts(): Promise<Product[]> {
  const records = await prisma.product.findMany({
    where: { isVisible: true },
    orderBy: [
      { category: "asc" },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });

  return records.map(toFrontendProduct);
}

/**
 * The featured products shown publicly, in catalogue order.
 *
 * Single source of truth for both the homepage "Featured Spices" section and
 * the Products page "Featured products" slider, so the two can never drift:
 * eligibility is the same public rule used everywhere else (visible), plus
 * the admin's featured flag. A product that is hidden, unfeatured, deleted or
 * recategorised stops appearing in both places at once.
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  const records = await prisma.product.findMany({
    where: {
      isVisible: true,
      isFeatured: true,
    },
    orderBy: [
      { category: "asc" },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });

  return records.map(toFrontendProduct);
}

/**
 * Look up a visible product by its URL slug.
 */
export async function getPublicProductBySlug(
  slug: string,
): Promise<Product | null> {
  const record = await prisma.product.findFirst({
    where: {
      slug,
      isVisible: true,
    },
  });

  return record ? toFrontendProduct(record) : null;
}

/**
 * Look up a visible product by its internal ID.
 * Used for ID→slug redirects on legacy URLs.
 */
export async function getPublicProductById(
  id: string,
): Promise<Product | null> {
  const record = await prisma.product.findFirst({
    where: {
      id,
      isVisible: true,
    },
  });

  return record ? toFrontendProduct(record) : null;
}

/**
 * Look up any product (visible or not) by its internal ID.
 * Returns the slug if set, for redirect purposes.
 */
export async function getProductSlugById(
  id: string,
): Promise<string | null> {
  const record = await prisma.product.findUnique({
    where: { id },
    select: { slug: true },
  });

  return record?.slug ?? null;
}
