import bcrypt from "bcryptjs";
import { prisma } from "../prisma/client";
import { AppError } from "../utils/AppError";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const authService = {
  async validateCredentials(email: string, password: string) {
    const normalized = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalized },
      include: { teacher: true },
    });

    const invalid = new AppError("Invalid email or password", 401, "UNAUTHORIZED");

    if (!user) {
      throw invalid;
    }
    if (!user.isActive) {
      throw invalid;
    }
    if (user.role === "TEACHER") {
      if (!user.teacherId || !user.teacher) {
        throw invalid;
      }
      if (!user.teacher.isActive) {
        throw invalid;
      }
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw invalid;
    }

    return user;
  },
};
