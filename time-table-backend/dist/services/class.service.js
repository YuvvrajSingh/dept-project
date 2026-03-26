"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classService = void 0;
const client_1 = require("../prisma/client");
const AppError_1 = require("../utils/AppError");
const assertClassExists = async (id) => {
    const classSection = await client_1.prisma.classSection.findUnique({ where: { id } });
    if (!classSection) {
        throw new AppError_1.AppError("Class section not found", 404, "NOT_FOUND");
    }
};
exports.classService = {
    listClassSections() {
        return client_1.prisma.classSection.findMany({
            include: { branch: true },
            orderBy: [{ branchId: "asc" }, { year: "asc" }],
        });
    },
    async getClassSectionById(id) {
        const classSection = await client_1.prisma.classSection.findUnique({
            where: { id },
            include: { branch: true },
        });
        if (!classSection) {
            throw new AppError_1.AppError("Class section not found", 404, "NOT_FOUND");
        }
        return classSection;
    },
    async createClassSection(data) {
        const branch = await client_1.prisma.branch.findUnique({ where: { id: data.branchId } });
        if (!branch) {
            throw new AppError_1.AppError("Branch not found", 404, "NOT_FOUND");
        }
        const existing = await client_1.prisma.classSection.findUnique({
            where: {
                branchId_year: {
                    branchId: data.branchId,
                    year: data.year,
                },
            },
        });
        if (existing) {
            throw new AppError_1.AppError("Class section already exists for this branch and year", 409, "CONFLICT");
        }
        return client_1.prisma.classSection.create({
            data,
            include: { branch: true },
        });
    },
    async updateClassSection(id, data) {
        await assertClassExists(id);
        if (data.branchId !== undefined) {
            const branch = await client_1.prisma.branch.findUnique({ where: { id: data.branchId } });
            if (!branch) {
                throw new AppError_1.AppError("Branch not found", 404, "NOT_FOUND");
            }
        }
        if (data.branchId !== undefined || data.year !== undefined) {
            const current = await client_1.prisma.classSection.findUnique({ where: { id } });
            if (!current) {
                throw new AppError_1.AppError("Class section not found", 404, "NOT_FOUND");
            }
            const branchId = data.branchId ?? current.branchId;
            const year = data.year ?? current.year;
            const duplicate = await client_1.prisma.classSection.findFirst({
                where: {
                    branchId,
                    year,
                    NOT: { id },
                },
            });
            if (duplicate) {
                throw new AppError_1.AppError("Class section already exists for this branch and year", 409, "CONFLICT");
            }
        }
        return client_1.prisma.classSection.update({
            where: { id },
            data,
            include: { branch: true },
        });
    },
    async deleteClassSection(id) {
        await assertClassExists(id);
        await client_1.prisma.classSection.delete({ where: { id } });
    },
    async assignSubject(classSectionId, subjectId) {
        await assertClassExists(classSectionId);
        const subject = await client_1.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) {
            throw new AppError_1.AppError("Subject not found", 404, "NOT_FOUND");
        }
        const existing = await client_1.prisma.classSubject.findUnique({
            where: { classSectionId_subjectId: { classSectionId, subjectId } },
        });
        if (existing) {
            throw new AppError_1.AppError("Subject already assigned to class", 409, "CONFLICT");
        }
        return client_1.prisma.classSubject.create({
            data: {
                classSectionId,
                subjectId,
            },
        });
    },
    async removeSubject(classSectionId, subjectId) {
        await assertClassExists(classSectionId);
        const existing = await client_1.prisma.classSubject.findUnique({
            where: { classSectionId_subjectId: { classSectionId, subjectId } },
        });
        if (!existing) {
            throw new AppError_1.AppError("Class-subject assignment not found", 404, "NOT_FOUND");
        }
        await client_1.prisma.classSubject.delete({ where: { id: existing.id } });
    },
    async getClassSubjects(classSectionId) {
        await assertClassExists(classSectionId);
        return client_1.prisma.classSubject.findMany({
            where: { classSectionId },
            include: {
                subject: true,
            },
            orderBy: {
                id: "asc",
            },
        });
    },
};
