"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomController = void 0;
const room_service_1 = require("../services/room.service");
exports.roomController = {
    async list(_req, res, next) {
        try {
            const data = await room_service_1.roomService.listRooms();
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async create(req, res, next) {
        try {
            const data = await room_service_1.roomService.createRoom(req.body);
            res.status(201).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            const id = Number(req.params.id);
            const data = await room_service_1.roomService.updateRoom(id, req.body);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async remove(req, res, next) {
        try {
            const id = Number(req.params.id);
            await room_service_1.roomService.deleteRoom(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
};
