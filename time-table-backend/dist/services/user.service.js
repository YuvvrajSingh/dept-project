"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const AppError_1 = require("../utils/AppError");
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
exports.userService = {
    async createUser(input) {
        const email = normalizeEmail(input.email);
        if (input.role === "TEACHER" && (input.teacherId === undefined || input.teacherId === null)) {
            throw new AppError_1.AppError("Teacher accounts require teacherId", 400, "VALIDATION_ERROR");
        }
        if (input.role === "ADMIN" && input.teacherId != null) {
            throw new AppError_1.AppError("Admin accounts must not have teacherId", 400, "VALIDATION_ERROR");
        }
        const existing = await client_2.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new AppError_1.AppError("An account with this email already exists", 409, "CONFLICT");
        }
        if (input.role === "TEACHER") {
            const teacherId = input.teacherId;
            const linked = await client_2.prisma.user.findUnique({ where: { teacherId } });
            if (linked) {
                throw new AppError_1.AppError("This teacher already has a login account", 409, "CONFLICT");
            }
            const teacher = await client_2.prisma.teacher.findUnique({ where: { id: teacherId } });
            if (!teacher) {
                throw new AppError_1.AppError("Teacher not found", 404, "NOT_FOUND");
            }
            const tEmail = teacher.email?.trim().toLowerCase() ?? null;
            if (tEmail !== null && tEmail !== email) {
                throw new AppError_1.AppError("Email must match the teacher's academic email on file", 400, "VALIDATION_ERROR");
            }
            const passwordHash = await bcryptjs_1.default.hash(input.password, 12);
            return client_2.prisma.$transaction(async (tx) => {
                if (tEmail === null) {
                    await tx.teacher.update({
                        where: { id: teacherId },
                        data: { email },
                    });
                }
                const data = {
                    email,
                    passwordHash,
                    role: client_1.Role.TEACHER,
                    teacher: { connect: { id: teacherId } },
                };
                return tx.user.create({ data });
            });
        }
        const passwordHash = await bcryptjs_1.default.hash(input.password, 12);
        return client_2.prisma.user.create({
            data: {
                email,
                passwordHash,
                role: client_1.Role.ADMIN,
            },
        });
    },
};
