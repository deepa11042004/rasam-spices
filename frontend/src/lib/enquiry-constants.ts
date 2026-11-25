/**
 * Shared enquiry constants and types.
 *
 * This file is a normal TypeScript module (NOT "use server") so it can
 * export constants, arrays and types freely.  Server-action functions
 * stay in admin-actions.ts.
 *
 * Business-approved status workflow (same across all enquiry types):
 *   NEW → CONTACTED → IN_PROGRESS → CONVERTED → CLOSED_LOST
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

/** Canonical enquiry statuses used across all three enquiry modules. */
export const ENQUIRY_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "CONVERTED", label: "Converted" },
  { value: "CLOSED_LOST", label: "Closed / Lost" },
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number]["value"];
