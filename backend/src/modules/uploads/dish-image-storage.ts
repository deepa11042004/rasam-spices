/**
 * File storage for admin-uploaded dish images, backed by Vercel Blob.
 *
 * Why Blob: the app deploys to Vercel, whose filesystem is read-only apart
 * from an ephemeral /tmp, so writing uploads to disk fails at runtime and
 * anything written would not survive a redeploy. Blob is Vercel's own managed
 * object store, so no third-party provider is introduced.
 *
 * The database still only stores a reference string in the existing
 * Product.dishPhotoSrc column — now the blob's public https URL. Nothing about
 * the admin form or the public platter depends on where that string points.
 *
 * Backwards compatibility: images uploaded by the earlier disk-based version
 * are referenced as "/media/dishes/<file>" and are still served by
 * src/app/media/[...path]/route.ts, so existing records keep working. Only new
 * uploads go to Blob.
 */
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

/** Folder prefix inside the blob store. */
export const DISH_BLOB_FOLDER = "dishes";

/** URL prefix used by the earlier local-disk implementation. */
export const LEGACY_MEDIA_PREFIX = "/media/dishes/";

/** Accepted image types, mapped to the extension we store them under. */
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

export const MAX_DISH_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Hostname pattern for Vercel Blob public URLs. */
const BLOB_HOST = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

export function isBlobRef(ref: unknown): boolean {
  return typeof ref === "string" && BLOB_HOST.test(ref);
}

/** A reference created by the earlier local-disk implementation. */
export function isLegacyLocalRef(ref: unknown): boolean {
  return typeof ref === "string" && ref.startsWith(LEGACY_MEDIA_PREFIX);
}

/**
 * True when a stored reference is one this module manages.
 *
 * Guards deletion: a static asset shipped with the repository, such as
 * "/images/dishes/Biryani.png", must never be removed.
 */
export function isManagedDishImage(ref: unknown): ref is string {
  return isBlobRef(ref) || isLegacyLocalRef(ref);
}

/**
 * Reject anything that is not a plain file name, so a crafted reference can
 * never escape the legacy upload directory. Used by the legacy media route.
 */
export function isSafeStoredFileName(name: string): boolean {
  if (!name || name.length > 200) return false;
  if (name.includes("/") || name.includes("\\") || name.includes("\0")) return false;
  if (name === "." || name === "..") return false;
  return /^[A-Za-z0-9._-]+$/.test(name);
}

/**
 * Directory the earlier implementation wrote to. Still used to serve and
 * delete legacy files in local development; on Vercel nothing is there.
 */
export function getDishUploadDir(): string {
  const configured = process.env.DISH_UPLOAD_DIR || process.env.UPLOAD_DIR;
  if (configured && configured.trim()) {
    const dir = configured.trim();
    return path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
  }
  return path.resolve(process.cwd(), "storage", "uploads", "dishes");
}

export type SaveResult =
  | { ok: true; ref: string }
  | { ok: false; message: string };

/**
 * Upload a dish image to Vercel Blob and return its public URL.
 *
 * The blob pathname is generated, never taken from the upload, so a hostile
 * filename cannot influence where the object lands.
 */
export async function saveDishImage(file: File): Promise<SaveResult> {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    return { ok: false, message: "No image file was received." };
  }

  if (file.size > MAX_DISH_IMAGE_BYTES) {
    return { ok: false, message: "Image is larger than 5 MB. Please choose a smaller file." };
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return { ok: false, message: "Unsupported image type. Use JPEG, PNG, WebP or AVIF." };
  }

  // The SDK reads BLOB_READ_WRITE_TOKEN itself, but check first so a missing
  // token produces a clear message instead of an opaque SDK error.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      message:
        "Image storage is not configured. BLOB_READ_WRITE_TOKEN is missing on the server.",
    };
  }

  try {
    const blob = await put(
      `${DISH_BLOB_FOLDER}/${randomUUID()}${extension}`,
      file,
      {
        access: "public",
        // The name is already a UUID, so no extra suffix is needed.
        addRandomSuffix: false,
        contentType: file.type,
      },
    );

    return { ok: true, ref: blob.url };
  } catch (err) {
    console.error("[saveDishImage]", err);
    return { ok: false, message: "Could not upload the image. Please try again." };
  }
}

/**
 * Delete a previously uploaded dish image.
 *
 * Handles both Blob objects and files left by the earlier disk-based version.
 * Static repository assets and anything with an unexpected shape are ignored.
 * A missing object is not an error — the goal is simply that it is gone.
 */
export async function deleteDishImage(ref: unknown): Promise<void> {
  if (!isManagedDishImage(ref)) return;

  if (isBlobRef(ref)) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return;
    try {
      await del(ref);
    } catch (err) {
      console.error("[deleteDishImage]", err);
    }
    return;
  }

  // Legacy local file.
  const fileName = ref.slice(LEGACY_MEDIA_PREFIX.length);
  if (!isSafeStoredFileName(fileName)) return;

  try {
    await unlink(path.join(getDishUploadDir(), fileName));
  } catch {
    // Already gone, or the filesystem is read-only (Vercel). Nothing to do.
  }
}
