"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireAdmin = requireAdmin;
exports.signSessionToken = signSessionToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../constants/auth");
const AppError_1 = require("../utils/AppError");
function jwtSecret() {
    const s = process.env.JWT_SECRET?.trim();
    if (!s) {
        throw new AppError_1.AppError("Server is missing JWT_SECRET. Add it to time-table-backend/.env (same value as the Next app).", 500, "CONFIG_ERROR");
    }
    return s;
}
function readToken(req) {
    const fromCookie = req.cookies?.[auth_1.SESSION_COOKIE_NAME];
    if (fromCookie) {
        return fromCookie;
    }
    const h = req.headers.authorization;
    if (h?.startsWith("Bearer ")) {
        return h.slice(7).trim();
    }
    return undefined;
}
function verifyAndAttachUser(req) {
    const token = readToken(req);
    if (!token) {
        return { status: 401, code: "UNAUTHORIZED", message: "Authentication required" };
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, jwtSecret());
        const id = Number(payload.sub);
        if (!Number.isFinite(id)) {
            return { status: 401, code: "UNAUTHORIZED", message: "Invalid session" };
        }
        req.user = {
            id,
            role: payload.role,
            teacherId: payload.teacherId ?? null,
        };
        return { ok: true };
    }
    catch {
        return { status: 401, code: "UNAUTHORIZED", message: "Invalid or expired session" };
    }
}
function authenticate(req, res, next) {
    const result = verifyAndAttachUser(req);
    if (!("ok" in result)) {
        return res.status(result.status).json({ error: result.code, message: result.message });
    }
    next();
}
function requireAdmin(req, res, next) {
    const result = verifyAndAttachUser(req);
    if (!("ok" in result)) {
        return res.status(result.status).json({ error: result.code, message: result.message });
    }
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "FORBIDDEN", message: "Admin access required" });
    }
    next();
}
function signSessionToken(user) {
    const expiresIn = process.env.JWT_EXPIRES_IN?.trim() || auth_1.DEFAULT_JWT_EXPIRES_IN;
    const options = { expiresIn };
    return jsonwebtoken_1.default.sign({
        sub: String(user.id),
        role: user.role,
        teacherId: user.teacherId,
    }, jwtSecret(), options);
}
