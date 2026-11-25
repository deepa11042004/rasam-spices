/**
 * Next.js 16 request proxy  (src/proxy.ts)
 *
 * Replaces the deprecated src/middleware.ts. The function name must be
 * `proxy` (default or named export), not `middleware`.
 *
 * Purpose: refresh the Supabase session on every request so the access token
 * never silently expires between page loads. getUser() is called (not
 * getSession()) because getUser() re-validates the JWT with the Supabase
 * Auth server on every call, while getSession() trusts the cookie blindly.
 *
 * The proxy does NOT redirect unauthenticated users — this site's contact
 * forms are publicly accessible. All routes remain open; the proxy's only
 * role is session-cookie maintenance.
 *
 * The matcher excludes static assets, image-optimisation routes, and the
 * public folder so those fast paths are never slowed down.
 */
import type { NextRequest } from "next/server";
import { createProxyClient } from "@/utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createProxyClient(request);

  // Calling getUser() causes @supabase/ssr to refresh an expiring JWT and
  // write the updated session into the cookies on `response`.
  // The return value (user / error) is intentionally unused here: the proxy
  // is not responsible for auth-gating routes on this public-facing site.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match every pathname EXCEPT:
     *   - _next/static  (bundled JS / CSS)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     *   - Any file in public/ that has an extension (images, fonts, svg…)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
