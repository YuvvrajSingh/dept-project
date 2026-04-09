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
            const allEntries = await client_1.prisma.timetableEntry.findMany({
                where: excludeId ? {
                    classSectionId: { not: excludeId }
                } : undefined,
                include: {
                    labGroups: true
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
                if (entry.entryType === "THEORY") {
                    // Add room
                    if (entry.roomId) {
                        addBusy(roomsObj, entry.roomId, entry.day, entry.slotStart);
                    }
                    // Add teacher
                    if (entry.teacherId) {
                        addBusy(teachersObj, entry.teacherId, entry.day, entry.slotStart);
                    }
                }
                else if (entry.entryType === "LAB") {
                    // For labs, it spans 2 or 3 slots depending on slotStart. Let's assume standard 2-slot Lab for simplicity,
                    // or we can just iterate 2 slots as standard
                    const slots = [entry.slotStart, entry.slotStart + 1];
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
