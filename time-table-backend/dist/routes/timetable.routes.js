"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const timetable_controller_1 = require("../controllers/timetable.controller");
const router = (0, express_1.Router)();
const idSchema = zod_1.z.object({ id: zod_1.z.coerce.number().int().positive() });
const classSectionParamSchema = zod_1.z.object({ classSectionId: zod_1.z.coerce.number().int().positive() });
const teacherParamSchema = zod_1.z.object({ teacherId: zod_1.z.coerce.number().int().positive() });
const roomParamSchema = zod_1.z.object({ roomId: zod_1.z.coerce.number().int().positive() });
const theorySchema = zod_1.z.object({
    body: zod_1.z.object({
        classSectionId: zod_1.z.coerce.number().int().positive(),
        day: zod_1.z.coerce.number().int().min(1).max(6),
        slotStart: zod_1.z.coerce.number().int().min(1).max(6),
        slotEnd: zod_1.z.coerce.number().int().min(1).max(6).optional(),
        entryType: zod_1.z.literal("THEORY"),
        subjectId: zod_1.z.coerce.number().int().positive(),
        teacherId: zod_1.z.coerce.number().int().positive(),
        roomId: zod_1.z.coerce.number().int().positive(),
    }),
});
const labSchema = zod_1.z.object({
    body: zod_1.z.object({
        classSectionId: zod_1.z.coerce.number().int().positive(),
        day: zod_1.z.coerce.number().int().min(1).max(6),
        entryType: zod_1.z.literal("LAB"),
        subjectId: zod_1.z.coerce.number().int().positive(),
        labGroups: zod_1.z.array(zod_1.z.object({
            groupName: zod_1.z.enum(["A1", "A2", "A3"]),
            labId: zod_1.z.coerce.number().int().positive(),
            teacherId: zod_1.z.coerce.number().int().positive(),
        })),
    }),
});
const createEntrySchema = zod_1.z.union([theorySchema, labSchema]);
const updateEntrySchema = zod_1.z.union([theorySchema, labSchema]);
router.post("/entry", (req, _res, next) => {
    try {
        createEntrySchema.parse({ body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, timetable_controller_1.timetableController.createEntry);
router.put("/entry/:id", (req, _res, next) => {
    try {
        idSchema.parse({ id: req.params.id });
        updateEntrySchema.parse({ body: req.body });
        next();
    }
    catch (error) {
        next(error);
    }
}, timetable_controller_1.timetableController.updateEntry);
router.delete("/entry/:id", (req, _res, next) => {
    try {
        idSchema.parse({ id: req.params.id });
        next();
    }
    catch (error) {
        next(error);
    }
}, timetable_controller_1.timetableController.deleteEntry);
router.get("/teacher/:teacherId", (req, _res, next) => {
    try {
        teacherParamSchema.parse({ teacherId: req.params.teacherId });
        next();
    }
    catch (error) {
        next(error);
    }
}, timetable_controller_1.timetableController.getTeacherSchedule);
router.get("/room/:roomId", (req, _res, next) => {
    try {
        roomParamSchema.parse({ roomId: req.params.roomId });
        next();
    }
    catch (error) {
        next(error);
    }
}, timetable_controller_1.timetableController.getRoomOccupancy);
router.get("/:classSectionId", (req, _res, next) => {
    try {
        classSectionParamSchema.parse({ classSectionId: req.params.classSectionId });
        next();
    }
    catch (error) {
        next(error);
    }
}, timetable_controller_1.timetableController.getClassTimetable);
exports.default = router;
