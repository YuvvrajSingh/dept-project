"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const teacher_controller_1 = require("../controllers/teacher.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
});
const teacherCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().trim().min(1),
        abbreviation: zod_1.z.string().trim().min(1),
    }),
});
const teacherUpdateSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        name: zod_1.z.string().trim().min(1).optional(),
        abbreviation: zod_1.z.string().trim().min(1).optional(),
    })
        .refine((body) => Object.keys(body).length > 0, {
        message: "At least one field is required",
    }),
});
const assignSubjectSchema = zod_1.z.object({
    body: zod_1.z.object({
        subjectId: zod_1.z.coerce.number().int().positive(),
    }),
});
const subjectParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
    subjectId: zod_1.z.coerce.number().int().positive(),
});
const validate = (schema, payload) => {
    schema.parse(payload);
};
router.get("/", teacher_controller_1.teacherController.list);
router.get("/:id", (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, teacher_controller_1.teacherController.getById);
router.post("/", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(teacherCreateSchema, { body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, teacher_controller_1.teacherController.create);
router.put("/:id", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        validate(teacherUpdateSchema, { body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, teacher_controller_1.teacherController.update);
router.delete("/:id", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, teacher_controller_1.teacherController.remove);
router.post("/:id/subjects", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        validate(assignSubjectSchema, { body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, teacher_controller_1.teacherController.assignSubject);
router.delete("/:id/subjects/:subjectId", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(subjectParamSchema, { id: req.params.id, subjectId: req.params.subjectId });
        next();
    }
    catch (error) {
        next(error);
    }
}, teacher_controller_1.teacherController.removeSubject);
router.get("/:id/subjects", (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, teacher_controller_1.teacherController.getSubjects);
router.get("/:id/schedule", (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, teacher_controller_1.teacherController.getSchedule);
exports.default = router;
