"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.labController = void 0;
const lab_service_1 = require("../services/lab.service");
exports.labController = {
    async list(_req, res, next) {
        try {
            const data = await lab_service_1.labService.listLabs();
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async create(req, res, next) {
        try {
            const data = await lab_service_1.labService.createLab(req.body);
            res.status(201).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            const id = Number(req.params.id);
            const data = await lab_service_1.labService.updateLab(id, req.body);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async remove(req, res, next) {
        try {
            const id = Number(req.params.id);
            await lab_service_1.labService.deleteLab(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
};
