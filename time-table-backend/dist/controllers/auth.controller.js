"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_1 = require("../constants/auth");
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("../prisma/client");
const auth_service_1 = require("../services/auth.service");
const authCookie_1 = require("../utils/authCookie");
exports.authController = {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (typeof email !== "string" || typeof password !== "string") {
                return res.status(400).json({
                    error: "VALIDATION_ERROR",
                    message: "email and password are required",
                });
            }
            const user = await auth_service_1.authService.validateCredentials(email, password);
            const token = (0, auth_middleware_1.signSessionToken)({
                id: user.id,
                role: user.role,
                teacherId: user.teacherId,
            });
            res.cookie(auth_1.SESSION_COOKIE_NAME, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: (0, authCookie_1.sessionCookieMaxAgeMs)(),
                path: "/",
            });
            res.status(200).json({
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    teacherId: user.teacherId,
                },
            });
        }
        catch (error) {
            next(error);
        }
    },
    logout(_req, res) {
        res.clearCookie(auth_1.SESSION_COOKIE_NAME, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
        res.status(204).send();
    },
    async me(req, res, next) {
        try {
            const id = req.user.id;
            const user = await client_1.prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    teacherId: true,
                    isActive: true,
                },
            });
            if (!user || !user.isActive) {
                return res.status(401).json({
                    error: "UNAUTHORIZED",
                    message: "Session is no longer valid",
                });
            }
            res.status(200).json({ user });
        }
        catch (error) {
            next(error);
        }
    },
};
