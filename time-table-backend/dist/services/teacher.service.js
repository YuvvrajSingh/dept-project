"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherService = void 0;
const client_1 = require("../prisma/client");
const AppError_1 = require("../utils/AppError");
const teacherInclude = {
    teacherSubjects: {
        include: {
            subject: true,
        },
    },
};
const assertTeacherExists = async (teacherId) => {
    const teacher = await client_1.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
        throw new AppError_1.AppError("Teacher not found", 404, "NOT_FOUND");
    }
};
exports.teacherService = {
    listTeachers() {
        return client_1.prisma.teacher.findMany({ orderBy: { id: "asc" } });
    },
    async getTeacherById(id) {
        const teacher = await client_1.prisma.teacher.findUnique({
            where: { id },
            include: teacherInclude,
        });
        if (!teacher) {
            throw new AppError_1.AppError("Teacher not found", 404, "NOT_FOUND");
        }
        return teacher;
    },
    createTeacher(data) {
        return client_1.prisma.teacher.create({ data });
    },
    async updateTeacher(id, data) {
        await assertTeacherExists(id);
        return client_1.prisma.teacher.update({ where: { id }, data });
    },
    async deleteTeacher(id) {
        await assertTeacherExists(id);
        await client_1.prisma.teacher.delete({ where: { id } });
    },
    async assignSubject(teacherId, subjectId) {
        await assertTeacherExists(teacherId);
        const subject = await client_1.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) {
            throw new AppError_1.AppError("Subject not found", 404, "NOT_FOUND");
        }
        const existing = await client_1.prisma.teacherSubject.findUnique({
            where: { teacherId_subjectId: { teacherId, subjectId } },
        });
        if (existing) {
            throw new AppError_1.AppError("Subject already assigned to teacher", 409, "CONFLICT");
        }
        return client_1.prisma.teacherSubject.create({
            data: {
                teacherId,
                subjectId,
            },
        });
    },
    async removeSubject(teacherId, subjectId) {
        await assertTeacherExists(teacherId);
        const existing = await client_1.prisma.teacherSubject.findUnique({
            where: { teacherId_subjectId: { teacherId, subjectId } },
        });
        if (!existing) {
            throw new AppError_1.AppError("Teacher-subject assignment not found", 404, "NOT_FOUND");
        }
        await client_1.prisma.teacherSubject.delete({ where: { id: existing.id } });
    },
    async getTeacherSubjects(teacherId) {
        await assertTeacherExists(teacherId);
        return client_1.prisma.teacherSubject.findMany({
            where: { teacherId },
            include: { subject: true },
            orderBy: { id: "asc" },
        });
    },
    async getTeacherSchedule(teacherId) {
        await assertTeacherExists(teacherId);
        return client_1.prisma.timetableEntry.findMany({
            where: { teacherId },
            include: {
                classSection: {
                    include: {
                        branch: true,
                    },
                },
                subject: true,
                room: true,
            },
            orderBy: [{ day: "asc" }, { slotStart: "asc" }],
        });
    },
};
