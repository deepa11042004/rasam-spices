import type { Prisma } from "../../../../../generated/prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ENQUIRY_STATUSES } from "@/lib/enquiry-constants";
import StatusBadge from "@/components/admin/StatusBadge";
import SearchFilter from "@/components/admin/SearchFilter";
import Pagination from "@/components/admin/Pagination";

export const metadata: Metadata = { title: "General Enquiries" };

const PAGE_SIZE = 20;

export default async function GeneralEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const typeFilter = typeof params.type === "string" ? params.type : "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.GeneralEnquiryWhereInput = {};

  if (q) {
    where.OR = [
      { fullName: { contains: q } },
      { email: { contains: q } },
      { mobileNumber: { contains: q } },
      { companyName: { contains: q } },
      { subject: { contains: q } },
    ];
  }
  if (statusFilter) where.status = statusFilter;
  if (typeFilter) where.enquiryType = typeFilter;

  const [enquiries, total] = await Promise.all([
    prisma.generalEnquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.generalEnquiry.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const spRecord: Record<string, string> = {};
  if (q) spRecord.q = q;
  if (statusFilter) spRecord.status = statusFilter;
  if (typeFilter) spRecord.type = typeFilter;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 border-b border-neutral-200 pb-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-neutral-800">
          General Enquiries
        </h1>
        <p className="mt-1 text-sm text-neutral-500">{total} total</p>
      </div>

      <SearchFilter
        searchValue={q}
        searchPlaceholder="Search by name, email, phone, company, subject…"
        filters={[
          {
            name: "status",
            label: "Status",
            value: statusFilter,
            options: ENQUIRY_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          },
          {
            name: "type",
            label: "Type",
            value: typeFilter,
            options: [
              { value: "Product Information", label: "Product Information" },
              { value: "Pricing Enquiry", label: "Pricing Enquiry" },
              { value: "Order Related", label: "Order Related" },
              { value: "Product Availability", label: "Product Availability" },
              { value: "Feedback or Complaint", label: "Feedback or Complaint" },
              { value: "Other", label: "Other" },
            ],
          },
        ]}
      />

      {enquiries.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-neutral-300 px-8 py-16 text-center">
          <p className="text-sm text-neutral-500">
            {q || statusFilter || typeFilter
              ? "No enquiries match your filters."
              : "No general enquiries yet."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 hidden md:table-cell">Type</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 hidden lg:table-cell">Subject</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600 hidden md:table-cell">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {enquiries.map((e) => (
                <tr key={e.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-800 whitespace-nowrap">
                    {e.fullName}
                    {e.companyName && (
                      <span className="block text-xs text-neutral-400">{e.companyName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 hidden sm:table-cell">{e.email}</td>
                  <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">{e.enquiryType}</td>
                  <td className="px-4 py-3 text-neutral-600 hidden lg:table-cell max-w-[200px] truncate">{e.subject}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell whitespace-nowrap">
                    {e.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/general-enquiries/${e.id}`} className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/general-enquiries" searchParams={spRecord} />
    </div>
  );
}
