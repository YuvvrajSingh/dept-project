import { Router } from "express";
import { z } from "zod";
import { teacherController } from "../controllers/teacher.controller";
import { requireAdmin } from "../middleware/auth.middleware";

const router = Router();

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const teacherCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    abbreviation: z.string().trim().min(1),
  }),
});

const teacherUpdateSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).optional(),
      abbreviation: z.string().trim().min(1).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field is required",
    }),
});

const assignSubjectSchema = z.object({
  body: z.object({
    subjectId: z.coerce.number().int().positive(),
  }),
});

const subjectParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  subjectId: z.coerce.number().int().positive(),
});

const validate = (schema: z.ZodSchema, payload: unknown) => {
  schema.parse(payload);
};

router.get("/", teacherController.list);

router.get("/:id", (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, teacherController.getById);

router.post(
  "/",
  requireAdmin,
  (req, _res, next) => {
    try {
      validate(teacherCreateSchema, { body: req.body });
      next();
    } catch (error) {
      next(error);
    }
  },
  teacherController.create,
);

router.put("/:id", requireAdmin, (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    validate(teacherUpdateSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, teacherController.update);

router.delete("/:id", requireAdmin, (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, teacherController.remove);

router.post("/:id/subjects", requireAdmin, (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    validate(assignSubjectSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, teacherController.assignSubject);

router.delete("/:id/subjects/:subjectId", requireAdmin, (req, _res, next) => {
  try {
    validate(subjectParamSchema, { id: req.params.id, subjectId: req.params.subjectId });
    next();
  } catch (error) {
    next(error);
  }
}, teacherController.removeSubject);

router.get("/:id/subjects", (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, teacherController.getSubjects);

router.get("/:id/schedule", (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, teacherController.getSchedule);

export default router;
