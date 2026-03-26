import { Router } from "express";
import { z } from "zod";
import { subjectController } from "../controllers/subject.controller";

const router = Router();

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const createSubjectSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1),
    name: z.string().trim().min(1),
    type: z.enum(["THEORY", "LAB"]),
    creditHours: z.coerce.number().int().positive(),
  }),
});

const updateSubjectSchema = z.object({
  body: z
    .object({
      code: z.string().trim().min(1).optional(),
      name: z.string().trim().min(1).optional(),
      type: z.enum(["THEORY", "LAB"]).optional(),
      creditHours: z.coerce.number().int().positive().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field is required",
    }),
});

const validate = (schema: z.ZodSchema, payload: unknown) => {
  schema.parse(payload);
};

router.get("/", subjectController.list);

router.get("/:id", (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, subjectController.getById);

router.post("/", (req, _res, next) => {
  try {
    validate(createSubjectSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, subjectController.create);

router.put("/:id", (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    validate(updateSubjectSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, subjectController.update);

router.delete("/:id", (req, _res, next) => {
  try {
    validate(idParamSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, subjectController.remove);

export default router;
