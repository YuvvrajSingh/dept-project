import { Router } from "express";
import { z } from "zod";
import { classController } from "../controllers/class.controller";
import { requireAdmin } from "../middleware/auth.middleware";

const router = Router();

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const classCreateSchema = z.object({
  body: z.object({
    branchName: z.string().trim().min(1).toUpperCase(),
    year: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    semester: z.coerce.number().int().min(1).max(8),
    academicYearId: z.coerce.number().int().positive(),
  }),
});

const classUpdateSchema = z.object({
  body: z
    .object({
      branchName: z.string().trim().min(1).toUpperCase().optional(),
      year: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
      semester: z.coerce.number().int().min(1).max(8).optional(),
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

router.get("/", (req, _res, next) => {
  (req as any).academicYearId = req.query.academicYearId ? Number(req.query.academicYearId) : undefined;
  next();
}, classController.list);

router.get("/:id", (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, classController.getById);

router.post(
  "/",
  requireAdmin,
  (req, _res, next) => {
    try {
      validate(classCreateSchema, { body: req.body });
      next();
    } catch (error) {
      next(error);
    }
  },
  classController.create,
);

router.put("/:id", requireAdmin, (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    validate(classUpdateSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, classController.update);

router.delete("/:id", requireAdmin, (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, classController.remove);

router.post("/:id/subjects", requireAdmin, (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    validate(assignSubjectSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, classController.assignSubject);

router.delete("/:id/subjects/:subjectId", requireAdmin, (req, _res, next) => {
  try {
    validate(subjectParamSchema, { id: req.params.id, subjectId: req.params.subjectId });
    next();
  } catch (error) {
    next(error);
  }
}, classController.removeSubject);

router.get("/:id/subjects", (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, classController.getSubjects);

export default router;
