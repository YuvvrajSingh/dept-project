import type { Prisma, PrismaClient } from "@prisma/client";
import { EntryType } from "@prisma/client";
import { prisma } from "../prisma/client";
import { AppError } from "../utils/AppError";
import { buildMatrix } from "../utils/timetableMatrix";
import { DAY_LABELS, LAB_GROUPS, SLOT_TIMES } from "../utils/timetableConstants";
import { emailService } from "./email.service";

type DbClient = PrismaClient | Prisma.TransactionClient;

type TheoryEntryInput = {
  classSectionId: number;
  day: number;
  slotStart: number;
  slotEnd?: number;
  entryType?: EntryType;
  subjectId: number;
  teacherId: number;
  roomId: number;
};

type LabGroupInput = {
  groupName: string;
  subjectId: number;
  labId: number;
  teacherId: number;
};

type LabEntryInput = {
  classSectionId: number;
  day: number;
  slotStart: number;
  slotEnd?: number;
  entryType?: EntryType;
  labGroups: LabGroupInput[];
};

const assertDay = (day: number) => {
  if (!Number.isInteger(day) || day < 1 || day > 6) {
    throw new AppError("Day must be between 1 and 6", 400, "VALIDATION_ERROR");
  }
};

const assertClassAndSubjectPrereq = async (
  db: DbClient,
  classSectionId: number,
  subjectId: number,
): Promise<void> => {
  const classSection = await db.classSection.findUnique({ where: { id: classSectionId } });
  if (!classSection) {
    throw new AppError("Class section not found", 404, "NOT_FOUND");
  }

  const subject = await db.subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    throw new AppError("Subject not found", 404, "NOT_FOUND");
  }

  const classSubject = await db.classSubject.findUnique({
    where: {
      classSectionId_subjectId: {
        classSectionId,
        subjectId,
      },
    },
  });

  if (!classSubject) {
    throw new AppError("Subject is not assigned to this class section", 422, "BUSINESS_RULE_VIOLATION");
  }
};

const assertTeacherSubjectPrereq = async (
  db: DbClient,
  teacherId: number,
  subjectId: number,
): Promise<void> => {
  const teacher = await db.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) {
    throw new AppError("Teacher not found", 404, "NOT_FOUND");
  }

  const teacherSubject = await db.teacherSubject.findUnique({
    where: {
      teacherId_subjectId: {
        teacherId,
        subjectId,
      },
    },
  });

  if (!teacherSubject) {
    throw new AppError("Teacher is not assigned to this subject", 422, "BUSINESS_RULE_VIOLATION");
  }
};

const validateTheoryShape = (data: TheoryEntryInput) => {
  assertDay(data.day);

  if (!Number.isInteger(data.slotStart) || data.slotStart < 1 || data.slotStart > 6) {
    throw new AppError("slotStart must be between 1 and 6", 400, "VALIDATION_ERROR");
  }

  const slotEnd = data.slotEnd ?? data.slotStart;
  if (slotEnd !== data.slotStart) {
    throw new AppError("For THEORY entries, slotEnd must equal slotStart", 400, "VALIDATION_ERROR");
  }
};

const validateLabShape = (data: LabEntryInput) => {
  assertDay(data.day);

  if (!Number.isInteger(data.slotStart) || data.slotStart < 1 || data.slotStart > 6) {
    throw new AppError("slotStart must be between 1 and 6", 400, "VALIDATION_ERROR");
  }

  const slotEnd = data.slotEnd ?? data.slotStart;
  if (slotEnd !== data.slotStart) {
    throw new AppError("For LAB entries, slotEnd must equal slotStart", 400, "VALIDATION_ERROR");
  }

  if (data.labGroups.length < 1 || data.labGroups.length > 3) {
    throw new AppError("LAB entries must include 1 to 3 groups from A1, A2, A3", 400, "VALIDATION_ERROR");
  }

  const groupNames = data.labGroups.map((group) => group.groupName);
  const uniqueNames = new Set(groupNames);
  const required = new Set(LAB_GROUPS);

  if (uniqueNames.size !== groupNames.length || groupNames.some((name) => !required.has(name as (typeof LAB_GROUPS)[number]))) {
    throw new AppError("LAB group names must be unique and chosen from A1, A2, A3", 400, "VALIDATION_ERROR");
  }
};

