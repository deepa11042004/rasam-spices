import { randomBytes, createHash } from "node:crypto";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";

export interface SafeAdmin {
  id: string;
  username: string;
}

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours
const TOKEN_BYTES = 32;
const MAX_USERNAME_LENGTH = 100;
const MAX_PASSWORD_LENGTH = 256;

export function sha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

export async function hashAdminPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyAdminPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

/**
 * Verify credentials and open a session. Only the SHA-256 hash of the random
 * token is stored; the raw token is returned once, to the caller.
 */
export async function login(
  rawUsername: unknown,
  rawPassword: unknown,
): Promise<{ token: string; expiresAt: Date } | null> {
  if (typeof rawUsername !== "string" || typeof rawPassword !== "string") return null;

  const username = rawUsername.trim();
  const password = rawPassword; // passwords are never trimmed

  if (
    !username ||
    !password ||
    username.length > MAX_USERNAME_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return null;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { username },
    select: { id: true, passwordHash: true },
  });
  if (!admin) return null;

  let valid = false;
  try {
    valid = await verifyAdminPassword(admin.passwordHash, password);
  } catch {
    return null;
  }
  if (!valid) return null;

  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await prisma.adminSession.create({
    data: { tokenHash: sha256(token), adminUserId: admin.id, expiresAt },
  });

  return { token, expiresAt };
}

/** Resolve a raw session token to its administrator, or null if invalid or expired. */
export async function getAdminByToken(token: string): Promise<SafeAdmin | null> {
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { adminUser: { select: { id: true, username: true } } },
  });
  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.adminSession.deleteMany({ where: { id: session.id } });
    return null;
  }

  return session.adminUser;
}

export async function logout(token: string): Promise<void> {
  if (!token) return;
  await prisma.adminSession.deleteMany({ where: { tokenHash: sha256(token) } });
}
