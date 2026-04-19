import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin, requireAdminOrTeacherSelf } from "../middleware/auth.middleware";
import { idParamSchema, objectIdSchema } from "../schemas/common";

export {
  Router,
  z,
  authenticate,
  requireAdmin,
  requireAdminOrTeacherSelf,
  idParamSchema,
  objectIdSchema,
};
