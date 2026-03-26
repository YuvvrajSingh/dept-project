"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherController = void 0;
const teacher_service_1 = require("../services/teacher.service");
exports.teacherController = {
    async list(_req, res, next) {
        try {
            const data = await teacher_service_1.teacherService.listTeachers();
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async getById(req, res, next) {
        try {
            const id = Number(req.params.id);
            const data = await teacher_service_1.teacherService.getTeacherById(id);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async create(req, res, next) {
        try {
            const data = await teacher_service_1.teacherService.createTeacher(req.body);
            res.status(201).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async update(req, res, next) {
        try {
            const id = Number(req.params.id);
            const data = await teacher_service_1.teacherService.updateTeacher(id, req.body);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async remove(req, res, next) {
        try {
            const id = Number(req.params.id);
            await teacher_service_1.teacherService.deleteTeacher(id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
    async assignSubject(req, res, next) {
        try {
            const teacherId = Number(req.params.id);
            const { subjectId } = req.body;
            const data = await teacher_service_1.teacherService.assignSubject(teacherId, subjectId);
            res.status(201).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async removeSubject(req, res, next) {
        try {
            const teacherId = Number(req.params.id);
            const subjectId = Number(req.params.subjectId);
            await teacher_service_1.teacherService.removeSubject(teacherId, subjectId);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    },
    async getSubjects(req, res, next) {
        try {
            const teacherId = Number(req.params.id);
            const data = await teacher_service_1.teacherService.getTeacherSubjects(teacherId);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
    async getSchedule(req, res, next) {
        try {
            const teacherId = Number(req.params.id);
            const data = await teacher_service_1.teacherService.getTeacherSchedule(teacherId);
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    },
};
