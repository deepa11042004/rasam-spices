import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { env } from "@/config/env";
import { authRouter } from "@/modules/auth/auth.routes";
import { adminDashboardRouter } from "@/modules/dashboard/dashboard.routes";
import { adminEnquiriesRouter, publicEnquiriesRouter } from "@/modules/enquiries/enquiries.routes";
import { adminPlatterRouter, publicPlatterRouter } from "@/modules/platter/platter.routes";
import { adminProductsRouter, publicProductsRouter } from "@/modules/products/products.routes";
import { adminSettingsRouter, publicSettingsRouter } from "@/modules/settings/settings.routes";
import { adminUploadsRouter, mediaRouter } from "@/modules/uploads/uploads.routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.corsOrigins }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Public API
  app.use("/api/auth", authRouter);
  app.use("/api/products", publicProductsRouter);
  app.use("/api/platter", publicPlatterRouter);
  app.use("/api/settings", publicSettingsRouter);
  app.use("/api/enquiries", publicEnquiriesRouter);
  app.use("/media", mediaRouter);

  // Admin API (every router requires a valid admin session token)
  app.use("/api/admin/products", adminProductsRouter);
  app.use("/api/admin/platter", adminPlatterRouter);
  app.use("/api/admin/settings", adminSettingsRouter);
  app.use("/api/admin/enquiries", adminEnquiriesRouter);
  app.use("/api/admin/dashboard", adminDashboardRouter);
  app.use("/api/admin/uploads", adminUploadsRouter);

  app.use((_req, res) => {
    res.status(404).json({ ok: false, message: "Not found" });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[api]", err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  });

  return app;
}
