import { PrismaClient, TimetableEntryType, AcademicYearStatus, NotificationLogType } from "@prisma/client";
import { prisma } from "../prisma/client";
import { AppError } from "../utils/AppError";
import { LAB_GROUPS } from "../utils/timetableConstants";
import { getParitySemesterList } from "../utils/semesterParity";

export const autoSchedulerService = {
  async generateTimetable(classSectionId: string) {
    // 1. Fetch class data and requirements
    const classSection = await prisma.classSection.findUnique({
      where: { id: classSectionId },
      include: { 
        branch: true,
        subjects: { include: { subject: true } } 
      },
    });

    if (!classSection) throw new AppError("Class section not found", 404, "NOT_FOUND");

    const academicYear = await prisma.academicYear.findUnique({ where: { id: classSection.academicYearId } });
    if (!academicYear) throw new AppError("Academic year not found", 404, "NOT_FOUND");
    if (academicYear.status === AcademicYearStatus.ARCHIVED) {
      throw new AppError("Cannot generate timetable for an archived academic year", 403, "FORBIDDEN");
    }
    const academicYearId = classSection.academicYearId;

    const classSubjects = classSection.subjects.map((cs) => cs.subject!);
    if (classSubjects.length === 0) {
      throw new AppError("No subjects assigned to this class section", 400, "VALIDATION_ERROR");
    }

    // 2. Fetch Slot table and build the orderToId lookup map
    // The scheduler works internally with slot order integers (1–6), same as before.
    // When writing to DB, it uses slotOrderToId[order] to get the FK.
    const allSlots = await prisma.slot.findMany({ orderBy: { order: "asc" } });
    const slotOrderToId = new Map<number, string>(allSlots.map((s) => [s.order, s.id]));

    const resolveSlotId = (order: number): string => {
      const id = slotOrderToId.get(order);
      if (!id) throw new AppError(`Slot order ${order} not found in DB`, 500, "INTERNAL_ERROR");
      return id;
    };

    // 3. Fetch Global Resources and Relationships
    const allTeachers = await prisma.teacher.findMany({ include: { teacherSubjects: true } });
    const allRooms = await prisma.room.findMany();
    const allLabs = await prisma.lab.findMany();

    // subjectId → available teacherIds
    const teacherMap = new Map<string, string[]>();
    for (const t of allTeachers) {
      for (const ts of t.teacherSubjects) {
        if (!teacherMap.has(ts.subjectId)) teacherMap.set(ts.subjectId, []);
        teacherMap.get(ts.subjectId)!.push(t.id);
      }
    }

    // 4. Global Occupancy Matrices indexed by [id][day][slotOrder]
    const teacherOcc: Record<string, Record<number, Record<number, boolean>>> = {};
    const roomOcc: Record<string, Record<number, Record<number, boolean>>> = {};
    const labOcc: Record<string, Record<number, Record<number, boolean>>> = {};

    for (const t of allTeachers) teacherOcc[t.id] = { 1:{}, 2:{}, 3:{}, 4:{}, 5:{}, 6:{} };
    for (const r of allRooms) roomOcc[r.id] = { 1:{}, 2:{}, 3:{}, 4:{}, 5:{}, 6:{} };
    for (const l of allLabs) labOcc[l.id] = { 1:{}, 2:{}, 3:{}, 4:{}, 5:{}, 6:{} };

    // Fetch existing entries EXCLUDING the current class but WITHIN the same academic year.
    // Include slot to get the order value for the occupancy matrix.
    const existingEntries = await prisma.timetableEntry.findMany({
      where: {
        classSectionId: { not: classSectionId },
        classSection: {
          academicYearId,
          semester: {
            in: getParitySemesterList(classSection.semester),
          },
        },
      },
      include: { slot: true, labGroups: true },
    });

    for (const entry of existingEntries) {
      const d = entry.day;
      const startOrder = entry.slot.order;
      // LAB entries occupy 2 consecutive slots; theory entries occupy just 1.
      const slotOrders = entry.entryType === "LAB"
        ? [startOrder, startOrder + 1]
        : [startOrder];

      for (const s of slotOrders) {
        if (entry.entryType === "LAB") {
          for (const lg of entry.labGroups) {
            if (teacherOcc[lg.teacherId]) teacherOcc[lg.teacherId][d][s] = true;
            if (labOcc[lg.labId]) labOcc[lg.labId][d][s] = true;
          }
        } else {
          if (entry.teacherId && teacherOcc[entry.teacherId]) teacherOcc[entry.teacherId][d][s] = true;
          if (entry.roomId && roomOcc[entry.roomId]) roomOcc[entry.roomId][d][s] = true;
        }
      }
    }

    // 5. Build work queues for the chosen class
    const unplacedTheories = classSubjects
      .filter((s) => s.type === "THEORY")
      .map((s) => ({ subject: s, remaining: s.creditHours }));

    // Each lab subject needs 3 group slots (A1, A2, A3)
    const labNeeds: { groupName: string; subject: any }[] = [];
    for (const subj of classSubjects.filter((s) => s.type === "LAB")) {
      for (const groupName of LAB_GROUPS) {
        labNeeds.push({ groupName, subject: subj });
      }
    }

    const generatedTheoryPayloads: any[] = [];
    const generatedLabPayloads: any[] = [];
    const auditReport: string[] = [];

    // Local occupancy tracker for this class
    const classOcc: Record<number, Record<number, boolean>> = { 1:{}, 2:{}, 3:{}, 4:{}, 5:{}, 6:{} };
    const subjectsToday: Record<number, Record<string, number>> = { 1:{}, 2:{}, 3:{}, 4:{}, 5:{}, 6:{} };

    const validLabStarts = [1, 2, 4, 5]; // LAB can start at these orders (needs order+1 to exist)

    const findFreeRoom = (d: number, s: number) =>
      allRooms.find((r) => !roomOcc[r.id][d][s]);

    const findFreeTeacher = (subjectId: string, d: number, s: number) => {
      const candidates = teacherMap.get(subjectId) || [];
      return candidates.find((tId) => !teacherOcc[tId][d][s]);
    };

    // 6. Algorithm Core (two-pass: strict then relaxed)
    for (const relaxed of [false, true]) {
      for (const d of [1, 2, 3, 4, 5, 6]) {
        for (const s of [1, 2, 3, 4, 5, 6]) {
          if (classOcc[d][s]) continue;

          // Attempt LAB placement
          if (!relaxed && validLabStarts.includes(s) && labNeeds.length > 0 && !classOcc[d][s + 1]) {
            const selectedNeeds: any[] = [];
            const usedGroups = new Set<string>();
            const assignedLabs = new Set<string>();
            const assignedTeachers = new Set<string>();

            for (let i = 0; i < labNeeds.length; i++) {
              const need = labNeeds[i];
              if (usedGroups.has(need.groupName)) continue;

              const candidates = teacherMap.get(need.subject.id) || [];
              const teacher = candidates.find(
                (tId) => !teacherOcc[tId][d][s] && !teacherOcc[tId][d][s + 1] && !assignedTeachers.has(tId),
              );
              const lab = allLabs.find(
                (l) => !labOcc[l.id][d][s] && !labOcc[l.id][d][s + 1] && !assignedLabs.has(l.id),
              );

              if (teacher && lab) {
                selectedNeeds.push({ needId: i, ...need, teacherId: teacher, labId: lab.id });
                usedGroups.add(need.groupName);
                assignedTeachers.add(teacher);
                assignedLabs.add(lab.id);
                if (selectedNeeds.length === 2) break;
              }
            }

            if (selectedNeeds.length > 0) {
              generatedLabPayloads.push({
                classSectionId,
                day: d,
                slotOrder: s, // stored as order; resolved to slotId at write time
                entryType: "LAB",
                labGroups: selectedNeeds.map((n) => ({
                  groupName: n.groupName,
                  subjectId: n.subject.id,
                  labId: n.labId,
                  teacherId: n.teacherId,
                })),
              });

              for (const n of selectedNeeds) {
                teacherOcc[n.teacherId][d][s] = true;
                teacherOcc[n.teacherId][d][s + 1] = true;
                labOcc[n.labId][d][s] = true;
                labOcc[n.labId][d][s + 1] = true;
              }
              classOcc[d][s] = true;
              classOcc[d][s + 1] = true;

              const indicesToRemove = selectedNeeds.map((n) => n.needId).sort((a, b) => b - a);
              for (const idx of indicesToRemove) labNeeds.splice(idx, 1);

              continue;
            }
          }

          // Attempt THEORY placement
          for (let i = 0; i < unplacedTheories.length; i++) {
            const theory = unplacedTheories[i];
            const alreadyToday = subjectsToday[d][theory.subject.id] || 0;

            if (!relaxed && alreadyToday >= 1) continue;

            const room = findFreeRoom(d, s);
            const teacherId = findFreeTeacher(theory.subject.id, d, s);

            if (room && teacherId) {
              generatedTheoryPayloads.push({
                classSectionId,
                day: d,
                slotOrder: s, // resolved to slotId at write time
                entryType: "LECTURE",
                subjectId: theory.subject.id,
                roomId: room.id,
                teacherId,
              });

              roomOcc[room.id][d][s] = true;
              teacherOcc[teacherId][d][s] = true;
              classOcc[d][s] = true;

              subjectsToday[d][theory.subject.id] = alreadyToday + 1;
              theory.remaining--;
              if (theory.remaining === 0) unplacedTheories.splice(i, 1);

              break;
            }
          }
        }
      }
    }

    // 7. Report Unplaced Components
    if (labNeeds.length > 0) {
      auditReport.push(`Warning: Could not schedule ${labNeeds.length} individual lab group requirements due to lack of teachers/labs.`);
      for (const n of labNeeds) auditReport.push(`- Skipped Lab: Group ${n.groupName} for ${n.subject.name}`);
    }

    const failedTheories = unplacedTheories.filter((t) => t.remaining > 0);
    if (failedTheories.length > 0) {
      auditReport.push("Warning: Could not schedule the following theory hours due to Teacher/Room conflicts:");
      for (const t of failedTheories) auditReport.push(`- ${t.subject.name}: Missed ${t.remaining} periods.`);
    }

    if (auditReport.length === 0) {
      auditReport.push(
        `Success! 100% of required classes scheduled. Generated ${generatedTheoryPayloads.length} theory slots and ${generatedLabPayloads.length} lab blocks.`,
      );
    }

    // 8. Write to Database (Transaction) — resolve slotOrder → slotId here
    await prisma.$transaction(async (tx) => {
      await tx.timetableEntry.deleteMany({ where: { classSectionId } });

      if (generatedTheoryPayloads.length > 0) {
        await tx.timetableEntry.createMany({
          data: generatedTheoryPayloads.map((p) => ({
            classSectionId: p.classSectionId,
            day: p.day,
            slotId: resolveSlotId(p.slotOrder), // resolve here, at write time
            entryType: p.entryType,
            subjectId: p.subjectId,
            roomId: p.roomId,
            teacherId: p.teacherId,
          })),
        });
      }

      for (const lab of generatedLabPayloads) {
        await tx.timetableEntry.create({
          data: {
            classSectionId: lab.classSectionId,
            day: lab.day,
            slotId: resolveSlotId(lab.slotOrder), // resolve here
            entryType: lab.entryType,
            labGroups: { create: lab.labGroups },
          },
        });
      }
    });
    
    // 9. Log activity summary
    await prisma.notificationLog.create({
      data: {
        type: NotificationLogType.ENTRY_CREATED,
        performedBy: "Auto-Scheduler",
        message: `Timetable auto-generated for ${classSection.branch?.name ?? "Class"} Year ${classSection.year} — ${generatedTheoryPayloads.length} lectures and ${generatedLabPayloads.length} labs created.`,
        date: new Date(),
        metadata: {
          classSectionId,
          lecturesCount: generatedTheoryPayloads.length,
          labsCount: generatedLabPayloads.length,
          auditReport,
        },
      },
    });

    return { success: true, auditReport };
  },
};
