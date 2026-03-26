"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const AppError_1 = require("../utils/AppError");
const buildResponse = (error, message) => ({
    error,
    message,
});
function errorHandler(err, _req, res, _next) {
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            return res
                .status(409)
                .json(buildResponse("CONFLICT", "Resource already exists"));
        }
        if (err.code === "P2025") {
            return res
                .status(404)
                .json(buildResponse("NOT_FOUND", "Requested resource was not found"));
        }
        return res
            .status(500)
            .json(buildResponse("INTERNAL_SERVER_ERROR", "Database operation failed"));
    }
    if (err instanceof zod_1.ZodError) {
        const fieldMessages = err.issues
            .map((issue) => {
            const field = issue.path.join(".") || "body";
            return `${field}: ${issue.message}`;
        })
            .join("; ");
        return res
            .status(400)
            .json(buildResponse("VALIDATION_ERROR", fieldMessages || "Invalid input"));
    }
    if (err instanceof AppError_1.AppError) {
        return res
            .status(err.statusCode)
            .json(buildResponse(err.errorCode, err.message));
    }
    return res
        .status(500)
        .json(buildResponse("INTERNAL_SERVER_ERROR", "Something went wrong"));
}
