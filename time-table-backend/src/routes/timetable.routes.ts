import { Router } from "express";
import { z } from "zod";
import { timetableController } from "../controllers/timetable.controller";

const router = Router();

const idSchema = z.object({ id: z.coerce.number().int().positive() });
const classSectionParamSchema = z.object({ classSectionId: z.coerce.number().int().positive() });
const teacherParamSchema = z.object({ teacherId: z.coerce.number().int().positive() });
const roomParamSchema = z.object({ roomId: z.coerce.number().int().positive() });

const theorySchema = z.object({
  body: z.object({
    classSectionId: z.coerce.number().int().positive(),
    day: z.coerce.number().int().min(1).max(6),
    slotStart: z.coerce.number().int().min(1).max(6),
    slotEnd: z.coerce.number().int().min(1).max(6).optional(),
    entryType: z.literal("THEORY"),
    subjectId: z.coerce.number().int().positive(),
    teacherId: z.coerce.number().int().positive(),
    roomId: z.coerce.number().int().positive(),
  }),
});

const labSchema = z.object({
  body: z.object({
    classSectionId: z.coerce.number().int().positive(),
    day: z.coerce.number().int().min(1).max(6),
    entryType: z.literal("LAB"),
    subjectId: z.coerce.number().int().positive(),
    labGroups: z.array(
      z.object({
        groupName: z.enum(["A1", "A2", "A3"]),
        labId: z.coerce.number().int().positive(),
        teacherId: z.coerce.number().int().positive(),
      }),
    ),
  }),
});

const createEntrySchema = z.union([theorySchema, labSchema]);
const updateEntrySchema = z.union([theorySchema, labSchema]);

router.post("/entry", (req, _res, next) => {
  try {
    createEntrySchema.parse({ body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, timetableController.createEntry);

router.put("/entry/:id", (req, _res, next) => {
  try {
    idSchema.parse({ id: req.params.id });
    updateEntrySchema.parse({ body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, timetableController.updateEntry);

router.delete("/entry/:id", (req, _res, next) => {
  try {
    idSchema.parse({ id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, timetableController.deleteEntry);

router.get("/teacher/:teacherId", (req, _res, next) => {
  try {
    teacherParamSchema.parse({ teacherId: req.params.teacherId });
    next();
  } catch (error) {
    next(error);
  }
}, timetableController.getTeacherSchedule);

router.get("/room/:roomId", (req, _res, next) => {
  try {
    roomParamSchema.parse({ roomId: req.params.roomId });
    next();
  } catch (error) {
    next(error);
  }
}, timetableController.getRoomOccupancy);

router.get("/:classSectionId", (req, _res, next) => {
  try {
    classSectionParamSchema.parse({ classSectionId: req.params.classSectionId });
    next();
  } catch (error) {
    next(error);
  }
}, timetableController.getClassTimetable);

export default router;
