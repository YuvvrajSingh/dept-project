import type { NextFunction, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { DEFAULT_JWT_EXPIRES_IN, SESSION_COOKIE_NAME } from "../constants/auth";
import { AppError } from "../utils/AppError";

export type JwtPayload = {
  sub: string;
  role: Role;
  teacherId?: string | null;
};

function jwtSecret(): string {
  const s = process.env.JWT_SECRET?.trim();
  if (!s) {
    throw new AppError(
      "Server is missing JWT_SECRET. Add it to time-table-backend/.env (same value as the Next app).",
      500,
      "CONFIG_ERROR",
    );
  }
  return s;
}

function readToken(req: Request): string | undefined {
  const fromCookie = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  if (fromCookie) {
    return fromCookie;
  }
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) {
    return h.slice(7).trim();
  }
  return undefined;
}

function verifyAndAttachUser(req: Request): { ok: true } | { status: number; code: string; message: string } {
  const token = readToken(req);
  if (!token) {
    return { status: 401, code: "UNAUTHORIZED", message: "Authentication required" };
  }
  try {
    const payload = jwt.verify(token, jwtSecret()) as JwtPayload;
    const id = payload.sub?.trim();
    if (!id) {
      return { status: 401, code: "UNAUTHORIZED", message: "Invalid session" };
    }
    req.user = {
      id,
      role: payload.role,
      teacherId: payload.teacherId ?? null,
    };
    return { ok: true };
  } catch {
    return { status: 401, code: "UNAUTHORIZED", message: "Invalid or expired session" };
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const result = verifyAndAttachUser(req);
  if (!("ok" in result)) {
    return res.status(result.status).json({ error: result.code, message: result.message });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const result = verifyAndAttachUser(req);
  if (!("ok" in result)) {
    return res.status(result.status).json({ error: result.code, message: result.message });
  }
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "FORBIDDEN", message: "Admin access required" });
  }
  next();
}

/**
 * Allows access only to the teacher who owns the record identified by `:id` (or `:teacherId`)
 * in the route params. The param name is resolved in order: `teacherId`, then `id`.
 */
export function requireTeacherSelf(req: Request, res: Response, next: NextFunction) {
  const result = verifyAndAttachUser(req);
  if (!("ok" in result)) {
    return res.status(result.status).json({ error: result.code, message: result.message });
  }
  if (req.user?.role !== "TEACHER") {
    return res.status(403).json({ error: "FORBIDDEN", message: "Teacher access required" });
  }
  const paramId = ((req.params.teacherId as string) ?? (req.params.id as string))?.trim();
  if (!paramId || req.user.teacherId !== paramId) {
    return res.status(403).json({ error: "FORBIDDEN", message: "You can only manage your own records" });
  }
  next();
}

/**
 * Allows access if the caller is an ADMIN, OR if the caller is the TEACHER who owns
 * the record (resolved via `:id` or `:teacherId` route param).
 */
export function requireAdminOrTeacherSelf(req: Request, res: Response, next: NextFunction) {
  const result = verifyAndAttachUser(req);
  if (!("ok" in result)) {
    return res.status(result.status).json({ error: result.code, message: result.message });
  }
  if (req.user?.role === "ADMIN") {
    return next();
  }
  if (req.user?.role === "TEACHER") {
    const paramId = ((req.params.teacherId as string) ?? (req.params.id as string))?.trim();
    if (paramId && req.user.teacherId === paramId) {
      return next();
    }
    return res.status(403).json({ error: "FORBIDDEN", message: "You can only manage your own records" });
  }
  return res.status(403).json({ error: "FORBIDDEN", message: "Access denied" });
}

export function signSessionToken(user: {
  id: string;
  role: Role;
  teacherId: string | null;
}): string {
  const expiresIn = process.env.JWT_EXPIRES_IN?.trim() || DEFAULT_JWT_EXPIRES_IN;
  const options = { expiresIn } as SignOptions;
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
      teacherId: user.teacherId,
    },
    jwtSecret(),
    options,
  );
}
