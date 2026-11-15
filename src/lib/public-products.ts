
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

export async function getPublicProduct(
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
