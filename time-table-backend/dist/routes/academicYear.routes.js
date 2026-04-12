"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const academicYear_controller_1 = require("../controllers/academicYear.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const idSchema = zod_1.z.object({ id: zod_1.z.coerce.number().int().positive() });
const createSchema = zod_1.z.object({
    body: zod_1.z.object({
        startYear: zod_1.z.coerce.number().int().min(2015).max(2040),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }),
});
const updateSchema = zod_1.z.object({
    body: zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }),
});
const statusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
    }),
});
const cloneSchema = zod_1.z.object({
    body: zod_1.z.object({
        sourceId: zod_1.z.coerce.number().int().positive(),
    }),
});
const validate = (schema, payload) => {
    schema.parse(payload);
};
// GET /api/academic-years
router.get("/", academicYear_controller_1.academicYearController.list);
// GET /api/academic-years/active
router.get("/active", academicYear_controller_1.academicYearController.getActive);
// GET /api/academic-years/:id
router.get("/:id", (req, _res, next) => {
    try {
        validate(idSchema, { id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, academicYear_controller_1.academicYearController.getById);
// POST /api/academic-years
router.post("/", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(createSchema, { body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, academicYear_controller_1.academicYearController.create);
// PUT /api/academic-years/:id
router.put("/:id", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(idSchema, { id: req.params.id });
        validate(updateSchema, { body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, academicYear_controller_1.academicYearController.update);
// PUT /api/academic-years/:id/status
router.put("/:id/status", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(idSchema, { id: req.params.id });
        validate(statusSchema, { body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, academicYear_controller_1.academicYearController.updateStatus);
// PUT /api/academic-years/:id/activate
router.put("/:id/activate", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(idSchema, { id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, academicYear_controller_1.academicYearController.activate);
// POST /api/academic-years/:id/clone
router.post("/:id/clone", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(idSchema, { id: req.params.id });
        validate(cloneSchema, { body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, academicYear_controller_1.academicYearController.clone);
// DELETE /api/academic-years/all
router.delete("/all", auth_middleware_1.requireAdmin, academicYear_controller_1.academicYearController.removeAll);
// DELETE /api/academic-years/:id
router.delete("/:id", auth_middleware_1.requireAdmin, (req, _res, next) => {
    try {
        validate(idSchema, { id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, academicYear_controller_1.academicYearController.remove);
exports.default = router;
