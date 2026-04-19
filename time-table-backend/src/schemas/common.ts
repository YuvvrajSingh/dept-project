import { z } from "zod";

/**
 * Strict schema for MongoDB ObjectIds (24-character hexadecimal strings)
 */
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId format");

/**
 * Common schema for entity IDs in route parameters
 */
export const idParamSchema = z.object({
  id: objectIdSchema,
});
