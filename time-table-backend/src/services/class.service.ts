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

  async createClassSection(data: { branchName: string; year: 2 | 3 | 4; semester: number }) {
    const branch = await prisma.branch.upsert({
      where: { name: data.branchName },
      update: {},
      create: { name: data.branchName },
    });

    const existing = await prisma.classSection.findUnique({
      where: {
        branchId_year_semester: {
          branchId: branch.id,
          year: data.year,
          semester: data.semester,
        },
      },
    });

    if (existing) {
      throw new AppError("Class section already exists for this branch, year, and semester", 409, "CONFLICT");
    }

    return prisma.classSection.create({
      data: {
        branchId: branch.id,
        year: data.year,
        semester: data.semester,
      },
      include: { branch: true },
    });
  },

  async updateClassSection(id: number, data: Partial<{ branchName: string; year: 2 | 3 | 4; semester: number }>) {
    await assertClassExists(id);

    let updatedBranchId: number | undefined;
    if (data.branchName !== undefined) {
      const branch = await prisma.branch.upsert({
        where: { name: data.branchName },
        update: {},
        create: { name: data.branchName },
      });
      updatedBranchId = branch.id;
    }

    if (updatedBranchId !== undefined || data.year !== undefined || data.semester !== undefined) {
      const current = await prisma.classSection.findUnique({ where: { id } });
      if (!current) {
        throw new AppError("Class section not found", 404, "NOT_FOUND");
      }

      const branchId = updatedBranchId ?? current.branchId;
      const year = data.year ?? (current.year as 2 | 3 | 4);
      const semester = data.semester ?? current.semester;

      const duplicate = await prisma.classSection.findFirst({
        where: {
          branchId,
          year,
          semester,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new AppError("Class section already exists for this branch, year, and semester", 409, "CONFLICT");
      }
    }

    return prisma.classSection.update({
      where: { id },
      data: {
        ...(updatedBranchId !== undefined && { branchId: updatedBranchId }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.semester !== undefined && { semester: data.semester }),
      },
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
