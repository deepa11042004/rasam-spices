import "server-only";
import { randomBytes, createHash } from "node:crypto";
import argon2 from "argon2";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Safe subset of AdminUser returned to callers — never includes passwordHash */
export interface SafeAdmin {
  id: string;
  username: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_COOKIE = "rasam_admin_session";
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours
const TOKEN_BYTES = 32;

// ---------------------------------------------------------------------------
// Password helpers
// ---------------------------------------------------------------------------

/**
 * Hash a plaintext password with Argon2id using explicit secure parameters.
 */
export async function hashAdminPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

/**
 * Verify a plaintext password against an Argon2 hash.
 * Returns `true` when the password matches.
 */
export async function verifyAdminPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  return argon2.verify(hash, password);
}

// ---------------------------------------------------------------------------
// Token helpers (internal)
// ---------------------------------------------------------------------------

function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

/**
 * Create a new admin session.
 *
 * 1. Generates a 32-byte cryptographically random token.
 * 2. Stores only its SHA-256 hash in `AdminSession.tokenHash`.
 * 3. Sets the raw token in an HttpOnly cookie scoped to `/admin`.
 *
 * Returns the safe admin fields so the caller can use them immediately.
 */
export async function createAdminSession(
  adminUserId: string,
): Promise<void> {
  const rawToken = randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await prisma.adminSession.create({
    data: {
      tokenHash,
      adminUserId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: expiresAt,
  });
}

/**
 * Read the session cookie, look up the matching session, and return the
 * administrator's safe fields.
 *
 * - Rejects expired or missing sessions.
 * - Deletes any expired session record it encounters.
 * - Never returns `passwordHash`.
 */
export async function getCurrentAdmin(): Promise<SafeAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const tokenHash = sha256(token);

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { adminUser: { select: { id: true, username: true } } },
  });

  if (!session) return null;

  // Expired — clean up and reject
  if (session.expiresAt <= new Date()) {
    await prisma.adminSession.deleteMany({ where: { id: session.id } });
    return null;
  }

  return session.adminUser;
}

/**
 * Destroy the current admin session.
 *
 * 1. Deletes the session row from MySQL (by token hash).
 * 2. Expires the browser cookie using matching attributes.
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const tokenHash = sha256(token);

    // deleteMany won't throw if the row is already gone
    await prisma.adminSession.deleteMany({ where: { tokenHash } });
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 0,
  });
}
