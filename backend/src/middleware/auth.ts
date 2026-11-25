import type { NextFunction, Request, Response } from "express";
import { getAdminByToken, type SafeAdmin } from "@/modules/auth/auth.service";

declare module "express-serve-static-core" {
  interface Request {
    admin?: SafeAdmin;
  }
}

export function bearerToken(req: Request): string {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

/** Rejects the request with 401 unless it carries a valid admin session token. */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = await getAdminByToken(bearerToken(req));
    if (!admin) {
      res.status(401).json({ ok: false, message: "Unauthorized" });
      return;
    }
    req.admin = admin;
    next();
  } catch (err) {
    next(err);
  }
}
