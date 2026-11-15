/**
 * Browser (client-side) Supabase client.
 *
 * Uses @supabase/ssr's createBrowserClient so the session is stored in
 * cookies and readable by Server Components on the same domain. The
 * isSingleton option ensures only one client is created per browser tab,
 * regardless of how many times this module is imported.
 *
 * NEVER import this in a Server Component or Server Action — use
 * src/utils/supabase/server.ts for those instead.
 *
 * The publishable (anon) key is safe to expose to browsers. The service-role
 * key is NEVER used here.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { isSingleton: true },
  );
}
