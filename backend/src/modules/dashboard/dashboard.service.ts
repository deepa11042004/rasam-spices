/**
 * Raw aggregates for the admin dashboard. Labels, status maps, date-range
 * resolution and chart bucketing are presentation concerns handled by the
 * frontend.
 */
import { prisma } from "@/lib/prisma";

/** One row per (category, isVisible) pair. */
export async function getCategoryGroups() {
  const grouped = await prisma.product.groupBy({ by: ["category", "isVisible"], _count: true });
  return grouped.map((row) => ({
    category: row.category,
    isVisible: row.isVisible,
    count: row._count,
  }));
}

export async function getInventory() {
  const [total, visible, byCategory, recent] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isVisible: true } }),
    prisma.product.groupBy({ by: ["category"], _count: true }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, category: true, isVisible: true, createdAt: true },
    }),
  ]);

  return {
    total,
    visible,
    byCategory: byCategory.map((row) => ({ category: row.category, count: row._count })),
    recent,
  };
}

/** Status counts per enquiry type, optionally limited to those created since `since`. */
export async function getEnquiryStatusGroups(since: Date | null) {
  const where = since ? { createdAt: { gte: since } } : {};
  const [general, business, sample] = await Promise.all([
    prisma.generalEnquiry.groupBy({ by: ["status"], where, _count: true }),
    prisma.businessEnquiry.groupBy({ by: ["status"], where, _count: true }),
    prisma.sampleRequest.groupBy({ by: ["status"], where, _count: true }),
  ]);

  const shape = (rows: { status: string; _count: number }[]) =>
    rows.map((r) => ({ status: r.status, count: r._count }));

  return { general: shape(general), business: shape(business), sample: shape(sample) };
}

/** createdAt of every enquiry received since `since`, across all three types. */
export async function getReceivedTimestamps(since: Date) {
  const where = { createdAt: { gte: since } };
  const select = { createdAt: true } as const;

  const [general, business, sample] = await Promise.all([
    prisma.generalEnquiry.findMany({ where, select }),
    prisma.businessEnquiry.findMany({ where, select }),
    prisma.sampleRequest.findMany({ where, select }),
  ]);

  return [...general, ...business, ...sample].map((row) => row.createdAt);
}

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
      select: { id: true, contactPerson: true, businessName: true, status: true, createdAt: true },
    }),
    prisma.sampleRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, city: true, status: true, createdAt: true },
    }),
  ]);

  return { general, business, sample };
}
