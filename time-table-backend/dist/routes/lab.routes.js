"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const lab_controller_1 = require("../controllers/lab.controller");
const router = (0, express_1.Router)();
const idSchema = zod_1.z.object({ id: zod_1.z.coerce.number().int().positive() });
const createSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().trim().min(1),
        capacity: zod_1.z.coerce.number().int().positive().optional(),
    }),
});
const updateSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        name: zod_1.z.string().trim().min(1).optional(),
        capacity: zod_1.z.coerce.number().int().positive().optional(),
    })
        .refine((body) => Object.keys(body).length > 0, {
        message: "At least one field is required",
    }),
});
router.get("/", lab_controller_1.labController.list);
router.post("/", (req, _res, next) => {
    try {
        createSchema.parse({ body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, lab_controller_1.labController.create);
router.put("/:id", (req, _res, next) => {
    try {
        idSchema.parse({ id: req.params.id });
        updateSchema.parse({ body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, lab_controller_1.labController.update);
router.delete("/:id", (req, _res, next) => {
    try {
        idSchema.parse({ id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, lab_controller_1.labController.remove);
exports.default = router;