const formatClassLabel = (
  classSection?: {
    year: number;
    branch?: { name: string } | null;
  } | null,
) => {
  if (!classSection) {
    return "Unknown class";
  }

  const branchName = classSection.branch?.name ?? "Unknown";
  return `${branchName} Year ${classSection.year}`;
};

const createTheory = async (db: DbClient, data: TheoryEntryInput) => {
  validateTheoryShape(data);
  await assertClassAndSubjectPrereq(db, data.classSectionId, data.subjectId);
  await assertTeacherSubjectPrereq(db, data.teacherId, data.subjectId);

  const room = await db.room.findUnique({ where: { id: data.roomId } });
  if (!room) {
    throw new AppError("Room not found", 404, "NOT_FOUND");
  }

  const classConflict = await db.timetableEntry.findFirst({
    where: {
      classSectionId: data.classSectionId,
      day: data.day,
      slotStart: data.slotStart,
    },
  });

  if (classConflict) {
    throw new AppError("Class section already has an entry at this slot", 409, "CONFLICT");
  }

  const teacherConflict = await db.timetableEntry.findFirst({
    where: {
      teacherId: data.teacherId,
      day: data.day,
      slotStart: data.slotStart,
    },
    include: {
      teacher: true,
      classSection: {
        include: {
          branch: true,
        },
      },
    },
  });

  if (teacherConflict?.teacher) {
    throw new AppError(
      `Teacher ${teacherConflict.teacher.abbreviation} is already scheduled on ${DAY_LABELS[data.day as keyof typeof DAY_LABELS]} slot ${data.slotStart} for ${formatClassLabel(teacherConflict.classSection)}`,
      409,
      "CONFLICT",
    );
  }

  const roomConflict = await db.timetableEntry.findFirst({
    where: {
      roomId: data.roomId,
      day: data.day,
      slotStart: data.slotStart,
    },
    include: { room: true },
  });

  if (roomConflict?.room) {
    throw new AppError(
      `Room ${roomConflict.room.name} is already booked on ${DAY_LABELS[data.day as keyof typeof DAY_LABELS]} slot ${data.slotStart}`,
      409,
      "CONFLICT",
    );
  }

  return db.timetableEntry.create({
    data: {
      classSectionId: data.classSectionId,
      day: data.day,
      slotStart: data.slotStart,
      slotEnd: data.slotStart,
      entryType: EntryType.THEORY,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      roomId: data.roomId,
    },
    include: {
      subject: true,
      teacher: true,
      room: true,
    },
  });
};

