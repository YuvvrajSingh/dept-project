import { Router } from "express";
import { occupancyController } from "../controllers/occupancy.controller";

const router = Router();

router.get("/", occupancyController.getMatrix);

export default router;
