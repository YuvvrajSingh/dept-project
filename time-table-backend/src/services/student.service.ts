import { prisma } from "../prisma/client";
import { AppError } from "../utils/AppError";
import bcrypt from "bcryptjs";
import { StudentHistoryAction } from "@prisma/client";

const DEFAULT_PASSWORD = "password123";

export const studentService = {
  // ── List & Fetch ────────────────────────────────────────────────────────────

  async list(filters: { classSectionId?: string; search?: string; isActive?: boolean }) {
    return prisma.student.findMany({
      where: {
        ...(filters.classSectionId ? { classSectionId: filters.classSectionId } : {}),
        isActive: filters.isActive ?? true,
        ...(filters.search
          ? {
              OR: [
                { name: { contains: filters.search, mode: "insensitive" } },
                { rollNumber: { contains: filters.search.toUpperCase() } },
                { email: { contains: filters.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { classSection: { include: { branch: true, academicYear: true } } },
      orderBy: { rollNumber: "asc" },
    });
  },

  async getById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        classSection: { include: { branch: true, academicYear: true } },
        history: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!student) throw new AppError("Student not found", 404, "NOT_FOUND");
    return student;
  },

  async getByRollNumber(rollNumber: string) {
    const student = await prisma.student.findUnique({
      where: { rollNumber: rollNumber.toUpperCase() },
      include: { classSection: { include: { branch: true, academicYear: true } } },
    });
    if (!student) throw new AppError("Student not found", 404, "NOT_FOUND");
    return student;
  },

  // ── Create & Update ─────────────────────────────────────────────────────────

  async createStudent(data: {
    rollNumber: string;
    name: string;
    email?: string;
    classSectionId: string;
    batch?: string;
  }) {
    const cs = await prisma.classSection.findUnique({ where: { id: data.classSectionId } });
    if (!cs) throw new AppError("Class section not found", 404, "NOT_FOUND");

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const student = await prisma.student.create({
      data: {
        rollNumber: data.rollNumber.toUpperCase(),
        name: data.name,
        email: data.email,
        classSectionId: data.classSectionId,
        batch: data.batch,
        passwordHash,
      },
    });

    // Write initial enrollment history record
    await prisma.studentHistory.create({
      data: {
        studentId: student.id,
        toSectionId: data.classSectionId,
        action: StudentHistoryAction.INITIAL,
        note: "Initial enrollment",
      },
    });

    return student;
  },

  async updateStudent(
    id: string,
    data: { name?: string; email?: string; isActive?: boolean; classSectionId?: string; batch?: string }
  ) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError("Student not found", 404, "NOT_FOUND");
    return prisma.student.update({ where: { id }, data });
  },

  // ── Delete (Soft) ───────────────────────────────────────────────────────────

  async softDelete(id: string) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError("Student not found", 404, "NOT_FOUND");
    return prisma.student.update({ where: { id }, data: { isActive: false } });
  },

  // ── Promote / Demote ────────────────────────────────────────────────────────

  async bulkTransfer(params: {
    studentIds: string[];
    targetClassSectionId: string;
    action: StudentHistoryAction;
    note?: string;
    performedBy?: string;
  }) {
    const { studentIds, targetClassSectionId, action, note, performedBy } = params;

    const cs = await prisma.classSection.findUnique({ where: { id: targetClassSectionId } });
    if (!cs) throw new AppError("Target class section not found", 404, "NOT_FOUND");

    const results = await Promise.allSettled(
      studentIds.map(async (id) => {
        const student = await prisma.student.findUnique({ where: { id } });
        if (!student) throw new Error(`Student ${id} not found`);

        // Write history record
        await prisma.studentHistory.create({
          data: {
            studentId: id,
            fromSectionId: student.classSectionId,
            toSectionId: targetClassSectionId,
            action,
            note,
            performedBy,
          },
        });

        // Move student
        return prisma.student.update({
          where: { id },
          data: { classSectionId: targetClassSectionId },
        });
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason?.message);

    return { succeeded, failed };
  },

  // ── Bulk Import (CSV/Excel pre-parsed rows) ─────────────────────────────────

  async bulkImport(
    students: { rollNumber: string; name: string; email?: string; classSectionId: string; batch?: string }[],
    performedBy?: string
  ) {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    const results = await Promise.allSettled(
      students.map(async (s) => {
        const rn = s.rollNumber.toUpperCase();
        const existing = await prisma.student.findUnique({ where: { rollNumber: rn } });

        if (existing) {
          // Update metadata only — don't overwrite password
          return prisma.student.update({
            where: { rollNumber: rn },
            data: { name: s.name, email: s.email, classSectionId: s.classSectionId, batch: s.batch },
          });
        }

        const student = await prisma.student.create({
          data: {
            rollNumber: rn,
            name: s.name,
            email: s.email,
            classSectionId: s.classSectionId,
            batch: s.batch,
            passwordHash,
          },
        });

        await prisma.studentHistory.create({
          data: {
            studentId: student.id,
            toSectionId: s.classSectionId,
            action: StudentHistoryAction.INITIAL,
            note: "Bulk import",
            performedBy,
          },
        });

        return student;
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results
      .filter((r) => r.status === "rejected")
      .map((r, i) => ({
        rollNumber: students[i]?.rollNumber,
        reason: (r as PromiseRejectedResult).reason?.message,
      }));

    return { succeeded, failed };
  },

  // ── Legacy bulk upsert (seed script) ────────────────────────────────────────

  async bulkUpsert(
    students: { rollNumber: string; name: string; email?: string; classSectionId: string }[]
  ) {
    const results = await Promise.allSettled(
      students.map((s) =>
        prisma.student.upsert({
          where: { rollNumber: s.rollNumber.toUpperCase() },
          create: {
            rollNumber: s.rollNumber.toUpperCase(),
            name: s.name,
            email: s.email,
            classSectionId: s.classSectionId,
          },
          update: { name: s.name, email: s.email, classSectionId: s.classSectionId },
        })
      )
    );
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    return { succeeded, failed };
  },

  // ── Delete (hard) — kept for backwards compat with existing route ────────────

  async deleteStudent(id: string) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError("Student not found", 404, "NOT_FOUND");
    await prisma.student.delete({ where: { id } });
  },
};