const createLab = async (db: DbClient, data: LabEntryInput) => {
  validateLabShape(data);

  for (const group of data.labGroups) {
    await assertClassAndSubjectPrereq(db, data.classSectionId, group.subjectId);
    await assertTeacherSubjectPrereq(db, group.teacherId, group.subjectId);

    const lab = await db.lab.findUnique({ where: { id: group.labId } });
    if (!lab) {
      throw new AppError(`Lab ${group.labId} not found`, 404, "NOT_FOUND");
    }
  }

  const classConflict = await db.timetableEntry.findFirst({
    where: {
      classSectionId: data.classSectionId,
      day: data.day,
      slotStart: data.slotStart,
    },
  });

  if (classConflict) {
    throw new AppError("Class section already has an entry at this slot", 409, "CONFLICT");
  }

  for (const group of data.labGroups) {
    const teacher = await db.teacher.findUnique({ where: { id: group.teacherId } });
    const lab = await db.lab.findUnique({ where: { id: group.labId } });

    const theoryTeacherConflict = await db.timetableEntry.findFirst({
      where: {
        teacherId: group.teacherId,
        day: data.day,
        slotStart: data.slotStart,
      },
      include: {
        classSection: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (theoryTeacherConflict && teacher) {
      throw new AppError(
        `Teacher ${teacher.abbreviation} is already scheduled on ${DAY_LABELS[data.day as keyof typeof DAY_LABELS]} slot ${data.slotStart} for ${formatClassLabel(theoryTeacherConflict.classSection)}`,
        409,
        "CONFLICT",
      );
    }

    const labTeacherConflict = await db.labGroupEntry.findFirst({
      where: {
        teacherId: group.teacherId,
        timetableEntry: {
          day: data.day,
          slotStart: data.slotStart,
        },
      },
      include: {
        timetableEntry: {
          include: {
            classSection: {
              include: {
                branch: true,
              },
            },
          },
        },
      },
    });

    if (labTeacherConflict && teacher) {
      throw new AppError(
        `Teacher ${teacher.abbreviation} already has a lab on ${DAY_LABELS[data.day as keyof typeof DAY_LABELS]} slot ${data.slotStart} for ${formatClassLabel(labTeacherConflict.timetableEntry.classSection)}`,
        409,
        "CONFLICT",
      );
    }

    const labConflict = await db.labGroupEntry.findFirst({
      where: {
        labId: group.labId,
        timetableEntry: {
          day: data.day,
          slotStart: data.slotStart,
        },
      },
      include: {
        timetableEntry: {
          include: {
            classSection: {
              include: {
                branch: true,
              },
            },
          },
        },
      },
    });

    if (labConflict && lab) {
      throw new AppError(
        `Lab ${lab.name} is already booked on ${DAY_LABELS[data.day as keyof typeof DAY_LABELS]} slot ${data.slotStart} for ${formatClassLabel(labConflict.timetableEntry.classSection)}`,
        409,
        "CONFLICT",
      );
    }
  }

  return db.timetableEntry.create({
    data: {
      classSectionId: data.classSectionId,
      day: data.day,
      slotStart: data.slotStart,
      slotEnd: data.slotStart,
      entryType: EntryType.LAB,
      subjectId: null,
      labGroups: {
        create: data.labGroups.map((group) => ({
          groupName: group.groupName,
          subjectId: group.subjectId,
          labId: group.labId,
          teacherId: group.teacherId,
        })),
      },
    },
    include: {
      labGroups: {
        include: {
          subject: true,
          lab: true,
          teacher: true,
        },
      },
    },
  });
};

export const timetableService = {
  async handleCancellationAlert(existing: any) {
    const now = new Date();
    const currentDay = now.getDay();
    if (existing.day !== currentDay) return;

    const slotStr = SLOT_TIMES[existing.slotStart as keyof typeof SLOT_TIMES].start;
    const [slotH, slotM] = slotStr.split(':').map(Number);
    const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slotH, slotM);

    if (now < slotDate) {
      if (existing.entryType === 'THEORY' && existing.teacher?.email) {
        await emailService.sendClassReminder({
          teacherEmail: existing.teacher.email,
          teacherName: existing.teacher.name,
          className: `${existing.classSection.branch.name} - Y${existing.classSection.year}`,
          subjectName: existing.subject?.name || 'Subject',
          roomName: existing.room?.name || 'Room',
          timeLabel: slotStr,
          isCancellation: true
        });
      } else if (existing.entryType === 'LAB') {
        for (const lg of existing.labGroups) {
          if (lg.teacher?.email) {
            await emailService.sendClassReminder({
              teacherEmail: lg.teacher.email,
              teacherName: lg.teacher.name,
              className: `${existing.classSection.branch.name} - Y${existing.classSection.year} (${lg.groupName})`,
              subjectName: lg.subject?.name || 'Lab',
              roomName: lg.lab.name,
              timeLabel: slotStr,
              isCancellation: true
            });
          }
        }
      }
    }
  },

  validateAndCreateTheoryEntry(data: TheoryEntryInput) {
    return createTheory(prisma, data);
  },

  validateAndCreateLabEntry(data: LabEntryInput) {
    return prisma.$transaction((tx) => createLab(tx, data));
  },

  async deleteEntry(id: number) {
    const existing = await prisma.timetableEntry.findUnique({ 
      where: { id },
      include: {
        teacher: true,
        subject: true,
        room: true,
        classSection: { include: { branch: true } },
        labGroups: { include: { teacher: true, subject: true, lab: true } }
      }
    });

    if (!existing) {
      throw new AppError("Timetable entry not found", 404, "NOT_FOUND");
    }

    await this.handleCancellationAlert(existing);

    await prisma.timetableEntry.delete({ where: { id } });
  },

  async updateEntry(id: number, data: TheoryEntryInput | LabEntryInput) {
    const existing = await prisma.timetableEntry.findUnique({ 
      where: { id },
      include: {
        teacher: true,
        subject: true,
        room: true,
        classSection: { include: { branch: true } },
        labGroups: { include: { teacher: true, subject: true, lab: true } }
      }
    });

    if (!existing) {
      throw new AppError("Timetable entry not found", 404, "NOT_FOUND");
    }

    await this.handleCancellationAlert(existing);

    return prisma.$transaction(async (tx) => {
      await tx.timetableEntry.delete({ where: { id } });

      if (data.entryType === EntryType.LAB || (data as LabEntryInput).labGroups) {
        return createLab(tx, data as LabEntryInput);
      }

      return createTheory(tx, data as TheoryEntryInput);
    });
  },

  async getClassTimetable(classSectionId: number) {
    const classSection = await prisma.classSection.findUnique({
      where: { id: classSectionId },
      include: {
        branch: true,
      },
    });

    if (!classSection) {
      throw new AppError("Class section not found", 404, "NOT_FOUND");
    }

    const entries = await prisma.timetableEntry.findMany({
      where: { classSectionId },
      include: {
        subject: true,
        teacher: true,
        room: true,
        labGroups: {
          include: {
            subject: true,
            lab: true,
            teacher: true,
          },
        },
      },
      orderBy: [{ day: "asc" }, { slotStart: "asc" }],
    });

    return {
      classSectionId,
      branch: classSection.branch.name,
      year: classSection.year,
      timetable: buildMatrix(entries),
    };
  },

  async getTeacherSchedule(teacherId: number) {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      throw new AppError("Teacher not found", 404, "NOT_FOUND");
    }

    const theoryEntries = await prisma.timetableEntry.findMany({
      where: {
        teacherId,
      },
      include: {
        classSection: {
          include: { branch: true },
        },
        subject: true,
        room: true,
      },
      orderBy: [{ day: "asc" }, { slotStart: "asc" }],
    });

    const labEntries = await prisma.labGroupEntry.findMany({
      where: { teacherId },
      include: {
        subject: true,
        lab: true,
        timetableEntry: {
          include: {
            classSection: {
              include: { branch: true },
            },
            subject: true,
          },
        },
      },
      orderBy: [{ timetableEntry: { day: "asc" } }, { timetableEntry: { slotStart: "asc" } }],
    });

    return {
      teacher,
      theoryEntries,
      labEntries,
    };
  },

  async getRoomOccupancy(roomId: number) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new AppError("Room not found", 404, "NOT_FOUND");
    }

    const entries = await prisma.timetableEntry.findMany({
      where: { roomId },
      include: {
        classSection: {
          include: {
            branch: true,
          },
        },
        subject: true,
        teacher: true,
      },
      orderBy: [{ day: "asc" }, { slotStart: "asc" }],
    });

    return {
      room,
      entries,
    };
  },
};
