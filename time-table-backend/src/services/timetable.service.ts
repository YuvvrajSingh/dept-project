import { Prisma, PrismaClient, TimetableEntryType, AcademicYearStatus, NotificationLogType } from "@prisma/client";
import { prisma } from "../prisma/client";
import { AppError } from "../utils/AppError";
import { buildMatrix } from "../utils/timetableMatrix";
import { DAY_LABELS, LAB_GROUPS } from "../utils/timetableConstants";

type DbClient = PrismaClient | Prisma.TransactionClient;

// ─── Input Types ──────────────────────────────────────────────────────────────
// All inputs use slotOrder (1–6 integer) which the service resolves to a slotId FK.

type TheoryEntryInput = {
  classSectionId: number;
  day: number;
  slotStart: number; // 1–6 integer sent by the frontend; resolved to slotId internally
  entryType?: TimetableEntryType;
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
  slotStart: number; // 1–6 integer sent by the frontend; the LAB occupies slotStart AND slotStart+1
  entryType?: TimetableEntryType;
  labGroups: LabGroupInput[];
};

// ─── Slot Resolution ──────────────────────────────────────────────────────────

/**
 * Resolves a slot by its order value (1–6) and returns its id.
 * Throws 400 if the order is out of range or no matching Slot row exists.
 */
const resolveSlotId = async (db: DbClient, slotOrder: number): Promise<number> => {
  if (!Number.isInteger(slotOrder) || slotOrder < 1 || slotOrder > 6) {
    throw new AppError("slotOrder must be an integer between 1 and 6", 400, "VALIDATION_ERROR");
  }
  const slot = await (db as PrismaClient).slot.findUnique({ where: { order: slotOrder } });
  if (!slot) {
    throw new AppError(`Slot with order ${slotOrder} not found`, 500, "INTERNAL_ERROR");
  }
  return slot.id;
};

// ─── Validation Helpers ───────────────────────────────────────────────────────

const assertDay = (day: number) => {
  if (!Number.isInteger(day) || day < 1 || day > 6) {
    throw new AppError("Day must be between 1 and 6", 400, "VALIDATION_ERROR");
  }
};

const getAcademicYearIdForClass = async (db: DbClient, classSectionId: number): Promise<number> => {
  const cs = await (db as PrismaClient).classSection.findUnique({
    where: { id: classSectionId },
    select: { academicYearId: true, academicYear: true },
  });
  if (!cs) {
    throw new AppError("Class section not found", 404, "NOT_FOUND");
  }
  if (cs.academicYear.status === AcademicYearStatus.ARCHIVED) {
    throw new AppError("Cannot modify timetable in an archived academic year", 403, "FORBIDDEN");
  }
  return cs.academicYearId;
};

