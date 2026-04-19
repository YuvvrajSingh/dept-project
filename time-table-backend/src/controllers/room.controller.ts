import type { NextFunction, Request, Response } from "express";
import { roomService } from "../services/room.service";

export const roomController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await roomService.listRooms();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await roomService.createRoom(req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await roomService.updateRoom(id, req.body);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await roomService.deleteRoom(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
