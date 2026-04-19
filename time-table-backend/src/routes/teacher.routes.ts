import { Router, z, authenticate, requireAdmin, requireAdminOrTeacherSelf, idParamSchema, objectIdSchema } from "./shared";
import { teacherController } from "../controllers/teacher.controller";

const router = Router();


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

router.get("/", teacherController.list);

// Must be before /:id to avoid matching "me" as a numeric id
router.get("/me", authenticate, teacherController.getMe);

router.get("/:id", (req, _res, next) => {
  try {
    idParamSchema.parse({ id: req.params.id });
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
    idParamSchema.parse({ id: req.params.id });
    validate(teacherUpdateSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, teacherController.update);

router.delete("/:id", requireAdmin, (req, _res, next) => {
  try {
    idParamSchema.parse({ id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, teacherController.remove);

router.post("/:id/subjects", requireAdminOrTeacherSelf, (req, _res, next) => {
  try {
    idParamSchema.parse({ id: req.params.id });
    validate(assignSubjectSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, teacherController.assignSubject);

router.delete("/:id/subjects/:subjectId", requireAdminOrTeacherSelf, (req, _res, next) => {
  try {
    subjectParamSchema.parse({ id: req.params.id, subjectId: req.params.subjectId });
    next();
  } catch (error) {
    next(error);
  }
}, teacherController.removeSubject);

router.get("/:id/subjects", (req, _res, next) => {
  try {
    idParamSchema.parse({ id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, teacherController.getSubjects);

router.get("/:id/schedule", (req, _res, next) => {
  try {
    idParamSchema.parse({ id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, teacherController.getSchedule);

export default router;
