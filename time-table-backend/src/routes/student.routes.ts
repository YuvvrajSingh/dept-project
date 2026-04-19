import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";
import { studentController, uploadMemory } from "../controllers/student.controller";

const router = Router();

// All routes require authentication + admin role
router.use(authenticate, requireAdmin);

/** GET /students — list students with optional filters */
router.get("/", studentController.list);

/** GET /students/class/:classSectionId — list all students in a class section */
router.get("/class/:classSectionId", studentController.listByClassSection);

/** GET /students/:id — fetch one student by ID */
router.get("/:id", studentController.getById);

/** GET /students/roll/:rollNumber — fetch one student by roll number */
router.get("/roll/:rollNumber", studentController.getByRollNumber);

/** POST /students — create a single student */
router.post("/", studentController.create);

/** PUT /students/:id — update a student */
router.put("/:id", studentController.update);

/** DELETE /students/:id — soft delete a student */
router.delete("/:id", studentController.softDelete);

/** POST /students/promote — bulk promote students */
router.post("/promote", studentController.promote);

/** POST /students/demote — bulk demote students */
router.post("/demote", studentController.demote);

/** POST /students/bulk-file — upload CSV/XLSX for bulk import */
router.post("/bulk-file", uploadMemory.single("file"), studentController.bulkImportFile);

/** POST /students/bulk — manual JSON array bulk upsert (legacy) */
router.post("/bulk", studentController.bulkUpsert);

export default router;
