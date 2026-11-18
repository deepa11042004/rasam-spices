import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/admin/StatusBadge";
import { StatusSelect, NotesEditor } from "@/components/admin/EnquiryActions";
import {
  updateBusinessEnquiryStatus,
  updateBusinessEnquiryNotes,
} from "@/lib/admin-actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const e = await prisma.businessEnquiry.findUnique({ where: { id }, select: { businessName: true } });
  return { title: e ? `${e.businessName} — Business Enquiry` : "Enquiry Not Found" };
}

export default async function BusinessEnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const enquiry = await prisma.businessEnquiry.findUnique({ where: { id } });
  if (!enquiry) notFound();

  const products = (Array.isArray(enquiry.products) ? enquiry.products : []) as Array<Record<string, string | number | null>>;

  const fields = [
    { label: "Contact Person", value: enquiry.contactPerson },
    { label: "Business Name", value: enquiry.businessName },
    { label: "Email", value: enquiry.businessEmail },
    { label: "Mobile", value: enquiry.mobileNumber },
    { label: "Business Type", value: enquiry.businessType },
    { label: "Location", value: enquiry.businessLocation },
    { label: "Website", value: enquiry.website },
    { label: "GSTIN", value: enquiry.gstin },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <Link
        href="/admin/business-enquiries"
        className="mb-4 inline-flex items-center gap-1 text-sm text-admin-ink-muted hover:text-admin-ink"
      >
        ← Back to Business Enquiries
      </Link>

      <div className="mb-6 flex flex-col gap-3 border-b border-admin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-admin-ink">
            {enquiry.businessName}
          </h1>
          <p className="mt-0.5 text-sm text-admin-ink-muted">{enquiry.contactPerson}</p>
        </div>
        <StatusBadge status={enquiry.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(
          (f) =>
            f.value && (
              <div key={f.label}>
                <dt className="text-xs font-medium uppercase tracking-wider text-admin-ink-muted/80">{f.label}</dt>
                <dd className="mt-0.5 text-sm text-admin-ink">{f.value}</dd>
              </div>
            ),
        )}
      </div>

      {/* Products requested */}
      {products.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-admin-ink-muted/80">Requested Products</h2>
          <ul className="mt-2 space-y-1">
            {products.map((p, i) => (
              <li key={i} className="rounded-md border border-admin-border bg-admin-cream/60 px-3 py-2 text-sm text-admin-ink">
                <span className="font-medium">{String(p.name ?? p.id ?? "Product")}</span>
                {p.quantity && (
                  <span className="ml-2 text-admin-ink-muted">
                    — {String(p.quantity)} {String(p.unit ?? "")}
                  </span>
                )}
                {p.category && <span className="ml-2 text-xs text-admin-ink-muted/80">({String(p.category)})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Message */}
      {enquiry.message && (
        <div className="mt-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-admin-ink-muted/80">Message</h2>
          <div className="mt-1 whitespace-pre-wrap rounded-md border border-admin-border bg-admin-cream/60 px-4 py-3 text-sm text-admin-ink">
            {enquiry.message}
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-6 text-xs text-admin-ink-muted/80">
        <span>Created: {enquiry.createdAt.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        <span>Updated: {enquiry.updatedAt.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      <div className="mt-8 space-y-6 border-t border-admin-border pt-6">
        <div>
          <h2 className="mb-2 text-sm font-medium text-admin-ink">Update Status</h2>
          <StatusSelect currentStatus={enquiry.status} onUpdate={updateBusinessEnquiryStatus} enquiryId={enquiry.id} />
        </div>
        <NotesEditor currentNotes={enquiry.adminNotes} onSave={updateBusinessEnquiryNotes} enquiryId={enquiry.id} />
      </div>
    </div>
  );
}
