import { Router } from "express";
import { z } from "zod";
import { academicYearController } from "../controllers/academicYear.controller";
import { classController } from "../controllers/class.controller";
import { timetableController } from "../controllers/timetable.controller";

const router = Router();

// Validation schemas matching the original routes
const classSectionParamSchema = z.object({
  classSectionId: z.coerce.number().int().positive(),
});

const validate = (schema: z.ZodSchema, payload: unknown) => {
  schema.parse(payload);
};

// 1. Get active academic year
router.get("/active-year", academicYearController.getActive);

// 2. Get classes (supports ?academicYearId= query param)
router.get("/classes", (req, _res, next) => {
  (req as any).academicYearId = req.query.academicYearId ? Number(req.query.academicYearId) : undefined;
  next();
}, classController.list);

// 3. Get timetable matrix by class section ID
router.get("/timetable/:classSectionId", (req, _res, next) => {
  try {
    validate(classSectionParamSchema, {
      classSectionId: req.params.classSectionId,
    });
    next();
  } catch (error) {
    next(error);
  }
}, timetableController.getClassTimetable);

export default router;
