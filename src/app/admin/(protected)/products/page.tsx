import type { Prisma } from "../../../../../generated/prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SearchFilter from "@/components/admin/SearchFilter";
import Pagination from "@/components/admin/Pagination";
import ProductToggle from "@/components/admin/ProductToggle";

export const metadata: Metadata = { title: "Products" };

const PAGE_SIZE = 25;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const catFilter = typeof params.category === "string" ? params.category : "";
  // "visible" | "hidden"; anything else is ignored and shows everything.
  const visibilityFilter =
    params.visibility === "visible" || params.visibility === "hidden"
      ? params.visibility
      : "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.ProductWhereInput = {};

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { id: { contains: q } },
      { category: { contains: q } },
    ];
  }
  if (catFilter) where.category = catFilter;
  if (visibilityFilter) where.isVisible = visibilityFilter === "visible";

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const spRecord: Record<string, string> = {};
  if (q) spRecord.q = q;
  if (catFilter) spRecord.category = catFilter;
  if (visibilityFilter) spRecord.visibility = visibilityFilter;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 flex flex-col gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-neutral-800">
            Products
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{total} products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-700"
        >
          + New Product
        </Link>
      </div>

      <SearchFilter
        searchValue={q}
        searchPlaceholder="Search by name, ID, or category…"
        filters={[
          {
            name: "category",
            label: "Category",
            value: catFilter,
            options: [
              { value: "ground-spices", label: "Ground Spices" },
              { value: "blended-masalas", label: "Blended Masalas" },
              { value: "spices-seasonings", label: "Spices & Seasonings" },
            ],
          },
          {
            name: "visibility",
            label: "Visibility",
            value: visibilityFilter,
            options: [
              { value: "visible", label: "Visible" },
              { value: "hidden", label: "Hidden" },
            ],
          },
        ]}
      />

      {products.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-neutral-300 px-8 py-16 text-center">
          <p className="text-sm text-neutral-500">
            {q || catFilter ? "No products match your filters." : "No products in the catalogue yet."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Product</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 text-center font-medium text-neutral-600">Visible</th>
                <th className="px-4 py-3 text-center font-medium text-neutral-600">Featured</th>
                <th className="px-4 py-3 text-center font-medium text-neutral-600 hidden md:table-cell">Order</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-800">{p.name}</div>
                    <div className="text-xs text-neutral-400">{p.id}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 hidden sm:table-cell capitalize">
                    {p.category.replace(/-/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ProductToggle productId={p.id} field="visibility" checked={p.isVisible} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ProductToggle productId={p.id} field="featured" checked={p.isFeatured} />
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-500 hidden md:table-cell">{p.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/products" searchParams={spRecord} />
    </div>
  );
}
