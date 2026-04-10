import { prisma } from "../prisma/client";
import { AcademicYearStatus } from "@prisma/client";
import { AppError } from "../utils/AppError";

const assertClassExists = async (id: number) => {
  const classSection = await prisma.classSection.findUnique({
    where: { id },
    include: { academicYear: true },
  });
  if (!classSection) {
    throw new AppError("Class section not found", 404, "NOT_FOUND");
  }
  return classSection;
};

const assertNotArchived = async (academicYearId: number) => {
  const year = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
  if (!year) {
    throw new AppError("Academic year not found", 404, "NOT_FOUND");
  }
  if (year.status === AcademicYearStatus.ARCHIVED) {
    throw new AppError("Cannot modify data in an archived academic year", 403, "FORBIDDEN");
  }
  return year;
};

export const classService = {
  listClassSections(academicYearId?: number) {
    return prisma.classSection.findMany({
      where: academicYearId ? { academicYearId } : undefined,
      include: { branch: true, academicYear: true },
      orderBy: [{ branchId: "asc" }, { year: "asc" }],
    });
  },

  async getClassSectionById(id: number) {
    const classSection = await prisma.classSection.findUnique({
      where: { id },
      include: { branch: true, academicYear: true },
    });

    if (!classSection) {
      throw new AppError("Class section not found", 404, "NOT_FOUND");
    }

    return classSection;
  },

  async createClassSection(data: { branchName: string; year: 2 | 3 | 4; semester: number; academicYearId: number }) {
    await assertNotArchived(data.academicYearId);

    const branch = await prisma.branch.upsert({
      where: { name: data.branchName },
      update: {},
      create: { name: data.branchName },
    });

    const existing = await prisma.classSection.findUnique({
      where: {
        academicYearId_branchId_year_semester: {
          academicYearId: data.academicYearId,
          branchId: branch.id,
          year: data.year,
          semester: data.semester,
        },
      },
    });

    if (existing) {
      throw new AppError("Class section already exists for this branch, year, and semester in this academic year", 409, "CONFLICT");
    }

    return prisma.classSection.create({
      data: {
        academicYearId: data.academicYearId,
        branchId: branch.id,
        year: data.year,
        semester: data.semester,
      },
      include: { branch: true, academicYear: true },
    });
  },

  async updateClassSection(id: number, data: Partial<{ branchName: string; year: 2 | 3 | 4; semester: number }>) {
    const classSection = await assertClassExists(id);
    await assertNotArchived(classSection.academicYearId);

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
          academicYearId: current.academicYearId,
          branchId,
          year,
          semester,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new AppError("Class section already exists for this branch, year, and semester in this academic year", 409, "CONFLICT");
      }
    }

    return prisma.classSection.update({
      where: { id },
      data: {
        ...(updatedBranchId !== undefined && { branchId: updatedBranchId }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.semester !== undefined && { semester: data.semester }),
      },
      include: { branch: true, academicYear: true },
    });
  },

  async deleteClassSection(id: number) {
    const classSection = await assertClassExists(id);
    await assertNotArchived(classSection.academicYearId);
    await prisma.classSection.delete({ where: { id } });
  },

  async assignSubject(classSectionId: number, subjectId: number) {
    const classSection = await assertClassExists(classSectionId);
    await assertNotArchived(classSection.academicYearId);

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
    const classSection = await assertClassExists(classSectionId);
    await assertNotArchived(classSection.academicYearId);

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
