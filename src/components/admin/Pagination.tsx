import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  }

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className="rounded-md px-3 py-1.5 text-sm text-admin-ink-muted hover:bg-admin-cream"
        >
          Previous
        </Link>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-admin-ink-muted/80">
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              p === currentPage
                ? "bg-admin-spice text-white"
                : "text-admin-ink-muted hover:bg-admin-cream"
            }`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </Link>
        ),
      )}
      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1)}
          className="rounded-md px-3 py-1.5 text-sm text-admin-ink-muted hover:bg-admin-cream"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
