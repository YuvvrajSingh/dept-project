"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const class_controller_1 = require("../controllers/class.controller");
const router = (0, express_1.Router)();
const idParamSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive(),
});
const classCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        branchId: zod_1.z.coerce.number().int().positive(),
        year: zod_1.z.union([zod_1.z.literal(2), zod_1.z.literal(3), zod_1.z.literal(4)]),
    }),
});
const classUpdateSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        branchId: zod_1.z.coerce.number().int().positive().optional(),
        year: zod_1.z.union([zod_1.z.literal(2), zod_1.z.literal(3), zod_1.z.literal(4)]).optional(),
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
router.get("/", class_controller_1.classController.list);
router.get("/:id", (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, class_controller_1.classController.getById);
router.post("/", (req, _res, next) => {
    try {
        validate(classCreateSchema, { body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, class_controller_1.classController.create);
router.put("/:id", (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        validate(classUpdateSchema, { body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, class_controller_1.classController.update);
router.delete("/:id", (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, class_controller_1.classController.remove);
router.post("/:id/subjects", (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        validate(assignSubjectSchema, { body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, class_controller_1.classController.assignSubject);
router.delete("/:id/subjects/:subjectId", (req, _res, next) => {
    try {
        validate(subjectParamSchema, { id: req.params.id, subjectId: req.params.subjectId });
        next();
    }
    catch (error) {
        next(error);
    }
}, class_controller_1.classController.removeSubject);
router.get("/:id/subjects", (req, _res, next) => {
    try {
        validate(idParamSchema, { id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, class_controller_1.classController.getSubjects);
exports.default = router;
