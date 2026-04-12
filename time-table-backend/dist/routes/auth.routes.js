"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const loginRateLimit_1 = require("../middleware/loginRateLimit");
const router = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(1),
    }),
});
router.post("/login", loginRateLimit_1.loginRateLimit, (req, _res, next) => {
    try {
        loginSchema.parse({ body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, auth_controller_1.authController.login);
router.post("/logout", auth_controller_1.authController.logout);
router.get("/me", auth_middleware_1.authenticate, auth_controller_1.authController.me);
exports.default = router;