const assertClassAndSubjectPrereq = async (
  db: DbClient,
  classSectionId: number,
  subjectId: number,
): Promise<void> => {
  const classSection = await (db as PrismaClient).classSection.findUnique({ where: { id: classSectionId } });
  if (!classSection) {
    throw new AppError("Class section not found", 404, "NOT_FOUND");
  }

  const subject = await (db as PrismaClient).subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    throw new AppError("Subject not found", 404, "NOT_FOUND");
  }

  const classSubject = await (db as PrismaClient).classSubject.findUnique({
    where: { classSectionId_subjectId: { classSectionId, subjectId } },
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
  const teacher = await (db as PrismaClient).teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) {
    throw new AppError("Teacher not found", 404, "NOT_FOUND");
  }

  const teacherSubject = await (db as PrismaClient).teacherSubject.findUnique({
    where: { teacherId_subjectId: { teacherId, subjectId } },
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
};

const validateLabShape = (data: LabEntryInput) => {
  assertDay(data.day);

  if (!Number.isInteger(data.slotStart) || data.slotStart < 1 || data.slotStart > 5) {
    // LABs occupy slotStart AND slotStart+1, so max start is 5
    throw new AppError("slotStart for LAB must be between 1 and 5", 400, "VALIDATION_ERROR");
  }

  if (data.labGroups.length < 1 || data.labGroups.length > 3) {
    throw new AppError("LAB entries must include 1 to 3 groups from A1, A2, A3", 400, "VALIDATION_ERROR");
  }

  const groupNames = data.labGroups.map((group) => group.groupName);
  const uniqueNames = new Set(groupNames);
  const required = new Set(LAB_GROUPS);

  if (
    uniqueNames.size !== groupNames.length ||
    groupNames.some((name) => !required.has(name as (typeof LAB_GROUPS)[number]))
  ) {
    throw new AppError("LAB group names must be unique and chosen from A1, A2, A3", 400, "VALIDATION_ERROR");
  }
};

const formatClassLabel = (
  classSection?: { year: number; branch?: { name: string } | null } | null,
) => {
  if (!classSection) return "Unknown class";
  const branchName = classSection.branch?.name ?? "Unknown";
  return `${branchName} Year ${classSection.year}`;
};

// ─── Logging Helper ──────────────────────────────────────────────────────────

type LogParams = {
  db: DbClient;
  type: NotificationLogType;
  timetableEntryId?: number;
  performedBy?: string;
  message: string;
  metadata?: any;
};

const logActivity = async (params: LogParams) => {
  await (params.db as PrismaClient).notificationLog.create({
    data: {
      timetableEntryId: params.timetableEntryId,
      performedBy: params.performedBy || "System User",
      type: params.type,
      message: params.message,
      metadata: params.metadata || {},
      date: new Date(),
    },
  });
};

const getLogMetadata = (entry: any) => {
  const subjectName = entry.subject?.name || (entry.labGroups?.[0]?.subject?.name) || "Unknown Subject";
  const className = formatClassLabel(entry.classSection || entry.timetableEntry?.classSection);
  const teacherName = entry.teacher?.name || (entry.labGroups?.[0]?.teacher?.name) || "Unknown Teacher";
  const slotOrder = entry.slot?.order || entry.timetableEntry?.slot?.order || "?";
  
  return {
    subjectName,
    className,
    teacherName,
    day: entry.day || entry.timetableEntry?.day,
    slotOrder,
  };
};

// Scope filter: only check conflicts within the same academic year
const yearScopeFilter = (academicYearId: number) => ({
  classSection: { academicYearId },
});

// ─── Core Write Operations ────────────────────────────────────────────────────

const createTheory = async (db: DbClient, data: TheoryEntryInput) => {
  validateTheoryShape(data);
  const academicYearId = await getAcademicYearIdForClass(db, data.classSectionId);
  await assertClassAndSubjectPrereq(db, data.classSectionId, data.subjectId);
  await assertTeacherSubjectPrereq(db, data.teacherId, data.subjectId);

  const slotId = await resolveSlotId(db, data.slotStart);

  const room = await (db as PrismaClient).room.findUnique({ where: { id: data.roomId } });
  if (!room) {
    throw new AppError("Room not found", 404, "NOT_FOUND");
  }

  // Class-slot conflict (also enforced by DB unique constraint)
  const classConflict = await (db as PrismaClient).timetableEntry.findFirst({
    where: { classSectionId: data.classSectionId, day: data.day, slotId },
  });
  if (classConflict) {
    throw new AppError("Class section already has an entry at this slot", 409, "CONFLICT");
  }

  // Teacher conflicts — check theory entries
  const theoryTeacherConflict = await (db as PrismaClient).timetableEntry.findFirst({
    where: {
      ...yearScopeFilter(academicYearId),
      teacherId: data.teacherId,
      day: data.day,
      slotId,
    },
    include: {
      teacher: true,
      classSection: { include: { branch: true } },
    },
  });
  if (theoryTeacherConflict?.teacher) {
    throw new AppError(
      `Teacher ${theoryTeacherConflict.teacher.abbreviation} is already scheduled on ${DAY_LABELS[data.day as keyof typeof DAY_LABELS]} slot ${data.slotStart} for ${formatClassLabel(theoryTeacherConflict.classSection)}`,
      409,
      "CONFLICT",
    );
  }

  // Teacher conflicts — check if teacher is in a lab at this slot
  const labStartSlotId = slotId;
  // A lab that starts one slot before would also occupy this slot
  const prevSlotOrder = data.slotStart - 1;
  const prevSlotId = prevSlotOrder >= 1
    ? await (db as PrismaClient).slot.findUnique({ where: { order: prevSlotOrder } }).then(s => s?.id)
    : null;

  const labSlotFilter = prevSlotId
    ? { slotId: { in: [labStartSlotId, prevSlotId] } }
    : { slotId: labStartSlotId };

  const labTeacherConflict = await (db as PrismaClient).labGroupEntry.findFirst({
    where: {
      teacherId: data.teacherId,
      timetableEntry: {
        ...yearScopeFilter(academicYearId),
        day: data.day,
        ...labSlotFilter,
      },
    },
    include: {
      teacher: true,
      timetableEntry: { include: { classSection: { include: { branch: true } } } },
    },
  });
  if (labTeacherConflict?.teacher) {
    throw new AppError(
      `Teacher ${labTeacherConflict.teacher.abbreviation} already has a lab on ${DAY_LABELS[data.day as keyof typeof DAY_LABELS]} slot ${data.slotStart} for ${formatClassLabel(labTeacherConflict.timetableEntry.classSection)}`,
      409,
      "CONFLICT",
    );
  }

  // Room conflict
  const roomConflict = await (db as PrismaClient).timetableEntry.findFirst({
    where: {
      ...yearScopeFilter(academicYearId),
      roomId: data.roomId,
      day: data.day,
      slotId,
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

  const entry = await (db as PrismaClient).timetableEntry.create({
    data: {
      classSectionId: data.classSectionId,
      day: data.day,
      slotId,
      entryType: TimetableEntryType.LECTURE,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      roomId: data.roomId,
    },
    include: {
      slot: true,
      subject: true,
      teacher: true,
      room: true,
      classSection: { include: { branch: true } },
    },
  });

  const meta = getLogMetadata(entry);
  await logActivity({
    db,
    type: NotificationLogType.ENTRY_CREATED,
    timetableEntryId: entry.id,
    message: `Created LECTURE: ${meta.subjectName} for ${meta.className} on Day ${meta.day} Slot ${meta.slotOrder}`,
    metadata: meta,
  });

  return entry;
};

const createLab = async (db: DbClient, data: LabEntryInput) => {
  validateLabShape(data);
  const academicYearId = await getAcademicYearIdForClass(db, data.classSectionId);

  for (const group of data.labGroups) {
    await assertClassAndSubjectPrereq(db, data.classSectionId, group.subjectId);
    await assertTeacherSubjectPrereq(db, group.teacherId, group.subjectId);
    const lab = await (db as PrismaClient).lab.findUnique({ where: { id: group.labId } });
    if (!lab) {
      throw new AppError(`Lab ${group.labId} not found`, 404, "NOT_FOUND");
    }
  }

  // Resolve both slot IDs that the lab will occupy (slotStart and slotStart+1)
  const startSlotId = await resolveSlotId(db, data.slotStart);
  const endSlotId = await resolveSlotId(db, data.slotStart + 1);
  const labSlotIds = [startSlotId, endSlotId];

  // Class-slot conflict (both slots must be free)
  const classConflict = await (db as PrismaClient).timetableEntry.findFirst({
    where: {
      classSectionId: data.classSectionId,
      day: data.day,
      slotId: { in: labSlotIds },
    },
  });
  if (classConflict) {
    throw new AppError("Class section already has an entry at this slot", 409, "CONFLICT");
  }

  for (const group of data.labGroups) {
    const teacher = await (db as PrismaClient).teacher.findUnique({ where: { id: group.teacherId } });
    const lab = await (db as PrismaClient).lab.findUnique({ where: { id: group.labId } });

    // Teacher conflict — theory entries in either lab slot
    const theoryTeacherConflict = await (db as PrismaClient).timetableEntry.findFirst({
      where: {
        ...yearScopeFilter(academicYearId),
        teacherId: group.teacherId,
        day: data.day,
        slotId: { in: labSlotIds },
      },
      include: { classSection: { include: { branch: true } } },
    });
    if (theoryTeacherConflict && teacher) {
      throw new AppError(
        `Teacher ${teacher.abbreviation} is already scheduled on ${DAY_LABELS[data.day as keyof typeof DAY_LABELS]} slot ${data.slotStart} for ${formatClassLabel(theoryTeacherConflict.classSection)}`,
        409,
        "CONFLICT",
      );
    }

    // Teacher conflict — other lab entries overlapping either slot
    const labTeacherConflict = await (db as PrismaClient).labGroupEntry.findFirst({
      where: {
        teacherId: group.teacherId,
        timetableEntry: {
          ...yearScopeFilter(academicYearId),
          day: data.day,
          slotId: { in: labSlotIds },
        },
      },
      include: {
        timetableEntry: { include: { classSection: { include: { branch: true } } } },
      },
    });
    if (labTeacherConflict && teacher) {
      throw new AppError(
        `Teacher ${teacher.abbreviation} already has a lab on ${DAY_LABELS[data.day as keyof typeof DAY_LABELS]} slot ${data.slotStart} for ${formatClassLabel(labTeacherConflict.timetableEntry.classSection)}`,
        409,
        "CONFLICT",
      );
    }

    // Lab room conflict
    const labConflict = await (db as PrismaClient).labGroupEntry.findFirst({
      where: {
        labId: group.labId,
        timetableEntry: {
          ...yearScopeFilter(academicYearId),
          day: data.day,
          slotId: { in: labSlotIds },
        },
      },
      include: {
        timetableEntry: { include: { classSection: { include: { branch: true } } } },
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

  const entry = await (db as PrismaClient).timetableEntry.create({
    data: {
      classSectionId: data.classSectionId,
      day: data.day,
      slotId: startSlotId, // LAB entry is anchored to the start slot
      entryType: TimetableEntryType.LAB,
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
      slot: true,
      classSection: { include: { branch: true } },
      labGroups: {
        include: {
          subject: true,
          lab: true,
          teacher: true,
        },
      },
    },
  });

  const meta = getLogMetadata(entry);
  await logActivity({
    db,
    type: NotificationLogType.ENTRY_CREATED,
    timetableEntryId: entry.id,
    message: `Created LAB: ${meta.subjectName} for ${meta.className} on Day ${meta.day} Slot ${meta.slotOrder}`,
    metadata: meta,
  });

  return entry;
};

// ─── Service Exports ──────────────────────────────────────────────────────────

export const timetableService = {

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
        slot: true,
        classSection: { include: { branch: true, academicYear: true } },
        labGroups: { include: { teacher: true, subject: true, lab: true } },
      },
    });

    if (!existing) {
      throw new AppError("Timetable entry not found", 404, "NOT_FOUND");
    }

    if (existing.classSection.academicYear.status === AcademicYearStatus.ARCHIVED) {
      throw new AppError("Cannot modify timetable in an archived academic year", 403, "FORBIDDEN");
    }

    const meta = getLogMetadata(existing);
    await logActivity({
      db: prisma,
      type: NotificationLogType.ENTRY_DELETED,
      performedBy: "System User",
      message: `Deleted ${existing.entryType}: ${meta.subjectName} for ${meta.className} on Day ${meta.day} Slot ${meta.slotOrder}`,
      metadata: meta,
    });

    await prisma.timetableEntry.delete({ where: { id } });
  },

  async updateEntry(id: number, data: TheoryEntryInput | LabEntryInput) {
    const existing = await prisma.timetableEntry.findUnique({
      where: { id },
      include: {
        teacher: true,
        subject: true,
        room: true,
        slot: true,
        classSection: { include: { branch: true, academicYear: true } },
        labGroups: { include: { teacher: true, subject: true, lab: true } },
      },
    });

    if (!existing) {
      throw new AppError("Timetable entry not found", 404, "NOT_FOUND");
    }

    if (existing.classSection.academicYear.status === AcademicYearStatus.ARCHIVED) {
      throw new AppError("Cannot modify timetable in an archived academic year", 403, "FORBIDDEN");
    }

    return prisma.$transaction(async (tx) => {
      // Logic: Delete old then create new to handle type shifts (Theory -> Lab etc)
      await tx.timetableEntry.delete({ where: { id } });

      let newEntry;
      if (data.entryType === TimetableEntryType.LAB || (data as LabEntryInput).labGroups) {
        newEntry = await createLab(tx, data as LabEntryInput);
      } else {
        newEntry = await createTheory(tx, data as TheoryEntryInput);
      }

      const meta = getLogMetadata(newEntry);
      await logActivity({
        db: tx,
        type: NotificationLogType.ENTRY_UPDATED,
        timetableEntryId: newEntry.id,
        message: `Updated entry: ${meta.subjectName} for ${meta.className} at Day ${meta.day} Slot ${meta.slotOrder}`,
        metadata: {
          previous: getLogMetadata(existing),
          current: meta,
        },
      });

      return newEntry;
    });
  },

  async getClassTimetable(classSectionId: number) {
    const classSection = await prisma.classSection.findUnique({
      where: { id: classSectionId },
      include: { branch: true, academicYear: true },
    });

    if (!classSection) {
      throw new AppError("Class section not found", 404, "NOT_FOUND");
    }

    const entries = await prisma.timetableEntry.findMany({
      where: { classSectionId },
      include: {
        slot: true,
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
      orderBy: [{ day: "asc" }, { slot: { order: "asc" } }],
    });

    return {
      classSectionId,
      branch: classSection.branch.name,
      year: classSection.year,
      semester: classSection.semester,
      academicYear: classSection.academicYear.label,
      timetable: buildMatrix(entries),
    };
  },

  async getTeacherSchedule(teacherId: number, academicYearId?: number) {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      throw new AppError("Teacher not found", 404, "NOT_FOUND");
    }

    const yearFilter = academicYearId ? { classSection: { academicYearId } } : {};

    const theoryEntries = await prisma.timetableEntry.findMany({
      where: { teacherId, ...yearFilter },
      include: {
        slot: true,
        classSection: { include: { branch: true } },
        subject: true,
        room: true,
      },
      orderBy: [{ day: "asc" }, { slot: { order: "asc" } }],
    });

    const labEntries = await prisma.labGroupEntry.findMany({
      where: {
        teacherId,
        ...(academicYearId ? { timetableEntry: { classSection: { academicYearId } } } : {}),
      },
      include: {
        subject: true,
        lab: true,
        timetableEntry: {
          include: {
            slot: true,
            classSection: { include: { branch: true } },
            subject: true,
          },
        },
      },
      orderBy: [
        { timetableEntry: { day: "asc" } },
        { timetableEntry: { slot: { order: "asc" } } },
      ],
    });

    return { teacher, theoryEntries, labEntries };
  },

  async getRoomOccupancy(roomId: number, academicYearId?: number) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      throw new AppError("Room not found", 404, "NOT_FOUND");
    }

    const yearFilter = academicYearId ? { classSection: { academicYearId } } : {};

    const entries = await prisma.timetableEntry.findMany({
      where: { roomId, ...yearFilter },
      include: {
        slot: true,
        classSection: { include: { branch: true } },
        subject: true,
        teacher: true,
      },
      orderBy: [{ day: "asc" }, { slot: { order: "asc" } }],
    });

    return { room, entries };
  },

  factoryReset: async () => {
    return prisma.$transaction(async (db) => {
      await db.notificationLog.deleteMany({});
      await db.labGroupEntry.deleteMany({});
      await db.timetableEntry.deleteMany({});
      await db.teacherSubject.deleteMany({});
      await db.classSubject.deleteMany({});
      await db.room.deleteMany({});
      await db.lab.deleteMany({});
      await db.subject.deleteMany({});
      await db.teacher.deleteMany({});
      await db.classSection.deleteMany({});
      await db.branch.deleteMany({});
      await db.academicYear.deleteMany({});
      // Note: Slots are static configuration and are intentionally NOT wiped
      // in a factory reset. Re-run the seed to restore them if needed.
      return { success: true, message: "Factory reset complete" };
    });
  },
};
