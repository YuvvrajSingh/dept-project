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
        if (entry.entryType === "THEORY") {
            matrix[dayKey].slots[String(entry.slotStart)] = {
                type: "THEORY",
                entryId: entry.id,
                subjectId: entry.subjectId,
                teacherId: entry.teacherId,
                roomId: entry.roomId,
                subjectCode: entry.subject.code,
                subjectName: entry.subject.name,
                teacherAbbr: entry.teacher?.abbreviation ?? null,
                roomName: entry.room?.name ?? null,
            };
            continue;
        }
        if (entry.slotStart === 5) {
            const groups = entry.labGroups.reduce((acc, group) => {
                acc[group.groupName] = {
                    labId: group.labId,
                    teacherId: group.teacherId,
                    lab: group.lab.name,
                    teacher: group.teacher.abbreviation,
                };
                return acc;
            }, {});
            matrix[dayKey].slots["5"] = {
                type: "LAB",
                entryId: entry.id,
                subjectId: entry.subjectId,
                subjectCode: entry.subject.code,
                subjectName: entry.subject.name,
                spansSlots: [5, 6],
                groups,
            };
            matrix[dayKey].slots["6"] = {
                type: "LAB_CONTINUATION",
                mergedWith: 5,
            };
        }
    }
    return matrix;
}
