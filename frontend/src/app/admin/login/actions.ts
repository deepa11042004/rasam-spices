"use server";

import { redirect } from "next/navigation";
import { createAdminSession } from "@/lib/admin-auth";

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

  // The backend verifies the password and issues the session token.
  if (!(await createAdminSession(username, password))) {
    redirect("/admin/login?error=1");
  }

  redirect("/admin");
}
