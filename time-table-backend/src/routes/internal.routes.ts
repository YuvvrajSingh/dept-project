import { Router, type Request, type Response, type NextFunction } from "express";
import { InternalController } from "../controllers/internal.controller";

const router = Router();
const internalController = new InternalController();

// Internal Secret Middleware
const internalOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (req.headers["x-internal-secret"] !== process.env.INTERNAL_SECRET) {
    res.status(403).json({ error: "FORBIDDEN", message: "Invalid or missing internal secret" });
    return;
  }
  next();
};

router.use(internalOnly);

// Internal Endpoints
router.post("/auth/teacher", internalController.verifyTeacher.bind(internalController));
router.post("/auth/student", internalController.verifyStudent.bind(internalController));
router.get("/students", internalController.getStudents.bind(internalController));
router.get("/subjects", internalController.getSubjects.bind(internalController));
router.get("/teacher/assigned-classes", internalController.getAssignedClasses.bind(internalController));

export default router;
