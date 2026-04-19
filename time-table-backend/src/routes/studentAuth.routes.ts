import { Router } from "express";
import {
  studentLogin,
  studentLogout,
  studentMe,
  studentChangePassword,
} from "../controllers/studentAuth.controller";
import { loginRateLimit } from "../middleware/loginRateLimit";

const router = Router();

/** POST /auth/student-login — login with roll number and password */
router.post("/student-login", loginRateLimit, studentLogin);

/** POST /auth/student-logout — clear student token cookie */
router.post("/student-logout", studentLogout);

/** GET /auth/student-me — get currently logged in student profile */
router.get("/student-me", studentMe);

/** POST /auth/student-change-password — update student password */
router.post("/student-change-password", studentChangePassword);

export default router;
