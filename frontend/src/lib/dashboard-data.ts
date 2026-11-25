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
import { api } from "@/lib/api";
import { ENQUIRY_STATUSES } from "@/lib/enquiry-constants";
import { categories as CATEGORY_CONFIG } from "@/data/products";

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

type GroupedStatus = { status: string; count: number }[];

/** Turn the backend's grouped status counts into a dense status -> count map. */
function toStatusCounts(rows: GroupedStatus): StatusCounts {
  const counts: StatusCounts = {};
  for (const s of ENQUIRY_STATUSES) counts[s.value] = 0;
  for (const row of rows) {
    // Guard against any legacy status value not in the canonical list.
    counts[row.status] = (counts[row.status] ?? 0) + row.count;
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

export type CategoryRow = {
  /** The category value stored on the product record. */
  category: string;
  /** Human label from the shared category config, or a readable fallback. */
  label: string;
  total: number;
  visible: number;
  hidden: number;
};

/** Turn an unknown category value into something readable, e.g. "my-cat" -> "My Cat". */
function prettifyCategory(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Catalogue counts per category, taken from the product records themselves.
 *
 * The category list is derived from the database rather than hardcoded, so a
 * category added later appears automatically; labels come from the shared
 * config in src/data/products.ts, falling back to a readable form of the
 * stored value for anything not listed there. Grouping is by category, so each
 * product is counted exactly once. Hidden products are included in `total` and
 * also broken out separately.
 *
 * These are catalogue records shown on the website, not stock quantities.
 */
export async function getCategoryOverview(): Promise<{
  rows: CategoryRow[];
  total: number;
  visible: number;
  hidden: number;
}> {
  // One row per (category, isVisible) pair; a product belongs to exactly one.
  const grouped = await api<
    { category: string; isVisible: boolean; count: number }[]
  >("/api/admin/dashboard/categories", { admin: true });

  const byCategory = new Map<string, CategoryRow>();

  for (const row of grouped) {
    const existing = byCategory.get(row.category) ?? {
      category: row.category,
      label:
        CATEGORY_CONFIG.find((c) => c.id === row.category)?.name ??
        prettifyCategory(row.category),
      total: 0,
      visible: 0,
      hidden: 0,
    };

    existing.total += row.count;
    if (row.isVisible) existing.visible += row.count;
    else existing.hidden += row.count;

    byCategory.set(row.category, existing);
  }

  // Show configured categories in their configured order, then any extras.
  // Widened to string[]: product.category is a plain column, not the union.
  const configuredOrder: string[] = CATEGORY_CONFIG.map((c) => c.id);
  const rows = [...byCategory.values()].sort((a, b) => {
    const ai = configuredOrder.indexOf(a.category);
    const bi = configuredOrder.indexOf(b.category);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return b.total - a.total;
  });

  return {
    rows,
    total: rows.reduce((sum, r) => sum + r.total, 0),
    visible: rows.reduce((sum, r) => sum + r.visible, 0),
    hidden: rows.reduce((sum, r) => sum + r.hidden, 0),
  };
}

export async function getInventoryOverview() {
  const { total, visible, byCategory, recent } = await api<{
    total: number;
    visible: number;
    byCategory: { category: string; count: number }[];
    recent: {
      id: string;
      name: string;
      category: string;
      isVisible: boolean;
      createdAt: Date;
    }[];
  }>("/api/admin/dashboard/inventory", { admin: true });

  return {
    total,
    visible,
    hidden: total - visible,
    byCategory: [...byCategory].sort((a, b) => b.count - a.count),
    recent,
  };
}

// ---------------------------------------------------------------------------
// Enquiries
// ---------------------------------------------------------------------------

export async function getEnquiryOverview(range: DashboardRange) {
  const start = rangeStart(range);

  const { general, business, sample } = await api<
    Record<EnquiryTypeKey, GroupedStatus>
  >("/api/admin/dashboard/enquiries", {
    admin: true,
    query: { since: start?.toISOString() },
  });

  const byType: Record<EnquiryTypeKey, StatusCounts> = {
    general: toStatusCounts(general),
    business: toStatusCounts(business),
    sample: toStatusCounts(sample),
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

  // createdAt of every enquiry received in the window, across all three types.
  const received = (
    await api<string[]>("/api/admin/dashboard/received", {
      admin: true,
      query: { since: start.toISOString() },
    })
  ).map((value) => new Date(value));

  // Seed every day in the window so gaps render as zero rather than vanishing.
  const buckets = new Map<string, number>();
  for (let i = 0; i < CHART_DAYS; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(toKey(d), 0);
  }

  for (const createdAt of received) {
    const key = toKey(createdAt);
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
  return api<{
    general: {
      id: string;
      fullName: string;
      subject: string;
      status: string;
      createdAt: Date;
    }[];
    business: {
      id: string;
      contactPerson: string;
      businessName: string;
      status: string;
      createdAt: Date;
    }[];
    sample: {
      id: string;
      fullName: string;
      city: string;
      status: string;
      createdAt: Date;
    }[];
  }>("/api/admin/dashboard/recent", { admin: true });
}
