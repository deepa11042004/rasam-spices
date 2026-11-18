import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import { updateProduct, deleteProduct } from "@/lib/product-actions";
import { dishes } from "@/data/dishes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product ? `Edit ${product.name}` : "Product Not Found" };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    
  });
  if (!product) notFound();

  const packSizesStr = product.packSizes ? JSON.stringify(product.packSizes) : "[]";

  // A dish image is only rendered for products paired with a platter dish.
  // dishes[].productId matches the database slug (both are kebab-case names).
  const platterDishName =
    dishes.find((dish) => dish.productId === product.slug)?.name ?? null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← Back to Products
      </Link>
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-neutral-800">
        Edit: {product.name}
      </h1>
      <ProductForm
        mode="edit"
        platterDishName={platterDishName}
        initialData={{
          id: product.id,
          name: product.name,
          category: product.category,
          description: product.description ?? "",
          tagline: product.tagline ?? "",
          imageSrc: product.imageSrc ?? "",
          imageAlt: product.imageAlt ?? "",
          backImageSrc: product.backImageSrc ?? "",
          backImageAlt: product.backImageAlt ?? "",
          dishPhotoSrc: product.dishPhotoSrc ?? "",
          packSizes: packSizesStr,
          packFormat: product.packFormat ?? "",
          pendingNote: product.pendingNote ?? "",
          isVisible: product.isVisible,
          isFeatured: product.isFeatured,
        }}
        onSubmit={updateProduct}
        onDelete={deleteProduct}
      />
    </div>
  );
}
