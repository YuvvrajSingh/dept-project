import { Router } from "express";
import { z } from "zod";
import { academicYearController } from "../controllers/academicYear.controller";

const router = Router();

const idSchema = z.object({ id: z.coerce.number().int().positive() });

const createSchema = z.object({
  body: z.object({
    startYear: z.coerce.number().int().min(2015).max(2040),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

const updateSchema = z.object({
  body: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

const statusSchema = z.object({
  body: z.object({
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  }),
});

const cloneSchema = z.object({
  body: z.object({
    sourceId: z.coerce.number().int().positive(),
  }),
});

const validate = (schema: z.ZodSchema, payload: unknown) => {
  schema.parse(payload);
};

// GET /api/academic-years
router.get("/", academicYearController.list);

// GET /api/academic-years/active
router.get("/active", academicYearController.getActive);

// GET /api/academic-years/:id
router.get("/:id", (req, _res, next) => {
  try {
    validate(idSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, academicYearController.getById);

// POST /api/academic-years
router.post("/", (req, _res, next) => {
  try {
    validate(createSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, academicYearController.create);

// PUT /api/academic-years/:id
router.put("/:id", (req, _res, next) => {
  try {
    validate(idSchema, { id: req.params.id });
    validate(updateSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, academicYearController.update);

// PUT /api/academic-years/:id/status
router.put("/:id/status", (req, _res, next) => {
  try {
    validate(idSchema, { id: req.params.id });
    validate(statusSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, academicYearController.updateStatus);

// PUT /api/academic-years/:id/activate
router.put("/:id/activate", (req, _res, next) => {
  try {
    validate(idSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, academicYearController.activate);

// POST /api/academic-years/:id/clone
router.post("/:id/clone", (req, _res, next) => {
  try {
    validate(idSchema, { id: req.params.id });
    validate(cloneSchema, { body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, academicYearController.clone);

// DELETE /api/academic-years/all
router.delete("/all", academicYearController.removeAll);

// DELETE /api/academic-years/:id
router.delete("/:id", (req, _res, next) => {
  try {
    validate(idSchema, { id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, academicYearController.remove);

export default router;
