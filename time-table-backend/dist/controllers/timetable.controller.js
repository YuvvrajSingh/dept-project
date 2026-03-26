"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timetableController = void 0;
const client_1 = require("@prisma/client");
const timetable_service_1 = require("../services/timetable.service");
exports.timetableController = {
    async getClassTimetable(req, res, next) {
        try {
            const classSectionId = Number(req.params.classSectionId);
            const data = await timetable_service_1.timetableService.getClassTimetable(classSectionId);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async createEntry(req, res, next) {
        try {
            if (req.body.entryType === client_1.EntryType.LAB) {
                const data = await timetable_service_1.timetableService.validateAndCreateLabEntry(req.body);
                res.status(201).json(data);
                return;
            }
            const data = await timetable_service_1.timetableService.validateAndCreateTheoryEntry(req.body);
            res.status(201).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async updateEntry(req, res, next) {
        try {
            const id = Number(req.params.id);
            const data = await timetable_service_1.timetableService.updateEntry(id, req.body);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async deleteEntry(req, res, next) {
        try {
            const id = Number(req.params.id);
            await timetable_service_1.timetableService.deleteEntry(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
    async getTeacherSchedule(req, res, next) {
        try {
            const teacherId = Number(req.params.teacherId);
            const data = await timetable_service_1.timetableService.getTeacherSchedule(teacherId);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async getRoomOccupancy(req, res, next) {
        try {
            const roomId = Number(req.params.roomId);
            const data = await timetable_service_1.timetableService.getRoomOccupancy(roomId);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
};
