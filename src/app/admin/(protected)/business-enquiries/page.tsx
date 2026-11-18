import type { Prisma } from "../../../../../generated/prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ENQUIRY_STATUSES } from "@/lib/enquiry-constants";
import StatusBadge from "@/components/admin/StatusBadge";
import SearchFilter from "@/components/admin/SearchFilter";
import Pagination from "@/components/admin/Pagination";

export const metadata: Metadata = { title: "Business Enquiries" };

const PAGE_SIZE = 20;

export default async function BusinessEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.BusinessEnquiryWhereInput = {};

  if (q) {
    where.OR = [
      { contactPerson: { contains: q } },
      { businessName: { contains: q } },
      { businessEmail: { contains: q } },
      { mobileNumber: { contains: q } },
      { businessLocation: { contains: q } },
    ];
  }
  if (statusFilter) where.status = statusFilter;

  const [enquiries, total] = await Promise.all([
    prisma.businessEnquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.businessEnquiry.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const spRecord: Record<string, string> = {};
  if (q) spRecord.q = q;
  if (statusFilter) spRecord.status = statusFilter;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 border-b border-admin-border pb-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-admin-ink">
          Business Enquiries
        </h1>
        <p className="mt-1 text-sm text-admin-ink-muted">{total} total</p>
      </div>

      <SearchFilter
        searchValue={q}
        searchPlaceholder="Search by name, business, email, phone, location…"
        filters={[
          {
            name: "status",
            label: "Status",
            value: statusFilter,
            options: ENQUIRY_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          },
        ]}
      />

      {enquiries.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-admin-border-strong px-8 py-16 text-center">
          <p className="text-sm text-admin-ink-muted">
            {q || statusFilter ? "No enquiries match your filters." : "No business enquiries yet."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-admin-border">
          <table className="min-w-full divide-y divide-admin-border text-sm">
            <thead className="bg-admin-cream/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-admin-ink-muted">Contact</th>
                <th className="px-4 py-3 text-left font-medium text-admin-ink-muted hidden sm:table-cell">Business</th>
                <th className="px-4 py-3 text-left font-medium text-admin-ink-muted hidden md:table-cell">Type</th>
                <th className="px-4 py-3 text-left font-medium text-admin-ink-muted hidden lg:table-cell">Location</th>
                <th className="px-4 py-3 text-left font-medium text-admin-ink-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-admin-ink-muted hidden md:table-cell">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border/70 bg-white">
              {enquiries.map((e) => (
                <tr key={e.id} className="hover:bg-admin-cream/40">
                  <td className="px-4 py-3 font-medium text-admin-ink whitespace-nowrap">{e.contactPerson}</td>
                  <td className="px-4 py-3 text-admin-ink-muted hidden sm:table-cell">{e.businessName}</td>
                  <td className="px-4 py-3 text-admin-ink-muted hidden md:table-cell">{e.businessType}</td>
                  <td className="px-4 py-3 text-admin-ink-muted hidden lg:table-cell">{e.businessLocation}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-3 text-admin-ink-muted hidden md:table-cell whitespace-nowrap">
                    {e.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/business-enquiries/${e.id}`} className="text-sm font-medium text-admin-ink-muted hover:text-admin-ink">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/business-enquiries" searchParams={spRecord} />
    </div>
  );
}
