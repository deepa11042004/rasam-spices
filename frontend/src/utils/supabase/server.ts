/**
 * Server-side Supabase client for use in Server Components and Server Actions.
 *
 * Always call createClient() fresh — never share an instance across requests.
 * This client can read cookies from the incoming request. It does NOT write
 * cookies (setAll is omitted); the proxy at src/proxy.ts handles session
 * refresh and writes the updated session back to cookies on every response.
 *
 * Uses the publishable (anon) key with Row Level Security. The service-role
 * key is never used in browser-reachable code.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // setAll is intentionally omitted here: writes are handled by the
        // proxy (src/proxy.ts → src/utils/supabase/proxy.ts) so session
        // refreshes are written back to the response on every request.
        // Omitting setAll causes the client to log a warning only when it
        // *needs* to write (e.g. token refresh) — in that case the proxy
        // has already handled it.
      },
    },
  );
}
