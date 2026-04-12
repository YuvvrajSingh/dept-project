import type { NextFunction, Request, Response } from "express";
import { SESSION_COOKIE_NAME } from "../constants/auth";
import { signSessionToken } from "../middleware/auth.middleware";
import { prisma } from "../prisma/client";
import { authService } from "../services/auth.service";
import { sessionCookieMaxAgeMs } from "../utils/authCookie";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "email and password are required",
        });
      }

      const user = await authService.validateCredentials(email, password);
      const token = signSessionToken({
        id: user.id,
        role: user.role,
        teacherId: user.teacherId,
      });

      res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: sessionCookieMaxAgeMs(),
        path: "/",
      });

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          teacherId: user.teacherId,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  logout(_req: Request, res: Response) {
    res.clearCookie(SESSION_COOKIE_NAME, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(204).send();
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.user!.id;
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          teacherId: true,
          isActive: true,
        },
      });
      if (!user || !user.isActive) {
        return res.status(401).json({
          error: "UNAUTHORIZED",
          message: "Session is no longer valid",
        });
      }
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  },
};
