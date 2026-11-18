"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

/**
 * Top bar for the admin shell: current page title, breadcrumb and the account
 * area with logout.
 *
 * Client component because the title and breadcrumb are derived from the
 * current path. The logout server action is passed down from the layout, so
 * this adds no new auth behaviour — it reuses exactly the same action the
 * sidebar already calls.
 */

/** Route segment -> readable label. Keep in step with the sidebar's nav. */
const SEGMENT_LABELS: Record<string, string> = {
  admin: "Dashboard",
  "general-enquiries": "General Enquiries",
  "business-enquiries": "Business Enquiries",
  "sample-requests": "Sample Requests",
  products: "Products",
  settings: "Settings",
  new: "New",
};

function labelFor(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment;
}

export default function AdminHeader({
  adminUsername,
  logoutAction,
}: {
  adminUsername: string;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // "/admin/products/abc" -> ["admin", "products", "abc"]
  const segments = pathname.split("/").filter(Boolean);
  const isRoot = segments.length <= 1;

  // The last segment may be a record id, which has no friendly label.
  const title = isRoot
    ? "Dashboard"
    : labelFor(segments[1]);

  // Breadcrumb: Dashboard / Section, plus "Detail" when viewing one record.
  const trail: { label: string; href?: string }[] = [{ label: "Dashboard", href: "/admin" }];
  if (!isRoot) {
    trail.push({
      label: labelFor(segments[1]),
      href: segments.length > 2 ? `/admin/${segments[1]}` : undefined,
    });
    if (segments.length > 2) {
      trail.push({ label: labelFor(segments[2]) });
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-admin-border bg-admin-surface/95 backdrop-blur-sm">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-admin-ink-muted">
              {trail.map((crumb, i) => (
                <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span aria-hidden="true" className="text-admin-border-strong">
                      /
                    </span>
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-admin-ink hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="truncate">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <h1 className="mt-0.5 truncate text-base font-semibold text-admin-ink">
            {title}
          </h1>
        </div>

        {/* Account area. Shows who is signed in and nothing that does not exist. */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-2.5 sm:flex">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-admin-cream text-xs font-semibold uppercase text-admin-ink"
            >
              {adminUsername.slice(0, 2)}
            </span>
            <span className="text-sm font-medium text-admin-ink">{adminUsername}</span>
          </div>

          <form
            action={() => {
              startTransition(async () => {
                await logoutAction();
              });
            }}
          >
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-md border border-admin-border bg-admin-surface px-3 py-1.5 text-sm font-medium text-admin-ink transition-colors hover:bg-admin-cream disabled:opacity-50"
            >
              {isPending ? "Signing out…" : "Log out"}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
