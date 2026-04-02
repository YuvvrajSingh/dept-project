import type { NextFunction, Request, Response } from "express";
import { EntryType } from "@prisma/client";
import { timetableService } from "../services/timetable.service";
import { pdfService } from "../services/pdf.service";

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
      if (req.body.entryType === EntryType.LAB) {
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
      const data = await timetableService.getTeacherSchedule(teacherId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async exportTimetablePdf(req: Request, res: Response, next: NextFunction) {
    try {
      const classSectionId = Number(req.params.classSectionId);
      const pdfBuffer = await pdfService.generateTimetablePdf(classSectionId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="timetable-${classSectionId}.pdf"`);
      res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  },

  async getRoomOccupancy(req: Request, res: Response, next: NextFunction) {
    try {
      const roomId = Number(req.params.roomId);
      const data = await timetableService.getRoomOccupancy(roomId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
};
