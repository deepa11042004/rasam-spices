"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Client-side chrome wrapper.
 *
 * Header and Footer are passed in as rendered elements rather than imported
 * here: Footer is an async Server Component that reads company settings from
 * the database, and importing it into this client component would pull
 * server-only code (Prisma) into the client bundle.
 */
export default function PublicChrome({
  children,
  header,
  footer,
  floating,
}: {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
  floating: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {header}
      <main id="main" className="flex-1">
        {children}
      </main>
      {footer}
      {floating}
    </>
  );
}
