"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classController = void 0;
const class_service_1 = require("../services/class.service");
exports.classController = {
    async list(req, res, next) {
        try {
            const academicYearId = req.academicYearId;
            const data = await class_service_1.classService.listClassSections(academicYearId);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async getById(req, res, next) {
        try {
            const id = Number(req.params.id);
            const data = await class_service_1.classService.getClassSectionById(id);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async create(req, res, next) {
        try {
            const data = await class_service_1.classService.createClassSection(req.body);
            res.status(201).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            const id = Number(req.params.id);
            const data = await class_service_1.classService.updateClassSection(id, req.body);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async remove(req, res, next) {
        try {
            const id = Number(req.params.id);
            await class_service_1.classService.deleteClassSection(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
    async assignSubject(req, res, next) {
        try {
            const classSectionId = Number(req.params.id);
            const { subjectId } = req.body;
            const data = await class_service_1.classService.assignSubject(classSectionId, subjectId);
            res.status(201).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async removeSubject(req, res, next) {
        try {
            const classSectionId = Number(req.params.id);
            const subjectId = Number(req.params.subjectId);
            await class_service_1.classService.removeSubject(classSectionId, subjectId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
    async getSubjects(req, res, next) {
        try {
            const classSectionId = Number(req.params.id);
            const data = await class_service_1.classService.getClassSubjects(classSectionId);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
};
