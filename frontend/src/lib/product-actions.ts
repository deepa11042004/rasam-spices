"use server";

/**
 * Server actions for product catalogue management.
 *
 * Each action forwards the admin session to the backend, which verifies it and
 * performs the mutation. Afterwards the affected pages are revalidated here,
 * because the page cache belongs to the frontend.
 */
import { revalidatePath } from "next/cache";
import { apiAction } from "@/lib/api";
import type { ActionResult, ProductFormData } from "@/lib/product-constants";

function revalidateCatalogue() {
  revalidatePath("/admin/products");
  revalidatePath("/admin"); // dashboard category + inventory counts
  revalidatePath("/products");
  revalidatePath("/");
}

export async function createProduct(data: ProductFormData): Promise<ActionResult> {
  const result = await apiAction("/api/admin/products", { method: "POST", body: data });
  if (result.ok) revalidateCatalogue();
  return result;
}

export async function updateProduct(data: ProductFormData): Promise<ActionResult> {
  const id = typeof data?.id === "string" ? data.id : "";
  if (!id) return { ok: false, message: "Product ID is required" };

  const result = await apiAction<{ ok: true; message?: string; slug?: string | null }>(
    `/api/admin/products/${encodeURIComponent(id)}`,
    { method: "PUT", body: data },
  );

  if (result.ok) {
    revalidateCatalogue();
    revalidatePath(`/products/${id}`);
    const slug = "slug" in result ? result.slug : null;
    if (slug) revalidatePath(`/products/${slug}`);
  }
  return result;
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  if (!id || typeof id !== "string") return { ok: false, message: "Invalid ID" };

  const result = await apiAction(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (result.ok) revalidateCatalogue();
  return result;
}

export async function toggleProductVisibility(
  id: string,
  isVisible: boolean,
): Promise<ActionResult> {
  const result = await apiAction(`/api/admin/products/${encodeURIComponent(id)}/visibility`, {
    method: "PATCH",
    body: { isVisible },
  });
  if (result.ok) revalidateCatalogue(); // homepage featured section included
  return result;
}

export async function toggleProductFeatured(
  id: string,
  isFeatured: boolean,
): Promise<ActionResult> {
  const result = await apiAction(`/api/admin/products/${encodeURIComponent(id)}/featured`, {
    method: "PATCH",
    body: { isFeatured },
  });
  if (result.ok) revalidateCatalogue(); // featured slider on the Products page
  return result;
}
