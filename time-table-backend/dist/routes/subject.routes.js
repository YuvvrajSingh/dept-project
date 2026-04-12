"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const subject_controller_1 = require("../controllers/subject.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
});
const createSubjectSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().trim().min(1),
        name: zod_1.z.string().trim().min(1),
        abbreviation: zod_1.z.string().trim().min(1),
        type: zod_1.z.enum(["THEORY", "LAB"]),
        creditHours: zod_1.z.coerce.number().int().positive(),
    }),
});
const updateSubjectSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        code: zod_1.z.string().trim().min(1).optional(),
        name: zod_1.z.string().trim().min(1).optional(),
        abbreviation: zod_1.z.string().trim().min(1).optional(),
        type: zod_1.z.enum(["THEORY", "LAB"]).optional(),
        creditHours: zod_1.z.coerce.number().int().positive().optional(),
    })
        .refine((body) => Object.keys(body).length > 0, {
        message: "At least one field is required",
    }),
});
const validate = (schema, payload) => {
    schema.parse(payload);
};
router.get("/", subject_controller_1.subjectController.list);
router.get("/:id", (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, subject_controller_1.subjectController.getById);
router.post("/", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(createSubjectSchema, { body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, subject_controller_1.subjectController.create);
router.put("/:id", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        validate(updateSubjectSchema, { body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, subject_controller_1.subjectController.update);
router.delete("/:id", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, subject_controller_1.subjectController.remove);
exports.default = router;
