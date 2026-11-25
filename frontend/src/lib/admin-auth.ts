import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, ApiError, api, rethrowNextSignal } from "@/lib/api";

/** Safe subset of the administrator returned to callers: never includes the password hash. */
export interface SafeAdmin {
  id: string;
  username: string;
}

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/admin",
};

/**
 * Check credentials with the backend and, on success, store the session token
 * it issues in an HttpOnly cookie scoped to /admin. Returns false for any
 * rejected or failed login.
 */
export async function createAdminSession(username: string, password: string): Promise<boolean> {
  try {
    const result = await api<{ ok: true; token: string; expiresAt: Date }>("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });

    (await cookies()).set(SESSION_COOKIE, result.token, {
      ...cookieBase,
      expires: new Date(result.expiresAt),
    });
    return true;
  } catch (err) {
    if (!(err instanceof ApiError)) console.error("[createAdminSession]", err);
    return false;
  }
}

/** The administrator for the current session cookie, or null when signed out or expired. */
export async function getCurrentAdmin(): Promise<SafeAdmin | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const result = await api<{ ok: true; admin: SafeAdmin }>("/api/auth/me", { admin: true, noRedirect: true });
    return result.admin;
  } catch (err) {
    rethrowNextSignal(err);
    if (!(err instanceof ApiError)) console.error("[getCurrentAdmin]", err);
    return null;
  }
}

/** End the session on the backend and expire the browser cookie. */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();

  if (cookieStore.get(SESSION_COOKIE)?.value) {
    try {
      await api("/api/auth/logout", { method: "POST", admin: true, noRedirect: true });
    } catch (err) {
      console.error("[destroyAdminSession]", err);
    }
  }

  cookieStore.set(SESSION_COOKIE, "", { ...cookieBase, maxAge: 0 });
}
