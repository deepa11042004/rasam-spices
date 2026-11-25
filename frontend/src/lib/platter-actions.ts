"use server";

/**
 * Admin action for the homepage dish platter configuration.
 *
 * The backend writes only the configuration row, so removing a product from
 * the platter can never hide or delete the product itself.
 */
import { revalidatePath } from "next/cache";
import { apiAction } from "@/lib/api";
import type { ActionResult } from "@/lib/enquiry-constants";

export async function savePlatterConfig(input: {
  enabled: boolean;
  productSlugs: string[];
}): Promise<ActionResult> {
  const result = await apiAction("/api/admin/platter", { method: "PUT", body: input });

  if (result.ok) {
    // Refresh the homepage so the platter reflects the new configuration.
    revalidatePath("/");
    revalidatePath("/admin/dish-platter");
  }
  return result;
}
