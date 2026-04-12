"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classService = void 0;
const client_1 = require("../prisma/client");
const client_2 = require("@prisma/client");
const AppError_1 = require("../utils/AppError");
const assertClassExists = async (id) => {
    const classSection = await client_1.prisma.classSection.findUnique({
        where: { id },
        include: { academicYear: true },
    });
    if (!classSection) {
        throw new AppError_1.AppError("Class section not found", 404, "NOT_FOUND");
    }
    return classSection;
};
const assertNotArchived = async (academicYearId) => {
    const year = await client_1.prisma.academicYear.findUnique({ where: { id: academicYearId } });
    if (!year) {
        throw new AppError_1.AppError("Academic year not found", 404, "NOT_FOUND");
    }
    if (year.status === client_2.AcademicYearStatus.ARCHIVED) {
        throw new AppError_1.AppError("Cannot modify data in an archived academic year", 403, "FORBIDDEN");
    }
    return year;
};
exports.classService = {
    listClassSections(academicYearId) {
        return client_1.prisma.classSection.findMany({
            where: academicYearId ? { academicYearId } : undefined,
            include: { branch: true, academicYear: true },
            orderBy: [{ branchId: "asc" }, { year: "asc" }],
        });
    },
    async getClassSectionById(id) {
        const classSection = await client_1.prisma.classSection.findUnique({
            where: { id },
            include: { branch: true, academicYear: true },
        });
        if (!classSection) {
            throw new AppError_1.AppError("Class section not found", 404, "NOT_FOUND");
        }
        return classSection;
    },
    async createClassSection(data) {
        await assertNotArchived(data.academicYearId);
        const branch = await client_1.prisma.branch.upsert({
            where: { name: data.branchName },
            update: {},
            create: { name: data.branchName },
        });
        const existing = await client_1.prisma.classSection.findUnique({
            where: {
                academicYearId_branchId_year_semester: {
                    academicYearId: data.academicYearId,
                    branchId: branch.id,
                    year: data.year,
                    semester: data.semester,
                },
            },
        });
        if (existing) {
            throw new AppError_1.AppError("Class section already exists for this branch, year, and semester in this academic year", 409, "CONFLICT");
        }
        return client_1.prisma.classSection.create({
            data: {
                academicYearId: data.academicYearId,
                branchId: branch.id,
                year: data.year,
                semester: data.semester,
            },
            include: { branch: true, academicYear: true },
        });
    },
    async updateClassSection(id, data) {
        const classSection = await assertClassExists(id);
        await assertNotArchived(classSection.academicYearId);
        let updatedBranchId;
        if (data.branchName !== undefined) {
            const branch = await client_1.prisma.branch.upsert({
                where: { name: data.branchName },
                update: {},
                create: { name: data.branchName },
            });
            updatedBranchId = branch.id;
        }
        if (updatedBranchId !== undefined || data.year !== undefined || data.semester !== undefined) {
            const current = await client_1.prisma.classSection.findUnique({ where: { id } });
            if (!current) {
                throw new AppError_1.AppError("Class section not found", 404, "NOT_FOUND");
            }
            const branchId = updatedBranchId ?? current.branchId;
            const year = data.year ?? current.year;
            const semester = data.semester ?? current.semester;
            const duplicate = await client_1.prisma.classSection.findFirst({
                where: {
                    academicYearId: current.academicYearId,
                    branchId,
                    year,
                    semester,
                    NOT: { id },
                },
            });
            if (duplicate) {
                throw new AppError_1.AppError("Class section already exists for this branch, year, and semester in this academic year", 409, "CONFLICT");
            }
        }
        return client_1.prisma.classSection.update({
            where: { id },
            data: {
                ...(updatedBranchId !== undefined && { branchId: updatedBranchId }),
                ...(data.year !== undefined && { year: data.year }),
                ...(data.semester !== undefined && { semester: data.semester }),
            },
            include: { branch: true, academicYear: true },
        });
    },
    async deleteClassSection(id) {
        const classSection = await assertClassExists(id);
        await assertNotArchived(classSection.academicYearId);
        await client_1.prisma.classSection.delete({ where: { id } });
    },
    async assignSubject(classSectionId, subjectId) {
        const classSection = await assertClassExists(classSectionId);
        await assertNotArchived(classSection.academicYearId);
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
        const classSection = await assertClassExists(classSectionId);
        await assertNotArchived(classSection.academicYearId);
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
