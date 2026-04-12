"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.occupancyController = void 0;
const client_1 = require("../prisma/client");
exports.occupancyController = {
    getMatrix: async (req, res) => {
        try {
            let excludeId = undefined;
            if (req.query.excludeClassSectionId && req.query.excludeClassSectionId !== "undefined" && req.query.excludeClassSectionId !== "null") {
                const parsed = parseInt(req.query.excludeClassSectionId, 10);
                if (!isNaN(parsed))
                    excludeId = parsed;
            }
            let academicYearId = undefined;
            if (req.query.academicYearId && req.query.academicYearId !== "undefined") {
                const parsed = parseInt(req.query.academicYearId, 10);
                if (!isNaN(parsed))
                    academicYearId = parsed;
            }
            const allEntries = await client_1.prisma.timetableEntry.findMany({
                where: {
                    ...(excludeId ? { classSectionId: { not: excludeId } } : {}),
                    ...(academicYearId ? { classSection: { academicYearId } } : {}),
                },
                include: {
                    labGroups: true,
                    slot: true,
                }
            });
            // teacherId -> day -> slot[]
            const teachersObj = {};
            // roomId -> day -> slot[]
            const roomsObj = {};
            // labId -> day -> slot[]
            const labsObj = {};
            const addBusy = (map, id, day, slot) => {
                if (!id)
                    return;
                if (!map[id])
                    map[id] = {};
                if (!map[id][day])
                    map[id][day] = [];
                if (!map[id][day].includes(slot)) {
                    map[id][day].push(slot);
                }
            };
            allEntries.forEach((entry) => {
                const slotOrder = entry.slot.order;
                if (entry.entryType === "LECTURE") {
                    if (entry.roomId) {
                        addBusy(roomsObj, entry.roomId, entry.day, slotOrder);
                    }
                    if (entry.teacherId) {
                        addBusy(teachersObj, entry.teacherId, entry.day, slotOrder);
                    }
                }
                else if (entry.entryType === "LAB") {
                    // LAB spans startSlot and startSlot+1
                    const slots = [slotOrder, slotOrder + 1];
                    slots.forEach(slot => {
                        entry.labGroups.forEach(le => {
                            addBusy(labsObj, le.labId, entry.day, slot);
                            addBusy(teachersObj, le.teacherId, entry.day, slot);
                        });
                    });
                }
            });
            res.status(200).json({
                teachers: teachersObj,
                rooms: roomsObj,
                labs: labsObj
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch occupancy map" });
        }
    }
};
