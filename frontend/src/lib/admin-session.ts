import { cache } from "react";
import { getCurrentAdmin } from "@/lib/admin-auth";

/**
 * Request-scoped cached wrapper around getCurrentAdmin().
 *
 * React.cache() deduplicates calls within a single server render pass,
 * so the layout and page can both call this without hitting the database
 * twice. The underlying auth check (cookie → hash → Prisma lookup) runs
 * once per request.
 */
export const getSessionAdmin = cache(getCurrentAdmin);
