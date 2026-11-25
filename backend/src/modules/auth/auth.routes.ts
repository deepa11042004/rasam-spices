import { Router } from "express";
import { handler } from "@/lib/async-handler";
import { bearerToken } from "@/middleware/auth";
import { getAdminByToken, login, logout } from "./auth.service";

export const authRouter = Router();

/** POST /api/auth/login  { username, password } -> { ok, token, expiresAt } */
authRouter.post(
  "/login",
  handler(async (req, res) => {
    const result = await login(req.body?.username, req.body?.password);
    if (!result) {
      res.status(401).json({ ok: false, message: "Invalid credentials" });
      return;
    }
    res.json({ ok: true, token: result.token, expiresAt: result.expiresAt });
  }),
);

/** POST /api/auth/logout  (Bearer) */
authRouter.post(
  "/logout",
  handler(async (req, res) => {
    await logout(bearerToken(req));
    res.json({ ok: true });
  }),
);

/** GET /api/auth/me  (Bearer) -> { ok, admin } */
authRouter.get(
  "/me",
  handler(async (req, res) => {
    const admin = await getAdminByToken(bearerToken(req));
    if (!admin) {
      res.status(401).json({ ok: false, message: "Unauthorized" });
      return;
    }
    res.json({ ok: true, admin });
  }),
);
