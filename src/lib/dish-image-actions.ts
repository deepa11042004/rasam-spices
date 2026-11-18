"use server";

/**
 * Admin-only server actions for uploading and discarding dish images.
 *
 * The upload happens as soon as the admin picks a file, so the form can show
 * a real preview and store only the resulting reference string. Saving the
 * product then persists that reference through the normal product actions.
 */
import { getSessionAdmin } from "@/lib/admin-session";
import { deleteDishImage, saveDishImage } from "@/lib/dish-image-storage";

export type UploadDishImageResult =
  | { ok: true; ref: string }
  | { ok: false; message: string };

/**
 * Store an uploaded dish image and return its reference.
 * Requires an authenticated admin session.
 */
export async function uploadDishImage(
  formData: FormData,
): Promise<UploadDishImageResult> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false, message: "Unauthorized" };

  try {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false, message: "No image file was received." };
    }

    return await saveDishImage(file);
  } catch (err) {
    console.error("[uploadDishImage]", err);
    return { ok: false, message: "Could not upload the image. Please try again." };
  }
}

/**
 * Delete an uploaded dish image file.
 *
 * Used when the admin replaces or removes an image before saving, so
 * abandoned uploads don't accumulate on disk. Only files under the managed
 * media prefix are ever touched.
 */
export async function discardDishImage(ref: string): Promise<{ ok: boolean }> {
  const admin = await getSessionAdmin();
  if (!admin) return { ok: false };

  try {
    await deleteDishImage(ref);
    return { ok: true };
  } catch (err) {
    console.error("[discardDishImage]", err);
    return { ok: false };
  }
}
