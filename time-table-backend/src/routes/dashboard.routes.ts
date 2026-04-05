import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";

const router = Router();

router.get("/metrics", dashboardController.getMetrics);

export default router;
