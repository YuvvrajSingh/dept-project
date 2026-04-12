"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMatrix = buildMatrix;
const timetableConstants_1 = require("./timetableConstants");
function buildMatrix(entries) {
    const matrix = {};
    for (let day = 1; day <= 6; day += 1) {
        matrix[String(day)] = {
            label: timetableConstants_1.DAY_LABELS[day],
            slots: {
                "1": null,
                "2": null,
                "3": null,
                "4": null,
                "5": null,
                "6": null,
            },
        };
    }
    for (const entry of entries) {
        const dayKey = String(entry.day);
        const slotOrder = entry.slot.order; // use order (1-6) as the matrix key
        if (entry.entryType === "LECTURE") {
            if (!entry.subject) {
                continue;
            }
            matrix[dayKey].slots[String(slotOrder)] = {
                type: "THEORY",
                entryId: entry.id,
                subjectId: entry.subjectId ?? entry.subject.id,
                teacherId: entry.teacherId,
                roomId: entry.roomId,
                subjectCode: entry.subject.code,
                subjectName: entry.subject.name,
                teacherAbbr: entry.teacher?.abbreviation ?? null,
                roomName: entry.room?.name ?? null,
            };
            continue;
        }
        // LAB entry — populate start slot and continuation slot(s)
        const groups = entry.labGroups.reduce((acc, group) => {
            acc[group.groupName] = {
                subjectId: group.subjectId,
                subjectCode: group.subject.code,
                subjectName: group.subject.name,
                labId: group.labId,
                teacherId: group.teacherId,
                lab: group.lab.name,
                teacher: group.teacher.abbreviation,
            };
            return acc;
        }, {});
        matrix[dayKey].slots[String(slotOrder)] = {
            type: "LAB",
            entryId: entry.id,
            groups,
        };
        // LAB spans two consecutive slots: mark order+1 as a continuation cell
        const continuationOrder = slotOrder + 1;
        if (continuationOrder <= 6) {
            matrix[dayKey].slots[String(continuationOrder)] = {
                type: "LAB_CONTINUATION",
                entryId: entry.id,
            };
        }
    }
    return matrix;
}
