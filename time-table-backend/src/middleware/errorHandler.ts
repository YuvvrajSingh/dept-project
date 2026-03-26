import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

type ErrorResponse = {
  error: string;
  message: string;
};

const buildResponse = (error: string, message: string): ErrorResponse => ({
  error,
  message,
});

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response<ErrorResponse> {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
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

  if (err instanceof ZodError) {
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

  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json(buildResponse(err.errorCode, err.message));
  }

  return res
    .status(500)
    .json(buildResponse("INTERNAL_SERVER_ERROR", "Something went wrong"));
}
