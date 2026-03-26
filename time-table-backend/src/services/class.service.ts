import { prisma } from "../prisma/client";
import { AppError } from "../utils/AppError";

const assertClassExists = async (id: number) => {
  const classSection = await prisma.classSection.findUnique({ where: { id } });
  if (!classSection) {
    throw new AppError("Class section not found", 404, "NOT_FOUND");
  }
};

export const classService = {
  listClassSections() {
    return prisma.classSection.findMany({
      include: { branch: true },
      orderBy: [{ branchId: "asc" }, { year: "asc" }],
    });
  },

  async getClassSectionById(id: number) {
    const classSection = await prisma.classSection.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!classSection) {
      throw new AppError("Class section not found", 404, "NOT_FOUND");
    }

    return classSection;
  },

  async createClassSection(data: { branchId: number; year: 2 | 3 | 4 }) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) {
      throw new AppError("Branch not found", 404, "NOT_FOUND");
    }

    const existing = await prisma.classSection.findUnique({
      where: {
        branchId_year: {
          branchId: data.branchId,
          year: data.year,
        },
      },
    });

    if (existing) {
      throw new AppError("Class section already exists for this branch and year", 409, "CONFLICT");
    }

    return prisma.classSection.create({
      data,
      include: { branch: true },
    });
  },

  async updateClassSection(id: number, data: Partial<{ branchId: number; year: 2 | 3 | 4 }>) {
    await assertClassExists(id);

    if (data.branchId !== undefined) {
      const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
      if (!branch) {
        throw new AppError("Branch not found", 404, "NOT_FOUND");
      }
    }

    if (data.branchId !== undefined || data.year !== undefined) {
      const current = await prisma.classSection.findUnique({ where: { id } });
      if (!current) {
        throw new AppError("Class section not found", 404, "NOT_FOUND");
      }

      const branchId = data.branchId ?? current.branchId;
      const year = data.year ?? (current.year as 2 | 3 | 4);

      const duplicate = await prisma.classSection.findFirst({
        where: {
          branchId,
          year,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new AppError("Class section already exists for this branch and year", 409, "CONFLICT");
      }
    }

    return prisma.classSection.update({
      where: { id },
      data,
      include: { branch: true },
    });
  },

  async deleteClassSection(id: number) {
    await assertClassExists(id);
    await prisma.classSection.delete({ where: { id } });
  },

  async assignSubject(classSectionId: number, subjectId: number) {
    await assertClassExists(classSectionId);

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      throw new AppError("Subject not found", 404, "NOT_FOUND");
    }

    const existing = await prisma.classSubject.findUnique({
      where: { classSectionId_subjectId: { classSectionId, subjectId } },
    });

    if (existing) {
      throw new AppError("Subject already assigned to class", 409, "CONFLICT");
    }

    return prisma.classSubject.create({
      data: {
        classSectionId,
        subjectId,
      },
    });
  },

  async removeSubject(classSectionId: number, subjectId: number) {
    await assertClassExists(classSectionId);

    const existing = await prisma.classSubject.findUnique({
      where: { classSectionId_subjectId: { classSectionId, subjectId } },
    });

    if (!existing) {
      throw new AppError("Class-subject assignment not found", 404, "NOT_FOUND");
    }

    await prisma.classSubject.delete({ where: { id: existing.id } });
  },

  async getClassSubjects(classSectionId: number) {
    await assertClassExists(classSectionId);

    return prisma.classSubject.findMany({
      where: { classSectionId },
      include: {
        subject: true,
      },
      orderBy: {
        id: "asc",
      },
    });
  },
};
