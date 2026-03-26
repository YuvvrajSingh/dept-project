"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectController = void 0;
const subject_service_1 = require("../services/subject.service");
exports.subjectController = {
    async list(_req, res, next) {
        try {
            const data = await subject_service_1.subjectService.listSubjects();
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async getById(req, res, next) {
        try {
            const id = Number(req.params.id);
            const data = await subject_service_1.subjectService.getSubjectById(id);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async create(req, res, next) {
        try {
            const data = await subject_service_1.subjectService.createSubject(req.body);
            res.status(201).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            const id = Number(req.params.id);
            const data = await subject_service_1.subjectService.updateSubject(id, req.body);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async remove(req, res, next) {
        try {
            const id = Number(req.params.id);
            await subject_service_1.subjectService.deleteSubject(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
};
