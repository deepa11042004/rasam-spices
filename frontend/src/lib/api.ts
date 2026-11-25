/**
 * HTTP client for the RASAM backend API (see /backend).
 *
 * The frontend never touches the database: every read and write goes through
 * this module. Server-side only, because admin calls forward the admin session
 * token that lives in an HttpOnly cookie.
 */
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

/** Name of the HttpOnly cookie that holds the admin session token. */
export const SESSION_COOKIE = "rasam_admin_session";

const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** JSON has no Date type: revive the *At timestamp fields (createdAt, updatedAt, ...). */
function reviveDates(key: string, value: unknown): unknown {
  if (typeof value === "string" && /At$/.test(key) && !Number.isNaN(Date.parse(value))) {
    return new Date(value);
  }
  return value;
}

/**
 * Next signals "this render must wait for a request" (and redirects, 404s) by
 * throwing. Code that catches backend failures to fall back to defaults must
 * let those through; call this first in such a catch block.
 */
export function rethrowNextSignal(err: unknown): void {
  const digest = (err as { digest?: unknown } | null)?.digest;
  if (typeof digest === "string" && (digest === "DYNAMIC_SERVER_USAGE" || digest.startsWith("NEXT_"))) {
    throw err;
  }
}

export type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON request body. */
  body?: unknown;
  /** Multipart request body (file uploads). */
  formData?: FormData;
  /** Query string parameters; empty values are omitted. */
  query?: Record<string, string | number | undefined | null>;
  /** Send the admin session token. A 401 then redirects to the sign-in page. */
  admin?: boolean;
  /** Throw ApiError on 401 instead of redirecting (used by server actions). */
  noRedirect?: boolean;
};

function buildUrl(path: string, query?: ApiOptions["query"]): string {
  const url = new URL(`${BACKEND_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Call the backend and return the parsed JSON body. Throws ApiError on a non-2xx status. */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  // Backend data is per-request: never run it during static prerendering.
  await connection();

  const headers: Record<string, string> = {};

  if (options.admin) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body,
    // Content is edited in the admin panel and must show up immediately.
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 && options.admin && !options.noRedirect) redirect("/admin/login");
    throw new ApiError(response.status, `Backend request failed: ${options.method ?? "GET"} ${path} (${response.status})`);
  }

  const text = await response.text();
  return (text ? JSON.parse(text, reviveDates) : null) as T;
}

/** Like api(), but resolves to null when the backend answers 404. */
export async function apiOrNull<T>(path: string, options: ApiOptions = {}): Promise<T | null> {
  try {
    return await api<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

/**
 * Call a backend mutation that answers with an ActionResult. Auth and network
 * failures become a failed result instead of an exception, so a server action
 * can hand a readable message back to the form.
 */
export async function apiAction<T extends ActionResult = ActionResult>(
  path: string,
  options: ApiOptions = {},
): Promise<T | { ok: false; message: string }> {
  try {
    return await api<T>(path, { ...options, admin: options.admin ?? true, noRedirect: true });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return { ok: false, message: "Unauthorized" };
    console.error("[apiAction]", path, err);
    return { ok: false, message: "The server could not be reached. Please try again." };
  }
}
