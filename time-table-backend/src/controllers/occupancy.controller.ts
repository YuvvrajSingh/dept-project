import { Request, Response } from "express";
import { prisma } from "../prisma/client";

export const occupancyController = {
  getMatrix: async (req: Request, res: Response) => {
    try {
      let excludeId: number | undefined = undefined;
      if (req.query.excludeClassSectionId && req.query.excludeClassSectionId !== "undefined" && req.query.excludeClassSectionId !== "null") {
         const parsed = parseInt(req.query.excludeClassSectionId as string, 10);
         if (!isNaN(parsed)) excludeId = parsed;
      }

      let academicYearId: number | undefined = undefined;
      if (req.query.academicYearId && req.query.academicYearId !== "undefined") {
        const parsed = parseInt(req.query.academicYearId as string, 10);
        if (!isNaN(parsed)) academicYearId = parsed;
      }
      
      const allEntries = await prisma.timetableEntry.findMany({
        where: {
          ...(excludeId ? { classSectionId: { not: excludeId } } : {}),
          ...(academicYearId ? { classSection: { academicYearId } } : {}),
        },
        include: {
          labGroups: true
        }
      });

      // teacherId -> day -> slot[]
      const teachersObj: Record<number, Record<number, number[]>> = {};
      // roomId -> day -> slot[]
      const roomsObj: Record<number, Record<number, number[]>> = {};
      // labId -> day -> slot[]
      const labsObj: Record<number, Record<number, number[]>> = {};

      const addBusy = (map: Record<number, Record<number, number[]>>, id: number | null, day: number, slot: number) => {
        if (!id) return;
        if (!map[id]) map[id] = {};
        if (!map[id][day]) map[id][day] = [];
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
        } else if (entry.entryType === "LAB") {
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
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch occupancy map" });
    }
  }
};
