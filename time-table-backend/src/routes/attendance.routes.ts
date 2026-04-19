import { Router } from "express";
import { AttendanceController } from "../controllers/attendance.controller";

const router = Router();
const attendanceController = new AttendanceController();

// Note: These routes skip strict JWT auth for the exact parity with the old microservice.
// In a true secure environment, add token validation middleware here.
router.post("/mark-bulk", attendanceController.markBulk.bind(attendanceController));
router.get("/assigned-all", attendanceController.getAssignedAll.bind(attendanceController));
router.get("/student/:rollNumber", attendanceController.getStudentAttendance.bind(attendanceController));
router.put("/update/:id", attendanceController.updateStatus.bind(attendanceController));

export default router;
