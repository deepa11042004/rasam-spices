import type { Metadata } from "next";
import Link from "next/link";
import { listAdminProducts } from "@/lib/admin-data";
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

  const { items: products, total } = await listAdminProducts({
    q,
    category: catFilter,
    visibility: visibilityFilter,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const spRecord: Record<string, string> = {};
  if (q) spRecord.q = q;
  if (catFilter) spRecord.category = catFilter;
  if (visibilityFilter) spRecord.visibility = visibilityFilter;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 flex flex-col gap-3 border-b border-admin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-admin-ink">
            Products
          </h1>
          <p className="mt-1 text-sm text-admin-ink-muted">{total} products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-admin-spice px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-admin-spice-dark"
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
        <div className="mt-10 rounded-lg border border-dashed border-admin-border-strong px-8 py-16 text-center">
          <p className="text-sm text-admin-ink-muted">
            {q || catFilter ? "No products match your filters." : "No products in the catalogue yet."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-admin-border">
          <table className="min-w-full divide-y divide-admin-border text-sm">
            <thead className="bg-admin-cream/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-admin-ink-muted">Product</th>
                <th className="px-4 py-3 text-left font-medium text-admin-ink-muted hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 text-center font-medium text-admin-ink-muted">Visible</th>
                <th className="px-4 py-3 text-center font-medium text-admin-ink-muted">Featured</th>
                <th className="px-4 py-3 text-center font-medium text-admin-ink-muted hidden md:table-cell">Order</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border/70 bg-white">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-admin-cream/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-admin-ink">{p.name}</div>
                    <div className="text-xs text-admin-ink-muted/80">{p.id}</div>
                  </td>
                  <td className="px-4 py-3 text-admin-ink-muted hidden sm:table-cell capitalize">
                    {p.category.replace(/-/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ProductToggle productId={p.id} field="visibility" checked={p.isVisible} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ProductToggle productId={p.id} field="featured" checked={p.isFeatured} />
                  </td>
                  <td className="px-4 py-3 text-center text-admin-ink-muted hidden md:table-cell">{p.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-sm font-medium text-admin-ink-muted hover:text-admin-ink"
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
