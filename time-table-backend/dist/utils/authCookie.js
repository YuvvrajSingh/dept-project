"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionCookieMaxAgeMs = sessionCookieMaxAgeMs;
const auth_1 = require("../constants/auth");
const jwtExpiresMs_1 = require("./jwtExpiresMs");
function sessionCookieMaxAgeMs() {
    const expiresIn = process.env.JWT_EXPIRES_IN?.trim() || auth_1.DEFAULT_JWT_EXPIRES_IN;
    return (0, jwtExpiresMs_1.jwtExpiresInToMs)(expiresIn);
}
