import { Router } from "express";
import { z } from "zod";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { loginRateLimit } from "../middleware/loginRateLimit";

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

router.post("/login", loginRateLimit, (req, _res, next) => {
  try {
    loginSchema.parse({ body: req.body });
    next();
  } catch (error) {
    next(error);
  }
}, authController.login);

router.post("/logout", authController.logout);

router.get("/me", authenticate, authController.me);

export default router;
