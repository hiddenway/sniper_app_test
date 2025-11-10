import { Request, Response, NextFunction } from "express";
import config from "../config";

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers["x-api-key"] || req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "Missing API key" });
  }

  const raw = typeof header === "string" ? header : String(header);

  const token = raw.startsWith("Bearer ") ? raw.slice("Bearer ".length) : raw;

  if (token !== config.apiKeyAuth) {
    return res.status(401).json({ message: "Invalid API key" });
  }

  return next();
}
