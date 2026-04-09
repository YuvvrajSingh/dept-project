"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const occupancy_controller_1 = require("../controllers/occupancy.controller");
const router = (0, express_1.Router)();
router.get("/", occupancy_controller_1.occupancyController.getMatrix);
exports.default = router;
