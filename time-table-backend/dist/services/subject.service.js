"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectService = void 0;
const client_1 = require("../prisma/client");
const AppError_1 = require("../utils/AppError");
const assertSubjectExists = async (id) => {
    const subject = await client_1.prisma.subject.findUnique({ where: { id } });
    if (!subject) {
        throw new AppError_1.AppError("Subject not found", 404, "NOT_FOUND");
    }
};
exports.subjectService = {
    listSubjects(includeInactive = false) {
        return client_1.prisma.subject.findMany({
            where: includeInactive ? undefined : { isActive: true },
            orderBy: { name: "asc" },
        });
    },
    async getSubjectById(id) {
        const subject = await client_1.prisma.subject.findUnique({ where: { id } });
        if (!subject) {
            throw new AppError_1.AppError("Subject not found", 404, "NOT_FOUND");
        }
        return subject;
    },
    createSubject(data) {
        return client_1.prisma.subject.create({ data });
    },
    async updateSubject(id, data) {
        await assertSubjectExists(id);
        return client_1.prisma.subject.update({ where: { id }, data });
    },
    async deleteSubject(id) {
        await assertSubjectExists(id);
        // Hard delete is blocked (Restrict) if subject is referenced in TimetableEntry or LabGroupEntry.
        // Use deactivateSubject for safe archival instead.
        await client_1.prisma.subject.delete({ where: { id } });
    },
    async deactivateSubject(id) {
        await assertSubjectExists(id);
        return client_1.prisma.subject.update({ where: { id }, data: { isActive: false } });
    },
    async reactivateSubject(id) {
        await assertSubjectExists(id);
        return client_1.prisma.subject.update({ where: { id }, data: { isActive: true } });
    },
};
