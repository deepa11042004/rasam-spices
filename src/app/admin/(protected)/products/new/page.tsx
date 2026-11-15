import type { Metadata } from "next";
import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";
import { createProduct } from "@/lib/product-actions";

export const metadata: Metadata = { title: "New Product" };

export default function NewProductPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← Back to Products
      </Link>
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-neutral-800">
        New Product
      </h1>
      <ProductForm mode="create" onSubmit={createProduct} />
    </div>
  );
}
