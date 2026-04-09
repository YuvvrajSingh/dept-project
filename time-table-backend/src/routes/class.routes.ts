import { Router } from "express";
import { z } from "zod";
import { classController } from "../controllers/class.controller";

const router = Router();

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const classCreateSchema = z.object({
  body: z.object({
    branchName: z.string().trim().min(1).toUpperCase(),
    year: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    semester: z.coerce.number().int().min(1).max(8),
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

router.get("/", classController.list);

router.get("/:id", (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, classController.getById);

router.post("/", (req, _res, next) => {
  try {
    validate(classCreateSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, classController.create);

router.put("/:id", (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    validate(classUpdateSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, classController.update);

router.delete("/:id", (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, classController.remove);

router.post("/:id/subjects", (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    validate(assignSubjectSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, classController.assignSubject);

router.delete("/:id/subjects/:subjectId", (req, _res, next) => {
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
