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
    listSubjects() {
        return client_1.prisma.subject.findMany({ orderBy: { id: "asc" } });
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
        await client_1.prisma.subject.delete({ where: { id } });
    },
};
