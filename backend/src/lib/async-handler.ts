import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Forward rejected promises to the Express error handler. */
export function handler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/** Express 5 types route params as string | string[]; only single values are used here. */
export function param(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export function queryString(req: Request, name: string): string {
  const v = req.query[name];
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" ? s : "";
}
