import { prisma } from "../prisma/client";
import { AcademicYearStatus } from "@prisma/client";
import { AppError } from "../utils/AppError";

export const academicYearService = {
  async list() {
    return prisma.academicYear.findMany({
      orderBy: { startYear: "desc" },
      include: {
        _count: { select: { classSections: true } },
      },
    });
  },

  async getById(id: number) {
    const year = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        _count: { select: { classSections: true } },
      },
    });
    if (!year) {
      throw new AppError("Academic year not found", 404, "NOT_FOUND");
    }
    return year;
  },

  async getActive() {
    const year = await prisma.academicYear.findFirst({
      where: { isActive: true },
      include: {
        _count: { select: { classSections: true } },
      },
    });
    if (!year) {
      throw new AppError("No active academic year found", 404, "NOT_FOUND");
    }
    return year;
  },

  async create(data: { startYear: number; startDate?: string; endDate?: string }) {
    const endYear = data.startYear + 1;
    const label = `${data.startYear}-${endYear}`;

    const existing = await prisma.academicYear.findUnique({ where: { label } });
    if (existing) {
      throw new AppError(`Academic year ${label} already exists`, 409, "CONFLICT");
    }

    const startDate = data.startDate
      ? new Date(data.startDate)
      : new Date(`${data.startYear}-07-01`);
    const endDate = data.endDate
      ? new Date(data.endDate)
      : new Date(`${endYear}-06-30`);

    return prisma.academicYear.create({
      data: {
        label,
        startYear: data.startYear,
        endYear,
        startDate,
        endDate,
        status: AcademicYearStatus.DRAFT,
        isActive: false,
      },
    });
  },

  async update(id: number, data: { startDate?: string; endDate?: string }) {
    const year = await this.getById(id);
    if (year.status === AcademicYearStatus.ARCHIVED) {
      throw new AppError("Cannot modify an archived academic year", 403, "FORBIDDEN");
    }

    return prisma.academicYear.update({
      where: { id },
      data: {
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
      },
    });
  },

  async updateStatus(id: number, status: AcademicYearStatus) {
    const year = await this.getById(id);

    // Enforce lifecycle: DRAFT → ACTIVE → ARCHIVED
    const validTransitions: Record<AcademicYearStatus, AcademicYearStatus[]> = {
      DRAFT: [AcademicYearStatus.ACTIVE],
      ACTIVE: [AcademicYearStatus.ARCHIVED],
      ARCHIVED: [],
    };

    if (!validTransitions[year.status].includes(status)) {
      throw new AppError(
        `Cannot transition from ${year.status} to ${status}. Valid: ${validTransitions[year.status].join(", ") || "none"}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    return prisma.academicYear.update({
      where: { id },
      data: { status },
    });
  },

  async activate(id: number) {
    const year = await this.getById(id);
    if (year.status === AcademicYearStatus.ARCHIVED) {
      throw new AppError("Cannot activate an archived academic year", 400, "VALIDATION_ERROR");
    }

    // Transaction: deactivate all, activate target, set status to ACTIVE if DRAFT
    return prisma.$transaction(async (tx) => {
      await tx.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      return tx.academicYear.update({
        where: { id },
        data: {
          isActive: true,
          // If it's DRAFT, auto-promote to ACTIVE
          ...(year.status === AcademicYearStatus.DRAFT && { status: AcademicYearStatus.ACTIVE }),
        },
      });
    });
  },

  async clone(sourceId: number, targetId: number) {
    const source = await this.getById(sourceId);
    const target = await this.getById(targetId);

    if (target.status === AcademicYearStatus.ARCHIVED) {
      throw new AppError("Cannot clone into an archived academic year", 400, "VALIDATION_ERROR");
    }

    // Check if target already has data
    const existingCount = await prisma.classSection.count({
      where: { academicYearId: targetId },
    });
    if (existingCount > 0) {
      throw new AppError(
        "Target academic year already has class sections. Clear them first or choose an empty year.",
        409,
        "CONFLICT"
      );
    }

    return prisma.$transaction(async (tx) => {
      // 1. Fetch all source class sections with their subjects and timetable
      const sourceClasses = await tx.classSection.findMany({
        where: { academicYearId: sourceId },
        include: {
          subjects: true,
          timetable: {
            include: { labGroups: true },
          },
        },
      });

      const stats = { classSections: 0, classSubjects: 0, timetableEntries: 0, labGroupEntries: 0 };

      for (const srcClass of sourceClasses) {
        // 2. Create new ClassSection for target year
        const newClass = await tx.classSection.create({
          data: {
            academicYearId: targetId,
            branchId: srcClass.branchId,
            year: srcClass.year,
            semester: srcClass.semester,
          },
        });
        stats.classSections++;

        // 3. Clone ClassSubject assignments
        if (srcClass.subjects.length > 0) {
          await tx.classSubject.createMany({
            data: srcClass.subjects.map((cs) => ({
              classSectionId: newClass.id,
              subjectId: cs.subjectId,
            })),
          });
          stats.classSubjects += srcClass.subjects.length;
        }

        // 4. Clone TimetableEntries + LabGroupEntries
        for (const entry of srcClass.timetable) {
          const newEntry = await tx.timetableEntry.create({
            data: {
              classSectionId: newClass.id,
              day: entry.day,
              slotId: entry.slotId, // Slot rows are static config shared across academic years
              entryType: entry.entryType,
              subjectId: entry.subjectId,
              teacherId: entry.teacherId,
              roomId: entry.roomId,
            },
          });
          stats.timetableEntries++;

          // 5. Clone lab groups
          if (entry.labGroups.length > 0) {
            await tx.labGroupEntry.createMany({
              data: entry.labGroups.map((lg) => ({
                timetableEntryId: newEntry.id,
                groupName: lg.groupName,
                subjectId: lg.subjectId,
                labId: lg.labId,
                teacherId: lg.teacherId,
              })),
            });
            stats.labGroupEntries += entry.labGroups.length;
          }
        }
      }

      return {
        success: true,
        message: `Cloned ${source.label} → ${target.label}`,
        stats,
      };
    });
  },

  async remove(id: number) {
    const year = await this.getById(id);

    return prisma.$transaction(async (tx) => {
      // 1. Delete lab group entries for this year's class sections
      await tx.labGroupEntry.deleteMany({
        where: {
          timetableEntry: {
            classSection: { academicYearId: id },
          },
        },
      });
      // 2. Delete timetable entries
      await tx.timetableEntry.deleteMany({
        where: {
          classSection: { academicYearId: id },
        },
      });
      // 3. Delete class subjects
      await tx.classSubject.deleteMany({
        where: {
          classSection: { academicYearId: id },
        },
      });
      // 4. Delete class sections
      await tx.classSection.deleteMany({
        where: { academicYearId: id },
      });
      // 5. Delete the academic year
      await tx.academicYear.delete({ where: { id } });
    });
  },

  async removeAll() {
    return prisma.$transaction(async (tx) => {
      // 1. Delete lab group entries for all class sections tied to any academic year
      await tx.labGroupEntry.deleteMany({
        where: {
          timetableEntry: {
            classSection: { academicYearId: { not: undefined } },
          },
        },
      });
      // 2. Delete timetable entries
      await tx.timetableEntry.deleteMany({
        where: {
          classSection: { academicYearId: { not: undefined } },
        },
      });
      // 3. Delete class subjects
      await tx.classSubject.deleteMany({
        where: {
          classSection: { academicYearId: { not: undefined } },
        },
      });
      // 4. Delete class sections
      await tx.classSection.deleteMany({
        where: { academicYearId: { not: undefined } },
      });
      // 5. Delete all academic years
      const { count } = await tx.academicYear.deleteMany({});
      return { deleted: count };
    });
  },
};
