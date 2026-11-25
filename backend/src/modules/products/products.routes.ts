import { Router } from "express";
import { handler, param, queryString } from "@/lib/async-handler";
import { requireAdmin } from "@/middleware/auth";
import * as products from "./products.service";

/** Public, read-only catalogue endpoints. Mounted at /api/products. */
export const publicProductsRouter = Router();

publicProductsRouter.get(
  "/",
  handler(async (_req, res) => {
    res.json(await products.listVisibleProducts());
  }),
);

publicProductsRouter.get(
  "/featured",
  handler(async (_req, res) => {
    res.json(await products.listFeaturedProducts());
  }),
);

/** GET /api/products/dish-photos?slugs=a,b,c -> [{ slug, dishPhotoSrc }] */
publicProductsRouter.get(
  "/dish-photos",
  handler(async (req, res) => {
    const slugs = queryString(req, "slugs").split(",").map((s) => s.trim());
    res.json(await products.listDishPhotos(slugs));
  }),
);

publicProductsRouter.get(
  "/by-slug/:slug",
  handler(async (req, res) => {
    const record = await products.findVisibleBySlug(param(req, "slug"));
    if (!record) {
      res.status(404).json({ ok: false, message: "Not found" });
      return;
    }
    res.json(record);
  }),
);

publicProductsRouter.get(
  "/by-id/:id",
  handler(async (req, res) => {
    const record = await products.findVisibleById(param(req, "id"));
    if (!record) {
      res.status(404).json({ ok: false, message: "Not found" });
      return;
    }
    res.json(record);
  }),
);

/** GET /api/products/slug-of/:id -> { slug } (any product, visible or not) */
publicProductsRouter.get(
  "/slug-of/:id",
  handler(async (req, res) => {
    res.json({ slug: await products.findSlugById(param(req, "id")) });
  }),
);

/** Admin catalogue management. Mounted at /api/admin/products. */
export const adminProductsRouter = Router();
adminProductsRouter.use(requireAdmin);

adminProductsRouter.get(
  "/",
  handler(async (req, res) => {
    const page = Math.max(1, Number(queryString(req, "page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(queryString(req, "pageSize")) || 25));
    res.json(
      await products.searchProducts({
        q: queryString(req, "q").trim(),
        category: queryString(req, "category"),
        visibility: queryString(req, "visibility"),
        page,
        pageSize,
      }),
    );
  }),
);

adminProductsRouter.get(
  "/:id",
  handler(async (req, res) => {
    const record = await products.getProductById(param(req, "id"));
    if (!record) {
      res.status(404).json({ ok: false, message: "Not found" });
      return;
    }
    res.json(record);
  }),
);

adminProductsRouter.post(
  "/",
  handler(async (req, res) => {
    res.json(await products.createProduct(req.body));
  }),
);

adminProductsRouter.put(
  "/:id",
  handler(async (req, res) => {
    res.json(await products.updateProduct({ ...req.body, id: param(req, "id") }));
  }),
);

adminProductsRouter.delete(
  "/:id",
  handler(async (req, res) => {
    res.json(await products.deleteProduct(param(req, "id")));
  }),
);

adminProductsRouter.patch(
  "/:id/visibility",
  handler(async (req, res) => {
    res.json(await products.setVisibility(param(req, "id"), req.body?.isVisible));
  }),
);

adminProductsRouter.patch(
  "/:id/featured",
  handler(async (req, res) => {
    res.json(await products.setFeatured(param(req, "id"), req.body?.isFeatured));
  }),
);
