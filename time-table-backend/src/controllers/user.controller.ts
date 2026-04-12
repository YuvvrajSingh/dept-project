import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { userService } from "../services/user.service";

export const userController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as {
        email: string;
        password: string;
        role: Role;
        teacherId?: number;
      };
      const user = await userService.createUser(body);
      res.status(201).json({
        id: user.id,
        email: user.email,
        role: user.role,
        teacherId: user.teacherId,
      });
    } catch (error) {
      next(error);
    }
  },
};
