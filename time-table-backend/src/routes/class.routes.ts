import { Router, z, requireAdmin, idParamSchema, objectIdSchema } from "./shared";
import { classController } from "../controllers/class.controller";

const router = Router();

const classCreateSchema = z.object({
  body: z.object({
    branchName: z.string().trim().min(1).toUpperCase(),
    year: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    semester: z.coerce.number().int().min(1).max(8),
    academicYearId: objectIdSchema,
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
    subjectId: objectIdSchema,
  }),
});

const subjectParamSchema = z.object({
  id: objectIdSchema,
  subjectId: objectIdSchema,
});

const validate = (schema: z.ZodSchema, payload: unknown) => {
  schema.parse(payload);
};

router.get("/", (req, _res, next) => {
  (req as any).academicYearId = req.query.academicYearId || undefined;
  next();
}, classController.list);

router.get("/:id", (req, _res, next) => {
  try {
    idParamSchema.parse({ id: req.params.id });
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
    idParamSchema.parse({ id: req.params.id });
    validate(classUpdateSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, classController.update);

router.delete("/:id", requireAdmin, (req, _res, next) => {
  try {
    idParamSchema.parse({ id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, classController.remove);

router.post("/:id/subjects", requireAdmin, (req, _res, next) => {
  try {
    idParamSchema.parse({ id: req.params.id });
    validate(assignSubjectSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, classController.assignSubject);

router.delete("/:id/subjects/:subjectId", requireAdmin, (req, _res, next) => {
  try {
    subjectParamSchema.parse({ id: req.params.id, subjectId: req.params.subjectId });
    next();
  } catch (error) {
    next(error);
  }
}, classController.removeSubject);

router.get("/:id/subjects", (req, _res, next) => {
  try {
    idParamSchema.parse({ id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, classController.getSubjects);

export default router;
