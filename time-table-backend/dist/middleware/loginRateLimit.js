"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRateLimit = loginRateLimit;
const attempts = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
function loginRateLimit(req, res, next) {
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
