import { prisma } from "../prisma/client";
import { AppError } from "../utils/AppError";

const assertSubjectExists = async (id: number) => {
  const subject = await prisma.subject.findUnique({ where: { id } });
  if (!subject) {
    throw new AppError("Subject not found", 404, "NOT_FOUND");
  }
};

export const subjectService = {
  listSubjects(includeInactive = false) {
    return prisma.subject.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: "asc" },
    });
  },

  async getSubjectById(id: number) {
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) {
      throw new AppError("Subject not found", 404, "NOT_FOUND");
    }

    return subject;
  },

  createSubject(data: {
    code: string;
    name: string;
    abbreviation: string;
    type: "THEORY" | "LAB";
    creditHours: number;
  }) {
    return prisma.subject.create({ data });
  },

  async updateSubject(
    id: number,
    data: Partial<{ code: string; name: string; abbreviation: string; type: "THEORY" | "LAB"; creditHours: number }>,
  ) {
    await assertSubjectExists(id);
    return prisma.subject.update({ where: { id }, data });
  },

  async deleteSubject(id: number) {
    await assertSubjectExists(id);
    // Hard delete is blocked (Restrict) if subject is referenced in TimetableEntry or LabGroupEntry.
    // Use deactivateSubject for safe archival instead.
    await prisma.subject.delete({ where: { id } });
  },

  async deactivateSubject(id: number) {
    await assertSubjectExists(id);
    return prisma.subject.update({ where: { id }, data: { isActive: false } });
  },

  async reactivateSubject(id: number) {
    await assertSubjectExists(id);
    return prisma.subject.update({ where: { id }, data: { isActive: true } });
  },
};
