import { Router } from "express";
import { z } from "zod";
import { userController } from "../controllers/user.controller";
import { requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAdmin);

const createUserSchema = z
  .object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(["ADMIN", "TEACHER"]),
      teacherId: z.coerce.number().int().positive().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    const b = data.body;
    if (b.role === "TEACHER" && b.teacherId == null) {
      ctx.addIssue({
        code: "custom",
        message: "teacherId is required when role is TEACHER",
        path: ["body", "teacherId"],
      });
    }
    if (b.role === "ADMIN" && b.teacherId != null) {
      ctx.addIssue({
        code: "custom",
        message: "teacherId must be omitted when role is ADMIN",
        path: ["body", "teacherId"],
      });
    }
  });

router.get("/", userController.list);

router.post("/", (req, _res, next) => {
  try {
    createUserSchema.parse({ body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, userController.create);

router.delete("/:id", userController.remove);

export default router;

