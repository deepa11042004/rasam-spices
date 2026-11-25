"use server";

/**
 * Admin-only server actions for uploading and discarding dish images.
 *
 * The upload happens as soon as the admin picks a file, so the form can show
 * a real preview and store only the resulting reference string. Saving the
 * product then persists that reference through the normal product actions.
 * The backend validates, stores and deletes the files.
 */
import { apiAction } from "@/lib/api";

export type UploadDishImageResult =
  | { ok: true; ref: string }
  | { ok: false; message: string };

/** Store an uploaded dish image and return its reference. */
export async function uploadDishImage(
  formData: FormData,
): Promise<UploadDishImageResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, message: "No image file was received." };
  }

  // Forward only the file, nothing else the browser may have sent.
  const body = new FormData();
  body.append("file", file);

  const result = await apiAction<{ ok: true; ref: string }>("/api/admin/uploads/dish-image", {
    method: "POST",
    formData: body,
  });

  if (result.ok && "ref" in result) return { ok: true, ref: result.ref };
  return { ok: false, message: result.ok ? "Could not upload the image. Please try again." : result.message };
}

/**
 * Delete an uploaded dish image file.
 *
 * Used when the admin replaces or removes an image before saving, so
 * abandoned uploads don't accumulate. The backend only ever touches files
 * under its managed media locations.
 */
export async function discardDishImage(ref: string): Promise<{ ok: boolean }> {
  const result = await apiAction("/api/admin/uploads/dish-image", {
    method: "DELETE",
    body: { ref },
  });
  return { ok: result.ok };
}
