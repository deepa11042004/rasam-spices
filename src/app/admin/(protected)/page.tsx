import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionAdmin } from "@/lib/admin-session";
import { ENQUIRY_STATUSES } from "@/lib/enquiry-constants";
import StatusBadge from "@/components/admin/StatusBadge";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData() {
  const [
    generalCount,
    businessCount,
    sampleCount,
    generalByStatus,
    businessByStatus,
    sampleByStatus,
    recentGeneral,
    recentBusiness,
    recentSample,
    productCount,
  ] = await Promise.all([
    prisma.generalEnquiry.count(),
    prisma.businessEnquiry.count(),
    prisma.sampleRequest.count(),
    prisma.generalEnquiry.groupBy({ by: ["status"], _count: true }),
    prisma.businessEnquiry.groupBy({ by: ["status"], _count: true }),
    prisma.sampleRequest.groupBy({ by: ["status"], _count: true }),
    prisma.generalEnquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, fullName: true, subject: true, status: true, createdAt: true } }),
    prisma.businessEnquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, contactPerson: true, businessName: true, status: true, createdAt: true } }),
    prisma.sampleRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, fullName: true, city: true, status: true, createdAt: true } }),
    prisma.product.count(),
  ]);

  // Count "NEW" (pending) across all enquiry types
  const newGeneral = generalByStatus.find((s) => s.status === "NEW")?._count ?? 0;
  const newBusiness = businessByStatus.find((s) => s.status === "NEW")?._count ?? 0;
  const newSample = sampleByStatus.find((s) => s.status === "NEW")?._count ?? 0;
  const pendingTotal = newGeneral + newBusiness + newSample;

  return {
    generalCount,
    businessCount,
    sampleCount,
    productCount,
    pendingTotal,
    generalByStatus,
    businessByStatus,
    sampleByStatus,
    recentGeneral,
    recentBusiness,
    recentSample,
  };
}

function StatusBreakdown({
  title,
  data,
}: {
  title: string;
  data: { status: string; _count: number }[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-400">{title}</h3>
      <div className="space-y-1">
        {ENQUIRY_STATUSES.map((s) => {
          const count = data.find((d) => d.status === s.value)?._count ?? 0;
          return (
            <div key={s.value} className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">{s.label}</span>
              <span className="font-medium text-neutral-800">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const admin = await getSessionAdmin();
  const data = await getDashboardData();

  const statCards = [
    { label: "General Enquiries", value: data.generalCount, href: "/admin/general-enquiries", color: "border-blue-200 bg-blue-50" },
    { label: "Business Enquiries", value: data.businessCount, href: "/admin/business-enquiries", color: "border-purple-200 bg-purple-50" },
    { label: "Sample Requests", value: data.sampleCount, href: "/admin/sample-requests", color: "border-amber-200 bg-amber-50" },
    { label: "Pending (New)", value: data.pendingTotal, href: "/admin/general-enquiries?status=NEW", color: "border-red-200 bg-red-50" },
    { label: "Products", value: data.productCount, href: "/admin/products", color: "border-green-200 bg-green-50" },
  ];

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

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-lg border p-4 transition-shadow hover:shadow-md ${card.color}`}
          >
            <div className="text-2xl font-bold text-neutral-800">{card.value}</div>
            <div className="mt-1 text-xs font-medium text-neutral-600">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Status breakdowns */}
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <StatusBreakdown title="General Enquiries" data={data.generalByStatus} />
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <StatusBreakdown title="Business Enquiries" data={data.businessByStatus} />
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <StatusBreakdown title="Sample Requests" data={data.sampleByStatus} />
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-10">
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold text-neutral-800">
          Recent Activity
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent General */}
          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-4 py-3">
              <h3 className="text-sm font-medium text-neutral-700">Latest General Enquiries</h3>
            </div>
            {data.recentGeneral.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-400">None yet</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {data.recentGeneral.map((e) => (
                  <li key={e.id}>
                    <Link href={`/admin/general-enquiries/${e.id}`} className="block px-4 py-3 hover:bg-neutral-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-800">{e.fullName}</span>
                        <StatusBadge status={e.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">{e.subject}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {e.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Business */}
          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-4 py-3">
              <h3 className="text-sm font-medium text-neutral-700">Latest Business Enquiries</h3>
            </div>
            {data.recentBusiness.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-400">None yet</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {data.recentBusiness.map((e) => (
                  <li key={e.id}>
                    <Link href={`/admin/business-enquiries/${e.id}`} className="block px-4 py-3 hover:bg-neutral-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-800">{e.contactPerson}</span>
                        <StatusBadge status={e.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500">{e.businessName}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {e.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Sample */}
          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-4 py-3">
              <h3 className="text-sm font-medium text-neutral-700">Latest Sample Requests</h3>
            </div>
            {data.recentSample.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-400">None yet</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {data.recentSample.map((e) => (
                  <li key={e.id}>
                    <Link href={`/admin/sample-requests/${e.id}`} className="block px-4 py-3 hover:bg-neutral-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-800">{e.fullName}</span>
                        <StatusBadge status={e.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500">{e.city}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {e.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
