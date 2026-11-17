import type { Metadata } from "next";
import Link from "next/link";
import { getSessionAdmin } from "@/lib/admin-session";
import { ENQUIRY_STATUSES } from "@/lib/enquiry-constants";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  ENQUIRY_TYPES_META,
  RANGE_OPTIONS,
  UNAVAILABLE_METRICS,
  getEnquiryOverview,
  getInventoryOverview,
  getReceivedOverTime,
  getRecentActivity,
  resolveRange,
} from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "Dashboard" };

const CATEGORY_LABELS: Record<string, string> = {
  "ground-spices": "Ground Spices",
  "blended-masalas": "Blended Masalas",
  "spices-seasonings": "Spices & Seasonings",
};

function formatDate(value: Date) {
  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** A number that links through to the matching filtered admin list. */
function StatLink({
  href,
  value,
  label,
  tone = "border-neutral-200 bg-white",
}: {
  href: string;
  value: number | string;
  label: string;
  tone?: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg border p-4 transition-shadow hover:shadow-md ${tone}`}
    >
      <div className="text-2xl font-bold text-neutral-800">{value}</div>
      <div className="mt-1 text-xs font-medium text-neutral-600">{label}</div>
    </Link>
  );
}

function SectionHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-neutral-500">{note}</p>}
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const range = resolveRange(params.range);

  const [admin, inventory, enquiries, received, recent] = await Promise.all([
    getSessionAdmin(),
    getInventoryOverview(),
    getEnquiryOverview(range),
    getReceivedOverTime(),
    getRecentActivity(),
  ]);

  const rangeQuery = range === "all" ? "" : `?range=${range}`;
  const peak = Math.max(1, ...received.map((p) => p.count));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8 border-b border-neutral-200 pb-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-neutral-800">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Welcome back, <span className="font-medium text-neutral-700">{admin?.username}</span>
        </p>
      </div>

      {/* ================= Inventory Overview ================= */}
      <section className="mb-10">
        <SectionHeading
          title="Inventory Overview"
          note="Website catalogue items shown on the public site. Not physical stock."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatLink
            href="/admin/products"
            value={inventory.total}
            label="Total catalogue items"
            tone="border-green-200 bg-green-50"
          />
          <StatLink
            href="/admin/products?visibility=visible"
            value={inventory.visible}
            label="Visible on site"
            tone="border-emerald-200 bg-emerald-50"
          />
          <StatLink
            href="/admin/products?visibility=hidden"
            value={inventory.hidden}
            label="Hidden from site"
            tone="border-neutral-200 bg-neutral-50"
          />
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="text-2xl font-bold text-neutral-800">
              {inventory.byCategory.length}
            </div>
            <div className="mt-1 text-xs font-medium text-neutral-600">Categories in use</div>
          </div>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {/* By category */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-400">
              Items by category
            </h3>
            {inventory.byCategory.length === 0 ? (
              <p className="text-sm text-neutral-500">No catalogue items yet.</p>
            ) : (
              <div className="space-y-2">
                {inventory.byCategory.map((row) => (
                  <Link
                    key={row.category}
                    href={`/admin/products?category=${encodeURIComponent(row.category)}`}
                    className="flex items-center gap-3 rounded-md px-1 py-1 hover:bg-neutral-50"
                  >
                    <span className="w-44 shrink-0 truncate text-sm text-neutral-600">
                      {CATEGORY_LABELS[row.category] ?? row.category}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-2 rounded-full bg-neutral-300"
                      style={{
                        width: `${Math.max(4, (row.count / inventory.total) * 100)}%`,
                      }}
                    />
                    <span className="ml-auto text-sm font-medium text-neutral-800">
                      {row.count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recently added */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-400">
              Recently added items
            </h3>
            {inventory.recent.length === 0 ? (
              <p className="text-sm text-neutral-500">Nothing added yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {inventory.recent.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/admin/products/${item.id}`}
                      className="flex items-center justify-between gap-3 py-2 hover:bg-neutral-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-neutral-800">
                          {item.name}
                        </span>
                        <span className="block text-xs text-neutral-500">
                          {CATEGORY_LABELS[item.category] ?? item.category}
                          {!item.isVisible && " · hidden"}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-neutral-400">
                        {formatDate(item.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ================= Date filter ================= */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-6">
        <span className="mr-1 text-xs font-medium uppercase tracking-wider text-neutral-400">
          Enquiry metrics
        </span>
        {RANGE_OPTIONS.map((option) => {
          const active = option.value === range;
          return (
            <Link
              key={option.value}
              href={option.value === "all" ? "/admin" : `/admin?range=${option.value}`}
              aria-current={active ? "true" : undefined}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-neutral-800 bg-neutral-800 text-white"
                  : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {/* ================= Enquiry Overview ================= */}
      <section className="mb-10">
        <SectionHeading title="Enquiry Overview" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ENQUIRY_TYPES_META.map((meta) => (
            <StatLink
              key={meta.key}
              href={meta.href}
              value={enquiries.totals[meta.key]}
              label={meta.label}
              tone={
                meta.key === "general"
                  ? "border-blue-200 bg-blue-50"
                  : meta.key === "business"
                    ? "border-purple-200 bg-purple-50"
                    : "border-amber-200 bg-amber-50"
              }
            />
          ))}
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="text-2xl font-bold text-neutral-800">
              {enquiries.totals.combined}
            </div>
            <div className="mt-1 text-xs font-medium text-neutral-600">All enquiries</div>
          </div>
          <StatLink
            href="/admin/general-enquiries?status=NEW"
            value={enquiries.newAwaitingAction}
            label="New — awaiting action"
            tone="border-red-200 bg-red-50"
          />
        </div>
      </section>

      {/* ================= Enquiry Processing ================= */}
      <section className="mb-10">
        <SectionHeading
          title="Enquiry Processing"
          note="Counts by CRM status. Select any number to open that filtered list."
        />
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                {ENQUIRY_TYPES_META.map((meta) => (
                  <th
                    key={meta.key}
                    className="px-4 py-3 text-right font-medium text-neutral-600"
                  >
                    {meta.label.replace(" Enquiries", "").replace(" Requests", "")}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {ENQUIRY_STATUSES.map((status) => (
                <tr key={status.value} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <StatusBadge status={status.value} />
                  </td>
                  {ENQUIRY_TYPES_META.map((meta) => {
                    const count = enquiries.byType[meta.key][status.value] ?? 0;
                    return (
                      <td key={meta.key} className="px-4 py-3 text-right">
                        {count > 0 ? (
                          <Link
                            href={`${meta.href}?status=${status.value}`}
                            className="font-medium text-neutral-800 underline-offset-2 hover:underline"
                          >
                            {count}
                          </Link>
                        ) : (
                          <span className="text-neutral-400">0</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                    {enquiries.combined[status.value] ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-neutral-50">
              <tr>
                <td className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
                  All statuses
                </td>
                {ENQUIRY_TYPES_META.map((meta) => (
                  <td
                    key={meta.key}
                    className="px-4 py-3 text-right font-semibold text-neutral-900"
                  >
                    {enquiries.totals[meta.key]}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                  {enquiries.totals.combined}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* ================= Performance ================= */}
      <section className="mb-10">
        <SectionHeading title="Performance" />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="text-2xl font-bold text-neutral-800">
              {enquiries.conversionRate === null
                ? "—"
                : `${(enquiries.conversionRate * 100).toFixed(1)}%`}
            </div>
            <div className="mt-1 text-xs font-medium text-neutral-600">Conversion rate</div>
            <p className="mt-1 text-xs text-neutral-400">
              {enquiries.converted} of {enquiries.totals.combined} marked Converted
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="text-2xl font-bold text-neutral-800">
              {enquiries.combined.NEW + enquiries.combined.CONTACTED + enquiries.combined.IN_PROGRESS}
            </div>
            <div className="mt-1 text-xs font-medium text-neutral-600">Open (not yet closed)</div>
            <p className="mt-1 text-xs text-neutral-400">
              New, Contacted and In Progress combined
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="text-2xl font-bold text-neutral-800">
              {enquiries.combined.CLOSED_LOST ?? 0}
            </div>
            <div className="mt-1 text-xs font-medium text-neutral-600">Closed / Lost</div>
            <p className="mt-1 text-xs text-neutral-400">In the selected period</p>
          </div>
        </div>

        {/* Received over time */}
        <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-neutral-400">
            Enquiries received — last 30 days
          </h3>
          <p className="mb-4 text-xs text-neutral-400">
            All enquiry types combined, by date received.
          </p>
          <div className="flex h-32 items-end gap-[3px]">
            {received.map((point) => (
              <div
                key={point.date}
                title={`${point.label}: ${point.count}`}
                className="group relative flex-1 rounded-t-sm bg-neutral-200 transition-colors hover:bg-neutral-400"
                style={{ height: `${Math.max(2, (point.count / peak) * 100)}%` }}
              >
                <span className="sr-only">
                  {point.label}: {point.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-neutral-400">
            <span>{received[0]?.label}</span>
            <span>Peak {peak}</span>
            <span>{received[received.length - 1]?.label}</span>
          </div>
        </div>

        {/* Honest note about what cannot be computed */}
        <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Not shown — the CRM does not record this yet
          </h3>
          <ul className="mt-2 space-y-1.5">
            {UNAVAILABLE_METRICS.map((metric) => (
              <li key={metric.name} className="text-xs text-neutral-500">
                <span className="font-medium text-neutral-700">{metric.name}</span> — {metric.reason}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-neutral-400">
            Adding a status-change history table would make all four available.
          </p>
        </div>
      </section>

      {/* ================= Recent Activity ================= */}
      <section>
        <SectionHeading title="Recent Activity" />
        <div className="grid gap-6 lg:grid-cols-3">
          {/* General */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-400">
              Latest General Enquiries
            </h3>
            {recent.general.length === 0 ? (
              <p className="text-sm text-neutral-500">None yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {recent.general.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/admin/general-enquiries/${item.id}`}
                      className="block py-2 hover:bg-neutral-50"
                    >
                      <span className="block truncate text-sm font-medium text-neutral-800">
                        {item.fullName}
                      </span>
                      <span className="block truncate text-xs text-neutral-500">
                        {item.subject}
                      </span>
                      <span className="mt-1 flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-neutral-400">
                          {formatDate(item.createdAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Business */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-400">
              Latest Business Enquiries
            </h3>
            {recent.business.length === 0 ? (
              <p className="text-sm text-neutral-500">None yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {recent.business.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/admin/business-enquiries/${item.id}`}
                      className="block py-2 hover:bg-neutral-50"
                    >
                      <span className="block truncate text-sm font-medium text-neutral-800">
                        {item.businessName}
                      </span>
                      <span className="block truncate text-xs text-neutral-500">
                        {item.contactPerson}
                      </span>
                      <span className="mt-1 flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-neutral-400">
                          {formatDate(item.createdAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sample */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-400">
              Latest Sample Requests
            </h3>
            {recent.sample.length === 0 ? (
              <p className="text-sm text-neutral-500">None yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {recent.sample.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/admin/sample-requests/${item.id}`}
                      className="block py-2 hover:bg-neutral-50"
                    >
                      <span className="block truncate text-sm font-medium text-neutral-800">
                        {item.fullName}
                      </span>
                      <span className="block truncate text-xs text-neutral-500">{item.city}</span>
                      <span className="mt-1 flex items-center gap-2">
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-neutral-400">
                          {formatDate(item.createdAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {rangeQuery && (
          <p className="mt-3 text-xs text-neutral-400">
            Recent activity always shows the latest records, regardless of the selected period.
          </p>
        )}
      </section>
    </div>
  );
}
