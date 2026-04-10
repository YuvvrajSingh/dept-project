import type { NextFunction, Request, Response } from "express";
import { academicYearService } from "../services/academicYear.service";

export const academicYearController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await academicYearService.list();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = await academicYearService.getById(id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getActive(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await academicYearService.getActive();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await academicYearService.create(req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = await academicYearService.update(id, req.body);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = await academicYearService.updateStatus(id, req.body.status);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const data = await academicYearService.activate(id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async clone(req: Request, res: Response, next: NextFunction) {
    try {
      const targetId = Number(req.params.id);
      const sourceId = Number(req.body.sourceId);
      const data = await academicYearService.clone(sourceId, targetId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await academicYearService.remove(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async removeAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await academicYearService.removeAll();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
