import { Router } from "express";
import { handler, param, queryString } from "@/lib/async-handler";
import { requireAdmin } from "@/middleware/auth";
import * as settings from "./settings.service";

/** Public settings. Mounted at /api/settings. */
export const publicSettingsRouter = Router();

/** GET /api/settings/company -> company settings row, or null */
publicSettingsRouter.get(
  "/company",
  handler(async (_req, res) => {
    res.json(await settings.getCompanySettings());
  }),
);

publicSettingsRouter.get(
  "/social-links",
  handler(async (_req, res) => {
    res.json(await settings.listPublicSocialLinks());
  }),
);

/** GET /api/settings/content?keys=a,b -> [{ key, content, ... }] */
publicSettingsRouter.get(
  "/content",
  handler(async (req, res) => {
    const keys = queryString(req, "keys")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    res.json(keys.length ? await settings.listSiteContent(keys) : []);
  }),
);

/** Admin settings management. Mounted at /api/admin/settings. */
export const adminSettingsRouter = Router();
adminSettingsRouter.use(requireAdmin);

/** GET /api/admin/settings -> { settings, socialLinks, siteContent } */
adminSettingsRouter.get(
  "/",
  handler(async (_req, res) => {
    const [company, socialLinks, siteContent] = await Promise.all([
      settings.getCompanySettings(),
      settings.listAllSocialLinks(),
      settings.listSiteContent(),
    ]);
    res.json({ settings: company, socialLinks, siteContent });
  }),
);

adminSettingsRouter.put(
  "/company",
  handler(async (req, res) => {
    res.json(await settings.updateCompanySettings(req.body));
  }),
);

/** PUT /api/admin/settings/content  { items: [{ key, title?, content }] } */
adminSettingsRouter.put(
  "/content",
  handler(async (req, res) => {
    res.json(await settings.upsertManySiteContent(req.body?.items));
  }),
);

adminSettingsRouter.put(
  "/social-links",
  handler(async (req, res) => {
    res.json(await settings.upsertSocialLink(req.body));
  }),
);

adminSettingsRouter.delete(
  "/social-links/:id",
  handler(async (req, res) => {
    res.json(await settings.deleteSocialLink(param(req, "id")));
  }),
);
