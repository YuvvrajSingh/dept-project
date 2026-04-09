"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoSchedulerService = void 0;
const client_1 = require("../prisma/client");
const AppError_1 = require("../utils/AppError");
exports.autoSchedulerService = {
    async generateTimetable(classSectionId) {
        // 1. Fetch class data and requirements
        const classSection = await client_1.prisma.classSection.findUnique({
            where: { id: classSectionId },
            include: { subjects: { include: { subject: true } } },
        });
        if (!classSection)
            throw new AppError_1.AppError("Class section not found", 404, "NOT_FOUND");
        const classSubjects = classSection.subjects.map((cs) => cs.subject);
        if (classSubjects.length === 0) {
            throw new AppError_1.AppError("No subjects assigned to this class section", 400, "VALIDATION_ERROR");
        }
        // 2. Fetch Global Resources and Relationships
        const allTeachers = await client_1.prisma.teacher.findMany({ include: { teacherSubjects: true } });
        const allRooms = await client_1.prisma.room.findMany();
        const allLabs = await client_1.prisma.lab.findMany();
        const teacherMap = new Map(); // subjectId -> available teacherIds
        for (const t of allTeachers) {
            for (const ts of t.teacherSubjects) {
                if (!teacherMap.has(ts.subjectId))
                    teacherMap.set(ts.subjectId, []);
                teacherMap.get(ts.subjectId).push(t.id);
            }
        }
        // 3. Global Occupancy Matrices
        // Boolean grids: arr[id][day][slot]
        const teacherOcc = {};
        const roomOcc = {};
        const labOcc = {};
        for (const t of allTeachers)
            teacherOcc[t.id] = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
        for (const r of allRooms)
            roomOcc[r.id] = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
        for (const l of allLabs)
            labOcc[l.id] = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
        // Fetch existing entries EXCLUDING the current class (we will overwrite current class)
        const existingEntries = await client_1.prisma.timetableEntry.findMany({
            where: { classSectionId: { not: classSectionId } },
            include: { labGroups: true },
        });
        for (const entry of existingEntries) {
            const d = entry.day;
            const s1 = entry.slotStart;
            const s2 = entry.slotEnd; // LABs are e.g. 1 and 2
            for (let s = s1; s <= s2; s++) {
                if (entry.entryType === "THEORY") {
                    if (entry.teacherId)
                        teacherOcc[entry.teacherId][d][s] = true;
                    if (entry.roomId)
                        roomOcc[entry.roomId][d][s] = true;
                }
                else if (entry.entryType === "LAB") {
                    for (const lg of entry.labGroups) {
                        teacherOcc[lg.teacherId][d][s] = true;
                        labOcc[lg.labId][d][s] = true;
                    }
                }
            }
        }
        // 4. Queues for the chosen class
        const unplacedTheories = classSubjects
            .filter((s) => s.type === "THEORY")
            .map((s) => ({ subject: s, remaining: s.creditHours }));
        const labNeeds = [];
        const classLabSubjects = classSubjects.filter((s) => s.type === "LAB");
        for (const subj of classLabSubjects) {
            labNeeds.push({ groupName: "A1", subject: subj });
            labNeeds.push({ groupName: "A2", subject: subj });
            labNeeds.push({ groupName: "A3", subject: subj });
        }
        const generatedTheoryPayloads = [];
        const generatedLabPayloads = [];
        const auditReport = [];
        // Local tracker rules
        const classOcc = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
        const subjectsToday = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
        // Lab valid start slots
        const validLabStarts = [1, 2, 4, 5];
        // Helper: Find 1 free room
        const findFreeRoom = (d, s) => {
            return allRooms.find((r) => !roomOcc[r.id][d][s]);
        };
        // Helper: Find 1 free teacher for theory
        const findFreeTeacher = (subjectId, d, s) => {
            const candidates = teacherMap.get(subjectId) || [];
            return candidates.find((tId) => !teacherOcc[tId][d][s]);
        };
        // 5. Algorithm Core
        for (const relaxed of [false, true]) {
            for (const d of [1, 2, 3, 4, 5, 6]) {
                for (const s of [1, 2, 3, 4, 5, 6]) {
                    if (classOcc[d][s])
                        continue;
                    // Attempt LAB mapping
                    if (!relaxed && validLabStarts.includes(s) && labNeeds.length > 0 && !classOcc[d][s + 1]) {
                        const selectedNeeds = [];
                        const usedGroups = new Set();
                        const assignedLabs = new Set();
                        const assignedTeachers = new Set();
                        for (let i = 0; i < labNeeds.length; i++) {
                            const need = labNeeds[i];
                            if (usedGroups.has(need.groupName))
                                continue;
                            const candidates = teacherMap.get(need.subject.id) || [];
                            const teacher = candidates.find(tId => !teacherOcc[tId][d][s] && !teacherOcc[tId][d][s + 1] && !assignedTeachers.has(tId));
                            const lab = allLabs.find(l => !labOcc[l.id][d][s] && !labOcc[l.id][d][s + 1] && !assignedLabs.has(l.id));
                            if (teacher && lab) {
                                selectedNeeds.push({
                                    needId: i,
                                    ...need,
                                    teacherId: teacher,
                                    labId: lab.id
                                });
                                usedGroups.add(need.groupName);
                                assignedTeachers.add(teacher);
                                assignedLabs.add(lab.id);
                                // User specifies exactly 2 parallel labs max. Ask them if they ever want 3? 
                                // "only 2 labs of a class section parallely"
                                if (selectedNeeds.length === 2)
                                    break;
                            }
                        }
                        if (selectedNeeds.length > 0) {
                            generatedLabPayloads.push({
                                classSectionId, day: d, slotStart: s, slotEnd: s + 1, entryType: "LAB",
                                labGroups: selectedNeeds.map(n => ({
                                    groupName: n.groupName,
                                    subjectId: n.subject.id,
                                    labId: n.labId,
                                    teacherId: n.teacherId
                                }))
                            });
                            for (const n of selectedNeeds) {
                                teacherOcc[n.teacherId][d][s] = true;
                                teacherOcc[n.teacherId][d][s + 1] = true;
                                labOcc[n.labId][d][s] = true;
                                labOcc[n.labId][d][s + 1] = true;
                            }
                            classOcc[d][s] = true;
                            classOcc[d][s + 1] = true;
                            const indicesToRemove = selectedNeeds.map(n => n.needId).sort((a, b) => b - a);
                            for (const idx of indicesToRemove)
                                labNeeds.splice(idx, 1);
                            continue; // Move to next slot
                        }
                    }
                    // Attempt THEORY mapping
                    for (let i = 0; i < unplacedTheories.length; i++) {
                        const theory = unplacedTheories[i];
                        const alreadyToday = subjectsToday[d][theory.subject.id] || 0;
                        if (!relaxed && alreadyToday >= 1)
                            continue;
                        const room = findFreeRoom(d, s);
                        const teacherId = findFreeTeacher(theory.subject.id, d, s);
                        if (room && teacherId) {
                            generatedTheoryPayloads.push({
                                classSectionId, day: d, slotStart: s, slotEnd: s, entryType: "THEORY",
                                subjectId: theory.subject.id, roomId: room.id, teacherId
                            });
                            roomOcc[room.id][d][s] = true;
                            teacherOcc[teacherId][d][s] = true;
                            classOcc[d][s] = true;
                            subjectsToday[d][theory.subject.id] = alreadyToday + 1;
                            theory.remaining--;
                            if (theory.remaining === 0)
                                unplacedTheories.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }
        // 6. Report Unplaced Components
        if (labNeeds.length > 0) {
            auditReport.push(`Warning: Could not schedule ${labNeeds.length} individual lab group requirements due to lack of teachers/rooms.`);
            for (const n of labNeeds)
                auditReport.push(`- Skipped Lab: Group ${n.groupName} for ${n.subject.name}`);
        }
        const failedTheories = unplacedTheories.filter(t => t.remaining > 0);
        if (failedTheories.length > 0) {
            auditReport.push(`Warning: Could not schedule the following theory hours due to Teacher/Room conflicts:`);
            for (const t of failedTheories)
                auditReport.push(`- ${t.subject.name}: Missed ${t.remaining} periods.`);
        }
        if (auditReport.length === 0) {
            auditReport.push(`Success! 100% of required classes for this section were completely scheduled. Generated ${generatedTheoryPayloads.length} theory slots and ${generatedLabPayloads.length} lab blocks.`);
        }
        // 7. Write to Database (Transaction)
        await client_1.prisma.$transaction(async (tx) => {
            // Wipe old existing timetable for THIS class
            await tx.timetableEntry.deleteMany({ where: { classSectionId } });
            // Insert Theories
            if (generatedTheoryPayloads.length > 0) {
                await tx.timetableEntry.createMany({ data: generatedTheoryPayloads });
            }
            // Insert Labs (CreateMany doesn't support nested relations in Prisma easily, so map over create)
            for (const lab of generatedLabPayloads) {
                await tx.timetableEntry.create({
                    data: {
                        classSectionId: lab.classSectionId,
                        day: lab.day,
                        slotStart: lab.slotStart,
                        slotEnd: lab.slotEnd,
                        entryType: lab.entryType,
                        labGroups: {
                            create: lab.labGroups
                        }
                    }
                });
            }
        });
        return {
            success: true,
            auditReport,
        };
    }
};
