/**
 * Serves admin-uploaded dish images from the upload directory.
 *
 * These files deliberately live outside public/ so a redeploy that replaces
 * the working tree cannot delete them (see src/lib/dish-image-storage.ts), so
 * they need an explicit handler to reach the browser.
 *
 * Only "/media/dishes/<file>" is served, and only file names matching the
 * generated pattern, so a crafted URL cannot escape the upload directory.
 */
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { getDishUploadDir, isSafeStoredFileName } from "@/lib/dish-image-storage";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // Expect exactly ["dishes", "<file>"]. Anything else is not ours to serve.
  if (!Array.isArray(segments) || segments.length !== 2 || segments[0] !== "dishes") {
    return new Response("Not found", { status: 404 });
  }

  const fileName = segments[1];
  if (!isSafeStoredFileName(fileName)) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = CONTENT_TYPES[path.extname(fileName).toLowerCase()];
  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(getDishUploadDir(), fileName);

  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      return new Response("Not found", { status: 404 });
    }

    const stream = Readable.toWeb(
      createReadStream(filePath),
    ) as WebReadableStream<Uint8Array>;

    return new Response(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stats.size),
        // File names are content-addressed (random UUID per upload), so a
        // given URL always refers to the same bytes.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
