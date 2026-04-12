import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { Role } from "@prisma/client";
import { prisma } from "../prisma/client";
import { AppError } from "../utils/AppError";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type CreateUserInput = {
  email: string;
  password: string;
  role: Role;
  teacherId?: number;
};

export const userService = {
  async createUser(input: CreateUserInput) {
    const email = normalizeEmail(input.email);

    if (input.role === "TEACHER" && (input.teacherId === undefined || input.teacherId === null)) {
      throw new AppError("Teacher accounts require teacherId", 400, "VALIDATION_ERROR");
    }
    if (input.role === "ADMIN" && input.teacherId != null) {
      throw new AppError("Admin accounts must not have teacherId", 400, "VALIDATION_ERROR");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("An account with this email already exists", 409, "CONFLICT");
    }

    if (input.role === "TEACHER") {
      const teacherId = input.teacherId as number;
      const linked = await prisma.user.findUnique({ where: { teacherId } });
      if (linked) {
        throw new AppError("This teacher already has a login account", 409, "CONFLICT");
      }

      const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
      if (!teacher) {
        throw new AppError("Teacher not found", 404, "NOT_FOUND");
      }

      const tEmail = teacher.email?.trim().toLowerCase() ?? null;
      if (tEmail !== null && tEmail !== email) {
        throw new AppError(
          "Email must match the teacher's academic email on file",
          400,
          "VALIDATION_ERROR",
        );
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      return prisma.$transaction(async (tx) => {
        if (tEmail === null) {
          await tx.teacher.update({
            where: { id: teacherId },
            data: { email },
          });
        }

        const data: Prisma.UserCreateInput = {
          email,
          passwordHash,
          role: Role.TEACHER,
          teacher: { connect: { id: teacherId } },
        };
        return tx.user.create({ data });
      });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.ADMIN,
      },
    });
  },
};
