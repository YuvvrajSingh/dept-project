import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client";
import { SESSION_COOKIE_NAME } from "../constants/auth";
import { signSessionToken } from "../middleware/auth.middleware";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-to-a-long-random-string";
const COOKIE_NAME = SESSION_COOKIE_NAME;

// ── POST /auth/student-login ──────────────────────────────────────────────────
export async function studentLogin(req: Request, res: Response) {
  const { rollNumber, password } = req.body as {
    rollNumber: string;
    password: string;
  };

  if (!rollNumber || !password) {
    return res.status(400).json({ message: "Roll number and password are required." });
  }

  const student = await prisma.student.findUnique({
    where: { rollNumber: rollNumber.trim().toUpperCase() },
    include: {
      classSection: {
        include: {
          branch: true,
          academicYear: true,
        },
      },
    },
  });

  if (!student || !student.isActive) {
    return res.status(401).json({ message: "Invalid roll number or account not found." });
  }

  // Support existing plain empty hash (fresh account) — force reset via default password
  const hash = student.passwordHash;
  const isValid = hash ? await bcrypt.compare(password, hash) : false;

  if (!isValid) {
    return res.status(401).json({ message: "Incorrect password." });
  }

  const token = signSessionToken({
    id: student.id,
    role: "STUDENT",
    teacherId: null,
  });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    message: "Login successful",
    student: {
      id: student.id,
      rollNumber: student.rollNumber,
      name: student.name,
      email: student.email,
      photo: student.photo,
      batch: student.batch,
      classSection: {
        id: student.classSection.id,
        year: student.classSection.year,
        semester: student.classSection.semester,
        branch: student.classSection.branch.name,
        academicYear: student.classSection.academicYear.label,
      },
    },
  });
}

// ── GET /auth/student-me ──────────────────────────────────────────────────────
export async function studentMe(req: Request, res: Response) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Not authenticated." });

  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }

  const student = await prisma.student.findUnique({
    where: { id: payload.sub },
    include: {
      classSection: {
        include: { branch: true, academicYear: true },
      },
    },
  });

  if (!student || !student.isActive) {
    return res.status(401).json({ message: "Account not found or deactivated." });
  }

  return res.json({
    student: {
      id: student.id,
      rollNumber: student.rollNumber,
      name: student.name,
      email: student.email,
      photo: student.photo,
      batch: student.batch,
      classSection: {
        id: student.classSection.id,
        year: student.classSection.year,
        semester: student.classSection.semester,
        branch: student.classSection.branch.name,
        academicYear: student.classSection.academicYear.label,
      },
    },
  });
}

// ── POST /auth/student-logout ─────────────────────────────────────────────────
export async function studentLogout(_req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME);
  return res.json({ message: "Logged out." });
}

// ── POST /auth/student-change-password ───────────────────────────────────────
export async function studentChangePassword(req: Request, res: Response) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Not authenticated." });

  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Session expired." });
  }

  const { oldPassword, newPassword } = req.body as {
    oldPassword: string;
    newPassword: string;
  };

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Both old and new passwords are required." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }

  const student = await prisma.student.findUnique({ where: { id: payload.sub } });
  if (!student) return res.status(404).json({ message: "Student not found." });

  const isValid = await bcrypt.compare(oldPassword, student.passwordHash);
  if (!isValid) return res.status(401).json({ message: "Current password is incorrect." });

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.student.update({
    where: { id: student.id },
    data: { passwordHash: newHash },
  });

  return res.json({ message: "Password updated successfully." });
}
