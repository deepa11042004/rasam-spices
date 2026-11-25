import { Router } from "express";
import { handler, queryString } from "@/lib/async-handler";
import { requireAdmin } from "@/middleware/auth";
import * as dashboard from "./dashboard.service";

/** Admin dashboard aggregates. Mounted at /api/admin/dashboard. */
export const adminDashboardRouter = Router();
adminDashboardRouter.use(requireAdmin);

adminDashboardRouter.get(
  "/categories",
  handler(async (_req, res) => {
    res.json(await dashboard.getCategoryGroups());
  }),
);

adminDashboardRouter.get(
  "/inventory",
  handler(async (_req, res) => {
    res.json(await dashboard.getInventory());
  }),
);

/** GET /api/admin/dashboard/enquiries?since=<ISO date> (omit for all time) */
adminDashboardRouter.get(
  "/enquiries",
  handler(async (req, res) => {
    const raw = queryString(req, "since");
    const since = raw ? new Date(raw) : null;
    res.json(await dashboard.getEnquiryStatusGroups(since && !Number.isNaN(since.getTime()) ? since : null));
  }),
);

/** GET /api/admin/dashboard/received?since=<ISO date> -> ISO timestamps */
adminDashboardRouter.get(
  "/received",
  handler(async (req, res) => {
    const since = new Date(queryString(req, "since"));
    if (Number.isNaN(since.getTime())) {
      res.status(400).json({ ok: false, message: "since must be a valid date" });
      return;
    }
    res.json(await dashboard.getReceivedTimestamps(since));
  }),
);

adminDashboardRouter.get(
  "/recent",
  handler(async (_req, res) => {
    res.json(await dashboard.getRecentActivity());
  }),
);
