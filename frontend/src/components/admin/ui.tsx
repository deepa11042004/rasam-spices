/**
 * Shared presentational primitives for the admin CRM.
 *
 * Before this existed every admin page re-declared its own button, input and
 * card classes, which is why spacing and colour drifted between pages. These
 * are styling-only: no data fetching, no state, no business logic. They are
 * plain functions and exported class strings, so they work inside both Server
 * and Client Components without forcing a boundary either way.
 */
import type { ReactNode } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Shared class strings
// ---------------------------------------------------------------------------

/** Text input, textarea and select. */
export const inputClass =
  "block w-full rounded-md border border-admin-border bg-admin-surface px-3 py-2 text-sm text-admin-ink shadow-xs transition-colors placeholder:text-admin-ink-muted/60 focus:border-admin-spice focus:outline-none focus:ring-2 focus:ring-admin-spice/20 disabled:cursor-not-allowed disabled:bg-admin-cream/60";

export const selectClass = `${inputClass} pr-8`;
export const textareaClass = `${inputClass} min-h-24`;

export const labelClass =
  "mb-1.5 block text-sm font-medium text-admin-ink";

export const hintClass = "mt-1 text-xs text-admin-ink-muted";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-spice disabled:cursor-not-allowed disabled:opacity-50";

export const buttonClass = {
  /** Primary action: save, create, confirm. */
  primary: `${buttonBase} bg-admin-spice text-white shadow-xs hover:bg-admin-spice-dark`,
  /** Secondary action: cancel, back, neutral choices. */
  secondary: `${buttonBase} border border-admin-border bg-admin-surface text-admin-ink hover:bg-admin-cream`,
  /** Quiet action inside dense UI. */
  ghost: `${buttonBase} text-admin-ink-muted hover:bg-admin-cream hover:text-admin-ink`,
  /** Destructive action: delete. */
  danger: `${buttonBase} border border-red-300 bg-white text-red-700 hover:bg-red-50`,
} as const;

/** Surface for cards and panels. */
export const cardClass =
  "rounded-lg border border-admin-border bg-admin-surface shadow-xs";

// ---------------------------------------------------------------------------
// Page scaffolding
// ---------------------------------------------------------------------------

/**
 * Consistent page title block. `breadcrumb` renders above the title; `actions`
 * sits on the right on wider screens.
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 border-b border-admin-border pb-5">
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-admin-ink">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-admin-ink-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** Heading for a block within a page. */
export function SectionHeading({
  title,
  note,
  actions,
}: {
  title: string;
  note?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-admin-ink">{title}</h2>
        {note && <p className="mt-0.5 text-xs text-admin-ink-muted">{note}</p>}
      </div>
      {actions}
    </div>
  );
}

/** Small uppercase label used above dense lists and card groups. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-admin-ink-muted">
      {children}
    </h3>
  );
}

/** Card wrapper with consistent padding. */
export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`${cardClass} ${padded ? "p-4" : ""} ${className}`}>
      {children}
    </div>
  );
}

/**
 * KPI tile. Renders as a link when `href` is given, otherwise a plain card.
 * `accent` draws a subtle gold top rule for the figures worth noticing.
 */
export function StatCard({
  label,
  value,
  href,
  hint,
  accent = false,
  children,
}: {
  label: string;
  value: ReactNode;
  href?: string;
  hint?: string;
  accent?: boolean;
  children?: ReactNode;
}) {
  const body = (
    <>
      {accent && (
        <span
          aria-hidden="true"
          className="mb-3 block h-0.5 w-8 rounded-full bg-admin-gold"
        />
      )}
      <div className="text-2xl font-semibold tracking-tight text-admin-ink">{value}</div>
      <div className="mt-1 text-xs font-medium text-admin-ink-muted">{label}</div>
      {hint && <p className="mt-1 text-xs text-admin-ink-muted/80">{hint}</p>}
      {children}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${cardClass} block p-4 transition-shadow hover:border-admin-border-strong hover:shadow-sm`}
      >
        {body}
      </Link>
    );
  }

  return <div className={`${cardClass} p-4`}>{body}</div>;
}

/** Consistent empty state for lists and tables. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-admin-border-strong bg-admin-cream/30 px-8 py-14 text-center">
      <p className="text-sm font-medium text-admin-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm text-admin-ink-muted">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** Scroll container + border for data tables, so every table matches. */
export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-admin-border bg-admin-surface">
      <table className="min-w-full divide-y divide-admin-border text-sm">{children}</table>
    </div>
  );
}

export const theadClass = "bg-admin-cream/60";
export const thClass =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-admin-ink-muted";
export const tbodyClass = "divide-y divide-admin-border/70";
export const trClass = "transition-colors hover:bg-admin-cream/40";
export const tdClass = "px-4 py-3 text-admin-ink";

/** Inline feedback after a save or a failed action. */
export function FormFeedback({ ok, message }: { ok: boolean; message: string }) {
  return (
    <span
      role={ok ? "status" : "alert"}
      className={`text-sm ${ok ? "text-green-700" : "text-red-700"}`}
    >
      {message}
    </span>
  );
}
