"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const user_service_1 = require("../services/user.service");
exports.userController = {
    async create(req, res, next) {
        try {
            const body = req.body;
            const user = await user_service_1.userService.createUser(body);
            res.status(201).json({
                id: user.id,
                email: user.email,
                role: user.role,
                teacherId: user.teacherId,
            });
        }
        catch (error) {
            next(error);
        }
    },
};
