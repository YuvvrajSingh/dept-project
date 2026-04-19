import type { NextFunction, Request, Response } from "express";
import { labService } from "../services/lab.service";

export const labController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await labService.listLabs();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await labService.createLab(req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await labService.updateLab(id, req.body);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await labService.deleteLab(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
