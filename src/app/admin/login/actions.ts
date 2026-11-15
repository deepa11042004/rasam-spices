"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  verifyAdminPassword,
  createAdminSession,
} from "@/lib/admin-auth";

const MAX_USERNAME_LENGTH = 100;
const MAX_PASSWORD_LENGTH = 256;

export async function loginAction(formData: FormData): Promise<void> {
  const rawUsername = formData.get("username");
  const rawPassword = formData.get("password");

  // Reject missing, empty, or non-string values
  if (typeof rawUsername !== "string" || typeof rawPassword !== "string") {
    redirect("/admin/login?error=1");
  }

  const username = rawUsername.trim();
  const password = rawPassword; // do not trim passwords

  if (
    !username ||
    !password ||
    username.length > MAX_USERNAME_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    redirect("/admin/login?error=1");
  }

  const admin = await prisma.adminUser.findUnique({
    where: { username },
    select: { id: true, passwordHash: true },
  });

  if (!admin) {
    redirect("/admin/login?error=1");
  }

  let valid: boolean;
  try {
    valid = await verifyAdminPassword(admin.passwordHash, password);
  } catch {
    redirect("/admin/login?error=1");
  }

  if (!valid) {
    redirect("/admin/login?error=1");
  }

  await createAdminSession(admin.id);
  redirect("/admin");
}
