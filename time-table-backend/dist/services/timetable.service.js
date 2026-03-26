"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timetableService = void 0;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const AppError_1 = require("../utils/AppError");
const timetableMatrix_1 = require("../utils/timetableMatrix");
const timetableConstants_1 = require("../utils/timetableConstants");
const assertDay = (day) => {
    if (!Number.isInteger(day) || day < 1 || day > 6) {
        throw new AppError_1.AppError("Day must be between 1 and 6", 400, "VALIDATION_ERROR");
    }
};
const assertClassAndSubjectPrereq = async (db, classSectionId, subjectId) => {
    const classSection = await db.classSection.findUnique({ where: { id: classSectionId } });
    if (!classSection) {
        throw new AppError_1.AppError("Class section not found", 404, "NOT_FOUND");
    }
    const subject = await db.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
        throw new AppError_1.AppError("Subject not found", 404, "NOT_FOUND");
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
        throw new AppError_1.AppError("Subject is not assigned to this class section", 422, "BUSINESS_RULE_VIOLATION");
    }
};
const assertTeacherSubjectPrereq = async (db, teacherId, subjectId) => {
    const teacher = await db.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
        throw new AppError_1.AppError("Teacher not found", 404, "NOT_FOUND");
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
        throw new AppError_1.AppError("Teacher is not assigned to this subject", 422, "BUSINESS_RULE_VIOLATION");
    }
};
const validateTheoryShape = (data) => {
    assertDay(data.day);
    if (!Number.isInteger(data.slotStart) || data.slotStart < 1 || data.slotStart > 6) {
        throw new AppError_1.AppError("slotStart must be between 1 and 6", 400, "VALIDATION_ERROR");
    }
    const slotEnd = data.slotEnd ?? data.slotStart;
    if (slotEnd !== data.slotStart) {
        throw new AppError_1.AppError("For THEORY entries, slotEnd must equal slotStart", 400, "VALIDATION_ERROR");
    }
};
const validateLabShape = (data) => {
    assertDay(data.day);
    if (!Number.isInteger(data.slotStart) || data.slotStart < 1 || data.slotStart > 6) {
        throw new AppError_1.AppError("slotStart must be between 1 and 6", 400, "VALIDATION_ERROR");
    }
    const slotEnd = data.slotEnd ?? data.slotStart;
    if (slotEnd !== data.slotStart) {
        throw new AppError_1.AppError("For LAB entries, slotEnd must equal slotStart", 400, "VALIDATION_ERROR");
    }
    if (data.labGroups.length < 1 || data.labGroups.length > 3) {
        throw new AppError_1.AppError("LAB entries must include 1 to 3 groups from A1, A2, A3", 400, "VALIDATION_ERROR");
    }
    const groupNames = data.labGroups.map((group) => group.groupName);
    const uniqueNames = new Set(groupNames);
    const required = new Set(timetableConstants_1.LAB_GROUPS);
    if (uniqueNames.size !== groupNames.length || groupNames.some((name) => !required.has(name))) {
        throw new AppError_1.AppError("LAB group names must be unique and chosen from A1, A2, A3", 400, "VALIDATION_ERROR");
    }
};
const formatClassLabel = (classSection) => {
    if (!classSection) {
        return "Unknown class";
    }
    const branchName = classSection.branch?.name ?? "Unknown";
    return `${branchName} Year ${classSection.year}`;
};
const createTheory = async (db, data) => {
    validateTheoryShape(data);
    await assertClassAndSubjectPrereq(db, data.classSectionId, data.subjectId);
    await assertTeacherSubjectPrereq(db, data.teacherId, data.subjectId);
    const room = await db.room.findUnique({ where: { id: data.roomId } });
    if (!room) {
        throw new AppError_1.AppError("Room not found", 404, "NOT_FOUND");
    }
    const classConflict = await db.timetableEntry.findFirst({
        where: {
            classSectionId: data.classSectionId,
            day: data.day,
            slotStart: data.slotStart,
        },
    });
    if (classConflict) {
        throw new AppError_1.AppError("Class section already has an entry at this slot", 409, "CONFLICT");
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
        throw new AppError_1.AppError(`Teacher ${teacherConflict.teacher.abbreviation} is already scheduled on ${timetableConstants_1.DAY_LABELS[data.day]} slot ${data.slotStart} for ${formatClassLabel(teacherConflict.classSection)}`, 409, "CONFLICT");
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
        throw new AppError_1.AppError(`Room ${roomConflict.room.name} is already booked on ${timetableConstants_1.DAY_LABELS[data.day]} slot ${data.slotStart}`, 409, "CONFLICT");
    }
    return db.timetableEntry.create({
        data: {
            classSectionId: data.classSectionId,
            day: data.day,
            slotStart: data.slotStart,
            slotEnd: data.slotStart,
            entryType: client_1.EntryType.THEORY,
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
const createLab = async (db, data) => {
    validateLabShape(data);
    for (const group of data.labGroups) {
        await assertClassAndSubjectPrereq(db, data.classSectionId, group.subjectId);
        await assertTeacherSubjectPrereq(db, group.teacherId, group.subjectId);
        const lab = await db.lab.findUnique({ where: { id: group.labId } });
        if (!lab) {
            throw new AppError_1.AppError(`Lab ${group.labId} not found`, 404, "NOT_FOUND");
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
        throw new AppError_1.AppError("Class section already has an entry at this slot", 409, "CONFLICT");
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
            throw new AppError_1.AppError(`Teacher ${teacher.abbreviation} is already scheduled on ${timetableConstants_1.DAY_LABELS[data.day]} slot ${data.slotStart} for ${formatClassLabel(theoryTeacherConflict.classSection)}`, 409, "CONFLICT");
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
            throw new AppError_1.AppError(`Teacher ${teacher.abbreviation} already has a lab on ${timetableConstants_1.DAY_LABELS[data.day]} slot ${data.slotStart} for ${formatClassLabel(labTeacherConflict.timetableEntry.classSection)}`, 409, "CONFLICT");
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
            throw new AppError_1.AppError(`Lab ${lab.name} is already booked on ${timetableConstants_1.DAY_LABELS[data.day]} slot ${data.slotStart} for ${formatClassLabel(labConflict.timetableEntry.classSection)}`, 409, "CONFLICT");
        }
    }
    return db.timetableEntry.create({
        data: {
            classSectionId: data.classSectionId,
            day: data.day,
            slotStart: data.slotStart,
            slotEnd: data.slotStart,
            entryType: client_1.EntryType.LAB,
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
exports.timetableService = {
    validateAndCreateTheoryEntry(data) {
        return createTheory(client_2.prisma, data);
    },
    validateAndCreateLabEntry(data) {
        return client_2.prisma.$transaction((tx) => createLab(tx, data));
    },
    async deleteEntry(id) {
        const existing = await client_2.prisma.timetableEntry.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError_1.AppError("Timetable entry not found", 404, "NOT_FOUND");
        }
        await client_2.prisma.timetableEntry.delete({ where: { id } });
    },
    async updateEntry(id, data) {
        const existing = await client_2.prisma.timetableEntry.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError_1.AppError("Timetable entry not found", 404, "NOT_FOUND");
        }
        return client_2.prisma.$transaction(async (tx) => {
            await tx.timetableEntry.delete({ where: { id } });
            if (data.entryType === client_1.EntryType.LAB || data.labGroups) {
                return createLab(tx, data);
            }
            return createTheory(tx, data);
        });
    },
    async getClassTimetable(classSectionId) {
        const classSection = await client_2.prisma.classSection.findUnique({
            where: { id: classSectionId },
            include: {
                branch: true,
            },
        });
        if (!classSection) {
            throw new AppError_1.AppError("Class section not found", 404, "NOT_FOUND");
        }
        const entries = await client_2.prisma.timetableEntry.findMany({
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
            timetable: (0, timetableMatrix_1.buildMatrix)(entries),
        };
    },
    async getTeacherSchedule(teacherId) {
        const teacher = await client_2.prisma.teacher.findUnique({ where: { id: teacherId } });
        if (!teacher) {
            throw new AppError_1.AppError("Teacher not found", 404, "NOT_FOUND");
        }
        const theoryEntries = await client_2.prisma.timetableEntry.findMany({
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
        const labEntries = await client_2.prisma.labGroupEntry.findMany({
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
    async getRoomOccupancy(roomId) {
        const room = await client_2.prisma.room.findUnique({ where: { id: roomId } });
        if (!room) {
            throw new AppError_1.AppError("Room not found", 404, "NOT_FOUND");
        }
        const entries = await client_2.prisma.timetableEntry.findMany({
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
