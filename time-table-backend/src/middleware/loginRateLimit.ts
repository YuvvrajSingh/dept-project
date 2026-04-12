import type { NextFunction, Request, Response } from "express";

const attempts = new Map<string, number[]>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

export function loginRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const prev = (attempts.get(ip) ?? []).filter((t) => t > windowStart);
  if (prev.length >= MAX_PER_WINDOW) {
    return res.status(429).json({
      error: "TOO_MANY_REQUESTS",
      message: "Too many login attempts; try again shortly",
    });
  }
  prev.push(now);
  attempts.set(ip, prev);
  next();
}
