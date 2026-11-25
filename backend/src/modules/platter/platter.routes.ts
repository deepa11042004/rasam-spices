import { Router } from "express";
import { handler, queryString } from "@/lib/async-handler";
import { requireAdmin } from "@/middleware/auth";
import * as platter from "./platter.service";

/** Public platter data. Mounted at /api/platter. */
export const publicPlatterRouter = Router();

/** GET /api/platter/config -> { config: PlatterConfig | null } */
publicPlatterRouter.get(
  "/config",
  handler(async (_req, res) => {
    res.json({ config: await platter.getSavedConfig() });
  }),
);

/** GET /api/platter/products?slugs=a,b -> [{ slug, name, dishPhotoSrc }] */
publicPlatterRouter.get(
  "/products",
  handler(async (req, res) => {
    const slugs = queryString(req, "slugs")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    res.json(await platter.listPlatterProducts(slugs));
  }),
);

/** Admin platter management. Mounted at /api/admin/platter. */
export const adminPlatterRouter = Router();
adminPlatterRouter.use(requireAdmin);

adminPlatterRouter.get(
  "/eligible",
  handler(async (_req, res) => {
    res.json(await platter.listEligibleProducts());
  }),
);

adminPlatterRouter.put(
  "/",
  handler(async (req, res) => {
    res.json(await platter.saveConfig(req.body));
  }),
);
