/**
 * Supabase client for use inside src/proxy.ts (the Next.js 16 request proxy).
 *
 * This is the ONLY place where both getAll AND setAll are configured: the
 * proxy runs before every request and is the single point that can read from
 * the incoming request's cookies and write refreshed session cookies into the
 * outgoing response. All other server-side code (Server Actions, Server
 * Components) uses src/utils/supabase/server.ts which reads but does not write.
 *
 * Pattern: construct a NextResponse first, then pass it in along with the
 * request so both sides of the cookie round-trip are covered.
 *
 * Usage inside src/proxy.ts:
 *
 *   const { supabase, response } = createProxyClient(request);
 *   await supabase.auth.getUser(); // triggers refresh if the token is expiring
 *   return response;               // the refreshed cookie is on this response
 */
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export function createProxyClient(request: NextRequest) {
  // Start from a plain pass-through response so the proxy can attach cookies
  // to it without disrupting the normal rendering pipeline.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write every cookie onto both the mutated request (so downstream
          // server code in this same cycle sees it) and the response (so the
          // browser receives it).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return { supabase, response };
}
