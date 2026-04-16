import type { NextFunction, Request, Response } from "express";
import { TimetableEntryType } from "@prisma/client";
import { prisma } from "../prisma/client";
import { timetableService } from "../services/timetable.service";
import { pdfService } from "../services/pdf.service";
import { autoSchedulerService } from "../services/autoScheduler.service";

export const timetableController = {
  async getClassTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const classSectionId = Number(req.params.classSectionId);
      const data = await timetableService.getClassTimetable(classSectionId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async createEntry(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.body.entryType === TimetableEntryType.LAB) {
        const data = await timetableService.validateAndCreateLabEntry(req.body);
        res.status(201).json(data);
        return;
      }

      const data = await timetableService.validateAndCreateTheoryEntry(req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },

  async updateEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = await timetableService.updateEntry(id, req.body);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async deleteEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await timetableService.deleteEntry(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async getTeacherSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = Number(req.params.teacherId);
      const academicYearId = req.query.academicYearId ? Number(req.query.academicYearId) : undefined;
      const data = await timetableService.getTeacherSchedule(teacherId, academicYearId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async exportTimetablePdf(req: Request, res: Response, next: NextFunction) {
    try {
      const classSectionId = Number(req.params.classSectionId);
      const { buffer, fileName } = await pdfService.generateTimetablePdf(classSectionId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  },

  async getRoomOccupancy(req: Request, res: Response, next: NextFunction) {
    try {
      const roomId = Number(req.params.roomId);
      const academicYearId = req.query.academicYearId ? Number(req.query.academicYearId) : undefined;
      const data = await timetableService.getRoomOccupancy(roomId, academicYearId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async generateTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const classSectionId = Number(req.params.classSectionId);
      const result = await autoSchedulerService.generateTimetable(classSectionId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async clearTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const classSectionId = Number(req.params.classSectionId);
      await prisma.timetableEntry.deleteMany({
         where: { classSectionId }
      });
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async clearGlobalTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.timetableEntry.deleteMany({});
      res.status(200).json({ success: true });
    } catch (error) {
       next(error);
    }
  },

  async factoryReset(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await timetableService.factoryReset();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async cancelToday(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const reason = req.body.reason as string | undefined;
      // We assume `req.user` is populated by the `authenticate` middleware
      const user = req.user!;
      const result = await timetableService.cancelToday(id, reason, user);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async undoCancelToday(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const user = req.user!;
      const result = await timetableService.undoCancelToday(id, user);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getTodayCancellations(req: Request, res: Response, next: NextFunction) {
    try {
      const classSectionId = Number(req.query.classSectionId);
      if (!classSectionId) {
        return res.status(400).json({ error: "Missing classSectionId query parameter" });
      }
      const result = await timetableService.getTodayCancellations(classSectionId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
