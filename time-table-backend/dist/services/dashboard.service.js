"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = void 0;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
exports.dashboardService = {
    async getMetrics(academicYearId) {
        // Resolve which academic year to use
        let resolvedYearId = academicYearId;
        if (!resolvedYearId) {
            const activeYear = await client_2.prisma.academicYear.findFirst({ where: { isActive: true } });
            resolvedYearId = activeYear?.id;
        }
        const yearFilter = resolvedYearId ? { academicYearId: resolvedYearId } : {};
        // 1. Global Progress Tracker
        const classes = await client_2.prisma.classSection.findMany({
            where: yearFilter,
            include: {
                branch: true,
                subjects: { include: { subject: true } },
                timetable: { include: { labGroups: true } }
            }
        });
        const progress = classes.map((c) => {
            // Calculate required slots based on credit hours + lab needs
            let requiredSlots = 0;
            let scheduledSlots = 0;
            c.subjects.forEach((cs) => {
                if (cs.subject.type === "THEORY") {
                    requiredSlots += cs.subject.creditHours;
                }
                else {
                    requiredSlots += 6;
                }
            });
            // Calculate filled slots
            c.timetable.forEach((entry) => {
                if (entry.entryType === client_1.TimetableEntryType.LECTURE) {
                    scheduledSlots += 1;
                }
                else if (entry.entryType === client_1.TimetableEntryType.LAB) {
                    // LAB always spans 2 consecutive slots
                    scheduledSlots += entry.labGroups.length * 2;
                }
            });
            return {
                classSectionId: c.id,
                name: `${c.branch.name} - Year ${c.year}`,
                required: requiredSlots,
                scheduled: scheduledSlots,
                percentage: requiredSlots > 0 ? Math.min(100, Math.round((scheduledSlots / requiredSlots) * 100)) : 100
            };
        });
        // 2. Teacher Workload (Hours per week) — scoped to academic year
        const teachers = await client_2.prisma.teacher.findMany({
            include: {
                timetableEntries: {
                    where: resolvedYearId ? { classSection: { academicYearId: resolvedYearId } } : {},
                },
                labGroupEntries: {
                    where: resolvedYearId ? { timetableEntry: { classSection: { academicYearId: resolvedYearId } } } : {},
                    include: { timetableEntry: true }
                }
            }
        });
        const workload = teachers.map((t) => {
            let hours = 0;
            t.timetableEntries.forEach((entry) => {
                if (entry.entryType === client_1.TimetableEntryType.LECTURE)
                    hours += 1;
            });
            t.labGroupEntries.forEach((_lab) => {
                // LAB always spans 2 slots
                hours += 2;
            });
            return {
                teacherId: t.id,
                name: t.name,
                abbreviation: t.abbreviation,
                hours
            };
        });
        // Sort by hours descending
        workload.sort((a, b) => b.hours - a.hours);
        // 3. Room Utilization Heatmap — scoped to academic year
        const allRooms = await client_2.prisma.room.findMany();
        const timetable = await client_2.prisma.timetableEntry.findMany({
            where: {
                entryType: { in: [client_1.TimetableEntryType.LECTURE] },
                roomId: { not: null },
                ...(resolvedYearId ? { classSection: { academicYearId: resolvedYearId } } : {}),
            },
            include: { room: true, slot: true }
        });
        const heatmap = {};
        for (let d = 1; d <= 6; d++) {
            heatmap[d] = {
                1: { occupied: 0, occupiedRoomIds: new Set() },
                2: { occupied: 0, occupiedRoomIds: new Set() },
                3: { occupied: 0, occupiedRoomIds: new Set() },
                4: { occupied: 0, occupiedRoomIds: new Set() },
                5: { occupied: 0, occupiedRoomIds: new Set() },
                6: { occupied: 0, occupiedRoomIds: new Set() }
            };
        }
        timetable.forEach((entry) => {
            const slotOrder = entry.slot?.order;
            if (entry.roomId && heatmap[entry.day] && slotOrder && heatmap[entry.day][slotOrder]) {
                heatmap[entry.day][slotOrder].occupied += 1;
                heatmap[entry.day][slotOrder].occupiedRoomIds.add(entry.roomId);
            }
        });
        const heatmapFormatted = [];
        for (let d = 1; d <= 6; d++) {
            for (let s = 1; s <= 6; s++) {
                const stats = heatmap[d][s];
                const percentage = allRooms.length > 0 ? Math.round((stats.occupied / allRooms.length) * 100) : 0;
                const freeRooms = allRooms.filter(r => !stats.occupiedRoomIds.has(r.id)).map(r => r.name);
                heatmapFormatted.push({
                    day: d,
                    slot: s,
                    percentage,
                    occupied: stats.occupied,
                    total: allRooms.length,
                    freeRooms
                });
            }
        }
        // 4. Live Audit Log — self-contained historical records
        const logs = await client_2.prisma.notificationLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 20
        });
        const auditFeed = logs.map((l) => ({
            id: l.id,
            timestamp: l.createdAt.toISOString(),
            type: l.type,
            performedBy: l.performedBy,
            message: l.message,
            metadata: l.metadata,
            classSectionId: l.metadata?.classSectionId || null,
        }));
        // Get academic year info to return
        const academicYear = resolvedYearId
            ? await client_2.prisma.academicYear.findUnique({ where: { id: resolvedYearId } })
            : null;
        return {
            academicYear,
            progress,
            workload,
            heatmap: heatmapFormatted,
            auditFeed
        };
    }
};
