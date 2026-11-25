import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { handler, param } from "@/lib/async-handler";
import { requireAdmin } from "@/middleware/auth";
import {
  MAX_DISH_IMAGE_BYTES,
  deleteDishImage,
  getDishUploadDir,
  isSafeStoredFileName,
  saveDishImage,
} from "./dish-image-storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DISH_IMAGE_BYTES, files: 1 },
});

/** Admin image management. Mounted at /api/admin/uploads. */
export const adminUploadsRouter = Router();
adminUploadsRouter.use(requireAdmin);

/** POST /api/admin/uploads/dish-image  (multipart, field "file") -> { ok, ref } */
adminUploadsRouter.post(
  "/dish-image",
  (req, res, next) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.json({ ok: false, message: "Image is larger than 5 MB. Please choose a smaller file." });
        return;
      }
      if (err) {
        next(err);
        return;
      }
      next();
    });
  },
  handler(async (req, res) => {
    const file = req.file;
    if (!file) {
      res.json({ ok: false, message: "No image file was received." });
      return;
    }
    // saveDishImage works on the Web File API; Node 20 provides File globally.
    const asFile = new File([new Uint8Array(file.buffer)], file.originalname, { type: file.mimetype });
    res.json(await saveDishImage(asFile));
  }),
);

/** DELETE /api/admin/uploads/dish-image  { ref } */
adminUploadsRouter.delete(
  "/dish-image",
  handler(async (req, res) => {
    await deleteDishImage(req.body?.ref);
    res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------------------
// Legacy media: images uploaded by the earlier disk-based implementation.
// Only "/media/dishes/<file>" is served, and only generated-looking file names.
// ---------------------------------------------------------------------------

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

/** Mounted at /media. */
export const mediaRouter = Router();

mediaRouter.get(
  "/dishes/:file",
  handler(async (req, res) => {
    const fileName = param(req, "file");
    const contentType = CONTENT_TYPES[path.extname(fileName).toLowerCase()];

    if (!isSafeStoredFileName(fileName) || !contentType) {
      res.status(404).send("Not found");
      return;
    }

    const filePath = path.join(getDishUploadDir(), fileName);
    try {
      const stats = await stat(filePath);
      if (!stats.isFile()) {
        res.status(404).send("Not found");
        return;
      }
      res.set({
        "Content-Type": contentType,
        "Content-Length": String(stats.size),
        // Names are content-addressed (random UUID per upload).
        "Cache-Control": "public, max-age=31536000, immutable",
        // The frontend (a different origin) embeds these images.
        "Cross-Origin-Resource-Policy": "cross-origin",
      });
      createReadStream(filePath).pipe(res);
    } catch {
      res.status(404).send("Not found");
    }
  }),
);
