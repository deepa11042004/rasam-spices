import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/admin/StatusBadge";
import { StatusSelect, NotesEditor } from "@/components/admin/EnquiryActions";
import {
  updateGeneralEnquiryStatus,
  updateGeneralEnquiryNotes,
} from "@/lib/admin-actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const enquiry = await prisma.generalEnquiry.findUnique({
    where: { id },
    select: { fullName: true },
  });
  return { title: enquiry ? `${enquiry.fullName} — General Enquiry` : "Enquiry Not Found" };
}

export default async function GeneralEnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const enquiry = await prisma.generalEnquiry.findUnique({ where: { id } });
  if (!enquiry) notFound();

  const fields = [
    { label: "Full Name", value: enquiry.fullName },
    { label: "Company", value: enquiry.companyName },
    { label: "Email", value: enquiry.email },
    { label: "Mobile", value: enquiry.mobileNumber },
    { label: "Enquiry Type", value: enquiry.enquiryType },
    { label: "Subject", value: enquiry.subject },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <Link
        href="/admin/general-enquiries"
        className="mb-4 inline-flex items-center gap-1 text-sm text-admin-ink-muted hover:text-admin-ink"
      >
        ← Back to General Enquiries
      </Link>

      <div className="mb-6 flex flex-col gap-3 border-b border-admin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-admin-ink">
            {enquiry.fullName}
          </h1>
          <p className="mt-0.5 text-sm text-admin-ink-muted">{enquiry.enquiryType}</p>
        </div>
        <StatusBadge status={enquiry.status} />
      </div>

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(
          (f) =>
            f.value && (
              <div key={f.label}>
                <dt className="text-xs font-medium uppercase tracking-wider text-admin-ink-muted/80">
                  {f.label}
                </dt>
                <dd className="mt-0.5 text-sm text-admin-ink">{f.value}</dd>
              </div>
            ),
        )}
      </div>

      {/* Message */}
      <div className="mt-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-admin-ink-muted/80">Message</h2>
        <div className="mt-1 whitespace-pre-wrap rounded-md border border-admin-border bg-admin-cream/60 px-4 py-3 text-sm text-admin-ink">
          {enquiry.message}
        </div>
      </div>

      {/* Timestamps */}
      <div className="mt-6 flex gap-6 text-xs text-admin-ink-muted/80">
        <span>
          Created:{" "}
          {enquiry.createdAt.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span>
          Updated:{" "}
          {enquiry.updatedAt.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Status update */}
      <div className="mt-8 space-y-6 border-t border-admin-border pt-6">
        <div>
          <h2 className="mb-2 text-sm font-medium text-admin-ink">Update Status</h2>
          <StatusSelect
            currentStatus={enquiry.status}
            onUpdate={updateGeneralEnquiryStatus}
            enquiryId={enquiry.id}
          />
        </div>

        <NotesEditor
          currentNotes={enquiry.adminNotes}
          onSave={updateGeneralEnquiryNotes}
          enquiryId={enquiry.id}
        />
      </div>
    </div>
  );
}
