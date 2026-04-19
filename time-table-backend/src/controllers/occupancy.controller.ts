import { Request, Response } from "express";
import { prisma } from "../prisma/client";
import { getParitySemesterList } from "../utils/semesterParity";

export const occupancyController = {
  getMatrix: async (req: Request, res: Response) => {
    try {
      const excludeClassSectionId = req.query.excludeClassSectionId as string | undefined;
      const academicYearId = req.query.academicYearId as string | undefined;
      
      let semester: number | undefined;

      if (excludeClassSectionId) {
        const classSection = await prisma.classSection.findUnique({
          where: { id: excludeClassSectionId },
          select: { semester: true },
        });
        if (classSection) {
          semester = classSection.semester;
        }
      } else if (req.query.semester) {
        semester = parseInt(req.query.semester as string, 10);
      }

      if (semester === undefined || isNaN(semester)) {
        res.status(400).json({ error: "A valid semester query parameter is required when excludeClassSectionId is not provided." });
        return;
      }
      
      const allEntries = await prisma.timetableEntry.findMany({
        where: {
          ...(excludeClassSectionId ? { classSectionId: { not: excludeClassSectionId } } : {}),
          classSection: {
            ...(academicYearId ? { academicYearId } : {}),
            semester: {
              in: getParitySemesterList(semester),
            },
          },
        },
        include: {
          labGroups: true,
          slot: true,
        }
      });

      // teacherId -> day -> slot[]
      const teachersObj: Record<string, Record<number, number[]>> = {};
      // roomId -> day -> slot[]
      const roomsObj: Record<string, Record<number, number[]>> = {};
      // labId -> day -> slot[]
      const labsObj: Record<string, Record<number, number[]>> = {};

      const addBusy = (map: Record<string, Record<number, number[]>>, id: string | null, day: number, slot: number) => {
        if (!id) return;
        if (!map[id]) map[id] = {};
        if (!map[id][day]) map[id][day] = [];
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
        } else if (entry.entryType === "LAB") {
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
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch occupancy map" });
    }
  }
};
