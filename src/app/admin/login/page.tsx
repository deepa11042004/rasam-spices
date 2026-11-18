import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { loginAction } from "./actions";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  const params = await searchParams;
  const hasError = params.error === "1";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-admin-ink">
            RASAM Admin
          </h1>
          <p className="mt-1 text-sm text-admin-ink-muted">
            Sign in to the administration panel
          </p>
        </div>

        {/* Error banner */}
        {hasError && (
          <div
            role="alert"
            className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            Invalid username or password.
          </div>
        )}

        {/* Login form */}
        <form action={loginAction} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-admin-ink"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="block w-full rounded-md border border-admin-border-strong bg-white px-3 py-2 text-sm shadow-sm placeholder:text-admin-ink-muted/60 focus:border-admin-spice focus:outline-none focus:ring-1 focus:ring-admin-spice/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-admin-ink"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="block w-full rounded-md border border-admin-border-strong bg-white px-3 py-2 text-sm shadow-sm placeholder:text-admin-ink-muted/60 focus:border-admin-spice focus:outline-none focus:ring-1 focus:ring-admin-spice/20"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-admin-spice px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-admin-spice-dark focus:outline-none focus:ring-2 focus:ring-admin-spice/20 focus:ring-offset-2 active:bg-admin-spice-dark"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
