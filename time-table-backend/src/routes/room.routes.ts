import { Router } from "express";
import { z } from "zod";
import { roomController } from "../controllers/room.controller";
import { requireAdmin } from "../middleware/auth.middleware";

const router = Router();

const idSchema = z.object({ id: z.coerce.number().int().positive() });

const createSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    capacity: z.coerce.number().int().positive().optional(),
  }),
});

const updateSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).optional(),
      capacity: z.coerce.number().int().positive().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field is required",
    }),
});

router.get("/", roomController.list);

router.post(
  "/",
  requireAdmin,
  (req, _res, next) => {
    try {
      createSchema.parse({ body: req.body });
      next();
    } catch (error) {
      next(error);
    }
  },
  roomController.create,
);

router.put("/:id", requireAdmin, (req, _res, next) => {
  try {
    idSchema.parse({ id: req.params.id });
    updateSchema.parse({ body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, roomController.update);

router.delete("/:id", requireAdmin, (req, _res, next) => {
  try {
    idSchema.parse({ id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
}, roomController.remove);

export default router;
