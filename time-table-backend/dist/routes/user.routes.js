"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAdmin);
const createUserSchema = zod_1.z
    .object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8),
        role: zod_1.z.enum(["ADMIN", "TEACHER"]),
        teacherId: zod_1.z.coerce.number().int().positive().optional(),
    }),
})
    .superRefine((data, ctx) => {
    const b = data.body;
    if (b.role === "TEACHER" && b.teacherId == null) {
        ctx.addIssue({
            code: "custom",
            message: "teacherId is required when role is TEACHER",
            path: ["body", "teacherId"],
        });
    }
    if (b.role === "ADMIN" && b.teacherId != null) {
        ctx.addIssue({
            code: "custom",
            message: "teacherId must be omitted when role is ADMIN",
            path: ["body", "teacherId"],
        });
    }
});
router.post("/", (req, _res, next) => {
    try {
        createUserSchema.parse({ body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, user_controller_1.userController.create);
exports.default = router;
