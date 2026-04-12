"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("../prisma/client");
const AppError_1 = require("../utils/AppError");
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
exports.authService = {
    async validateCredentials(email, password) {
        const normalized = normalizeEmail(email);
        const user = await client_1.prisma.user.findUnique({
            where: { email: normalized },
            include: { teacher: true },
        });
        const invalid = new AppError_1.AppError("Invalid email or password", 401, "UNAUTHORIZED");
        if (!user) {
            throw invalid;
        }
        if (!user.isActive) {
            throw invalid;
        }
        if (user.role === "TEACHER") {
            if (!user.teacherId || !user.teacher) {
                throw invalid;
            }
            if (!user.teacher.isActive) {
                throw invalid;
            }
        }
        const match = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!match) {
            throw invalid;
        }
        return user;
    },
};
