import type { NextFunction, Request, Response } from "express";
import { subjectService } from "../services/subject.service";

export const subjectController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await subjectService.listSubjects();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await subjectService.getSubjectById(id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await subjectService.createSubject(req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await subjectService.updateSubject(id, req.body);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await subjectService.deleteSubject(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
