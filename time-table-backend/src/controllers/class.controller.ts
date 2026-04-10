import type { NextFunction, Request, Response } from "express";
import { classService } from "../services/class.service";

export const classController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const academicYearId = (req as any).academicYearId as number | undefined;
      const data = await classService.listClassSections(academicYearId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = await classService.getClassSectionById(id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await classService.createClassSection(req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = await classService.updateClassSection(id, req.body);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await classService.deleteClassSection(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async assignSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const classSectionId = Number(req.params.id);
      const { subjectId } = req.body as { subjectId: number };
      const data = await classService.assignSubject(classSectionId, subjectId);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },

  async removeSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const classSectionId = Number(req.params.id);
      const subjectId = Number(req.params.subjectId);
      await classService.removeSubject(classSectionId, subjectId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async getSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const classSectionId = Number(req.params.id);
      const data = await classService.getClassSubjects(classSectionId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
};
