"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
exports.dashboardController = {
    async getMetrics(req, res, next) {
        try {
            const data = await dashboard_service_1.dashboardService.getMetrics();
            res.status(200).json(data);
        }
        catch (error) {
            next(error);
        }
    }
};
