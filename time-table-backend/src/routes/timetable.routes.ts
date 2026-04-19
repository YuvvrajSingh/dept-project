import { Router, z, authenticate, requireAdmin, idParamSchema, objectIdSchema } from "./shared";
import { timetableController } from "../controllers/timetable.controller";

const router = Router();


const theorySchema = z.object({
  body: z.object({
    classSectionId: objectIdSchema,
    day: z.coerce.number().int().min(1).max(6),
    slotStart: z.coerce.number().int().min(1).max(6),
    slotEnd: z.coerce.number().int().min(1).max(6).optional(),
    entryType: z.literal("LECTURE"),
    subjectId: objectIdSchema,
    teacherId: objectIdSchema,
    roomId: objectIdSchema,
  }),
});

const labSchema = z.object({
  body: z.object({
    classSectionId: objectIdSchema,
    day: z.coerce.number().int().min(1).max(6),
    slotStart: z.coerce.number().int().min(1).max(6),
    slotEnd: z.coerce.number().int().min(1).max(6).optional(),
    entryType: z.literal("LAB"),
    labGroups: z
      .array(
        z.object({
          groupName: z.enum(["A1", "A2", "A3"]),
          subjectId: objectIdSchema,
          labId: objectIdSchema,
          teacherId: objectIdSchema,
        }),
      )
      .min(1)
      .max(3),
  }),
});

const createEntrySchema = z.union([theorySchema, labSchema]);
const updateEntrySchema = z.union([theorySchema, labSchema]);

router.post(
  "/entry",
  requireAdmin,
  (req, _res, next) => {
    try {
      createEntrySchema.parse({ body: req.body });
      next();
    } catch (error) {
      next(error);
    }
  },
  timetableController.createEntry,
);

router.put(
  "/entry/:id",
  requireAdmin,
  (req, _res, next) => {
    try {
      idParamSchema.parse({ id: req.params.id });
      updateEntrySchema.parse({ body: req.body });
      next();
    } catch (error) {
      next(error);
    }
  },
  timetableController.updateEntry,
);

router.delete(
  "/entry/:id",
  requireAdmin,
  (req, _res, next) => {
    try {
      idParamSchema.parse({ id: req.params.id });
      next();
    } catch (error) {
      next(error);
    }
  },
  timetableController.deleteEntry,
);

router.post(
  "/entry/:id/cancel-today",
  authenticate,
  (req, _res, next) => {
    try {
      idParamSchema.parse({ id: req.params.id });
      // reason is optional
      z.object({ reason: z.string().optional() }).parse({ reason: req.body.reason });
      next();
    } catch (error) {
      next(error);
    }
  },
  timetableController.cancelToday,
);

router.post(
  "/entry/:id/undo-cancel-today",
  authenticate,
  (req, _res, next) => {
    try {
      idParamSchema.parse({ id: req.params.id });
      next();
    } catch (error) {
      next(error);
    }
  },
  timetableController.undoCancelToday,
);

router.get(
  "/teacher/:teacherId",
  (req, _res, next) => {
    try {
      z.object({ teacherId: objectIdSchema }).parse({ teacherId: req.params.teacherId });
      next();
    } catch (error) {
      next(error);
    }
  },
  timetableController.getTeacherSchedule,
);

router.get(
  "/room/:roomId",
  (req, _res, next) => {
    try {
      z.object({ roomId: objectIdSchema }).parse({ roomId: req.params.roomId });
      next();
    } catch (error) {
      next(error);
    }
  },
  timetableController.getRoomOccupancy,
);

router.delete(
  "/clear-all",
  requireAdmin,
  timetableController.clearGlobalTimetable
);

router.delete(
  "/factory-reset",
  requireAdmin,
  timetableController.factoryReset
);

router.get(
  "/:classSectionId",
  (req, _res, next) => {
    try {
      z.object({ classSectionId: objectIdSchema }).parse({
        classSectionId: req.params.classSectionId,
      });
      next();
    } catch (error) {
      next(error);
    }
  },
  timetableController.getClassTimetable,
);

router.get(
  "/:classSectionId/export/pdf",
  (req, _res, next) => {
    try {
      z.object({ classSectionId: objectIdSchema }).parse({
        classSectionId: req.params.classSectionId,
      });
      next();
    } catch (error) {
      next(error);
    }
  },
  timetableController.exportTimetablePdf,
);

router.post(
  "/:classSectionId/generate",
  requireAdmin,
  (req, _res, next) => {
    try {
      z.object({ classSectionId: objectIdSchema }).parse({
        classSectionId: req.params.classSectionId,
      });
      next();
    } catch (error) {
      next(error);
    }
  },
  timetableController.generateTimetable,
);

router.delete(
  "/:classSectionId/clear",
  requireAdmin,
  (req, _res, next) => {
    try {
      z.object({ classSectionId: objectIdSchema }).parse({
        classSectionId: req.params.classSectionId,
      });
      next();
    } catch (error) {
      next(error);
    }
  },
  timetableController.clearTimetable,
);

export default router;
