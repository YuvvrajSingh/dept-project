import type { NextFunction, Request, Response } from "express";
import { teacherService } from "../services/teacher.service";
import { AppError } from "../utils/AppError";

export const teacherController = {
  /** GET /api/teachers/me — returns the Teacher record for the authenticated teacher user. */
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = req.user?.teacherId;
      if (!teacherId) {
        throw new AppError("No teacher profile linked to this account", 403, "FORBIDDEN");
      }
      const data = await teacherService.getTeacherById(teacherId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await teacherService.listTeachers();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await teacherService.getTeacherById(id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await teacherService.createTeacher(req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await teacherService.updateTeacher(id, req.body);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await teacherService.deleteTeacher(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async assignSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = req.params.id as string;
      const { subjectId } = req.body as { subjectId: string };
      const data = await teacherService.assignSubject(teacherId, subjectId);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },

  async removeSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = req.params.id as string;
      const subjectId = req.params.subjectId as string;
      await teacherService.removeSubject(teacherId, subjectId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async getSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = req.params.id as string;
      const data = await teacherService.getTeacherSubjects(teacherId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = req.params.id as string;
      const data = await teacherService.getTeacherSchedule(teacherId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
};
