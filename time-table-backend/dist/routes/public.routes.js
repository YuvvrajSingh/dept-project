"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const academicYear_controller_1 = require("../controllers/academicYear.controller");
const class_controller_1 = require("../controllers/class.controller");
const timetable_controller_1 = require("../controllers/timetable.controller");
const router = (0, express_1.Router)();
// Validation schemas matching the original routes
const classSectionParamSchema = zod_1.z.object({
    classSectionId: zod_1.z.coerce.number().int().positive(),
});
const validate = (schema, payload) => {
    schema.parse(payload);
};
// 1. Get active academic year
router.get("/active-year", academicYear_controller_1.academicYearController.getActive);
// 2. Get classes (supports ?academicYearId= query param)
router.get("/classes", (req, _res, next) => {
    req.academicYearId = req.query.academicYearId ? Number(req.query.academicYearId) : undefined;
    next();
}, class_controller_1.classController.list);
// 3. Get timetable matrix by class section ID
router.get("/timetable/:classSectionId", (req, _res, next) => {
    try {
        validate(classSectionParamSchema, {
            classSectionId: req.params.classSectionId,
        });
        next();
    }
    catch (error) {
        next(error);
    }
}, timetable_controller_1.timetableController.getClassTimetable);
exports.default = router;
