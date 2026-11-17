/**
 * Aggregations for the admin dashboard.
 *
 * Everything here is derived from data the CRM actually records. Notably the
 * schema has no status-change history: updating a status writes only `status`,
 * and `updatedAt` is also bumped by unrelated edits such as saving admin notes
 * (see updateGeneralEnquiryNotes in admin-actions.ts). So `updatedAt` cannot be
 * read as "when this enquiry was processed", and metrics that would depend on
 * it are deliberately not calculated — see UNAVAILABLE_METRICS below.
 */
import { prisma } from "@/lib/prisma";
import { ENQUIRY_STATUSES } from "@/lib/enquiry-constants";

// ---------------------------------------------------------------------------
// Date range
// ---------------------------------------------------------------------------

export type DashboardRange = "today" | "7d" | "30d" | "all";

export const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "all", label: "All Time" },
];

export function resolveRange(value: unknown): DashboardRange {
  return value === "today" || value === "7d" || value === "30d" || value === "all"
    ? value
    : "all";
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Inclusive lower bound for a range, or null for "all time". */
export function rangeStart(range: DashboardRange): Date | null {
  switch (range) {
    case "today":
      return startOfToday();
    case "7d": {
      const d = startOfToday();
      d.setDate(d.getDate() - 6); // today plus the previous 6 days
      return d;
    }
    case "30d": {
      const d = startOfToday();
      d.setDate(d.getDate() - 29);
      return d;
    }
    case "all":
    default:
      return null;
  }
}

/** Metrics the current schema cannot support, with the reason why. */
export const UNAVAILABLE_METRICS = [
  {
    name: "Average processing time",
    reason:
      "No status-change history is recorded. updatedAt also changes when admin notes are saved, so it cannot stand in for when an enquiry was worked on.",
  },
  {
    name: "Enquiries processed over time",
    reason: "Needs a timestamp for each status change; only the current status is stored.",
  },
  {
    name: "Overdue enquiries",
    reason: "No response-time target is defined anywhere in the CRM.",
  },
  {
    name: "Recent status changes",
    reason: "No audit or history table exists to read past status changes from.",
  },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StatusCounts = Record<string, number>;

export type EnquiryTypeKey = "general" | "business" | "sample";

export const ENQUIRY_TYPES_META: {
  key: EnquiryTypeKey;
  label: string;
  href: string;
}[] = [
  { key: "general", label: "General Enquiries", href: "/admin/general-enquiries" },
  { key: "business", label: "Business Enquiries", href: "/admin/business-enquiries" },
  { key: "sample", label: "Sample Requests", href: "/admin/sample-requests" },
];

type GroupedStatus = { status: string; _count: number }[];

/** Turn a Prisma groupBy result into a dense status -> count map. */
function toStatusCounts(rows: GroupedStatus): StatusCounts {
  const counts: StatusCounts = {};
  for (const s of ENQUIRY_STATUSES) counts[s.value] = 0;
  for (const row of rows) {
    // Guard against any legacy status value not in the canonical list.
    counts[row.status] = (counts[row.status] ?? 0) + row._count;
  }
  return counts;
}

function sumCounts(...maps: StatusCounts[]): StatusCounts {
  const total: StatusCounts = {};
  for (const s of ENQUIRY_STATUSES) total[s.value] = 0;
  for (const map of maps) {
    for (const [key, value] of Object.entries(map)) {
      total[key] = (total[key] ?? 0) + value;
    }
  }
  return total;
}

function totalOf(counts: StatusCounts): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

// ---------------------------------------------------------------------------
// Inventory (website catalogue records — not physical stock)
// ---------------------------------------------------------------------------

export async function getInventoryOverview() {
  const [total, visible, byCategory, recent] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isVisible: true } }),
    prisma.product.groupBy({ by: ["category"], _count: true }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        category: true,
        isVisible: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    total,
    visible,
    hidden: total - visible,
    byCategory: (byCategory as { category: string; _count: number }[])
      .map((row) => ({ category: row.category, count: row._count }))
      .sort((a, b) => b.count - a.count),
    recent,
  };
}

// ---------------------------------------------------------------------------
// Enquiries
// ---------------------------------------------------------------------------

export async function getEnquiryOverview(range: DashboardRange) {
  const start = rangeStart(range);
  const where = start ? { createdAt: { gte: start } } : {};

  const [general, business, sample] = await Promise.all([
    prisma.generalEnquiry.groupBy({ by: ["status"], where, _count: true }),
    prisma.businessEnquiry.groupBy({ by: ["status"], where, _count: true }),
    prisma.sampleRequest.groupBy({ by: ["status"], where, _count: true }),
  ]);

  const byType: Record<EnquiryTypeKey, StatusCounts> = {
    general: toStatusCounts(general as GroupedStatus),
    business: toStatusCounts(business as GroupedStatus),
    sample: toStatusCounts(sample as GroupedStatus),
  };

  const combined = sumCounts(byType.general, byType.business, byType.sample);

  const totals = {
    general: totalOf(byType.general),
    business: totalOf(byType.business),
    sample: totalOf(byType.sample),
    combined: totalOf(combined),
  };

  const converted = combined.CONVERTED ?? 0;

  return {
    byType,
    combined,
    totals,
    newAwaitingAction: combined.NEW ?? 0,
    /**
     * Share of enquiries in this range that reached CONVERTED. Derived purely
     * from the stored status, so it reflects the CRM's own record.
     */
    conversionRate: totals.combined > 0 ? converted / totals.combined : null,
    converted,
  };
}

// ---------------------------------------------------------------------------
// Enquiries received over time (createdAt is reliable)
// ---------------------------------------------------------------------------

export type DailyPoint = { date: string; label: string; count: number };

const CHART_DAYS = 30;

/**
 * Daily count of enquiries received over the last 30 days, across all three
 * types. Based on createdAt, which is written once and never changed.
 */
export async function getReceivedOverTime(): Promise<DailyPoint[]> {
  const start = startOfToday();
  start.setDate(start.getDate() - (CHART_DAYS - 1));

  const where = { createdAt: { gte: start } };
  const select = { createdAt: true } as const;

  const [general, business, sample] = await Promise.all([
    prisma.generalEnquiry.findMany({ where, select }),
    prisma.businessEnquiry.findMany({ where, select }),
    prisma.sampleRequest.findMany({ where, select }),
  ]);

  // Seed every day in the window so gaps render as zero rather than vanishing.
  const buckets = new Map<string, number>();
  for (let i = 0; i < CHART_DAYS; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(toKey(d), 0);
  }

  for (const row of [...general, ...business, ...sample]) {
    const key = toKey(row.createdAt);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return [...buckets.entries()].map(([date, count]) => ({
    date,
    label: new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    count,
  }));
}

function toKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------
// Recent activity
// ---------------------------------------------------------------------------

export async function getRecentActivity() {
  const [general, business, sample] = await Promise.all([
    prisma.generalEnquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, subject: true, status: true, createdAt: true },
    }),
    prisma.businessEnquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        contactPerson: true,
        businessName: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.sampleRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, city: true, status: true, createdAt: true },
    }),
  ]);

  return { general, business, sample };
}
