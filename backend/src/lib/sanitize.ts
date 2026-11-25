/** Strip control characters, trim and cap the length of a user-supplied string. */
export function sanitize(value: unknown, maxLen = 1000): string {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, maxLen);
}

/** Lowercase alphanumeric + hyphens only. */
export function sanitizeId(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 100);
}

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };
