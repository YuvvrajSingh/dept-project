"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicYearController = void 0;
const academicYear_service_1 = require("../services/academicYear.service");
exports.academicYearController = {
    async list(_req, res, next) {
        try {
            const data = await academicYear_service_1.academicYearService.list();
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async getById(req, res, next) {
        try {
            const id = Number(req.params.id);
            const data = await academicYear_service_1.academicYearService.getById(id);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async getActive(_req, res, next) {
        try {
            const data = await academicYear_service_1.academicYearService.getActive();
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async create(req, res, next) {
        try {
            const data = await academicYear_service_1.academicYearService.create(req.body);
            res.status(201).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            const id = Number(req.params.id);
            const data = await academicYear_service_1.academicYearService.update(id, req.body);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async updateStatus(req, res, next) {
        try {
            const id = Number(req.params.id);
            const data = await academicYear_service_1.academicYearService.updateStatus(id, req.body.status);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async activate(req, res, next) {
        try {
            const id = Number(req.params.id);
            const data = await academicYear_service_1.academicYearService.activate(id);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async clone(req, res, next) {
        try {
            const targetId = Number(req.params.id);
            const sourceId = Number(req.body.sourceId);
            const data = await academicYear_service_1.academicYearService.clone(sourceId, targetId);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async remove(req, res, next) {
        try {
            const id = Number(req.params.id);
            await academicYear_service_1.academicYearService.remove(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
    async removeAll(_req, res, next) {
        try {
            const result = await academicYear_service_1.academicYearService.removeAll();
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    },
};
