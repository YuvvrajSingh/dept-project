import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";

export const dashboardController = {
  async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getMetrics();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
};
