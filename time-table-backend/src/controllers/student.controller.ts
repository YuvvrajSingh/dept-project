import type { NextFunction, Request, Response } from "express";
import { studentService } from "../services/student.service";
import { StudentHistoryAction } from "@prisma/client";
import * as XLSX from "xlsx";
import multer from "multer";

/** In-memory multer for CSV/XLSX uploads (no disk write needed). */
export const uploadMemory = multer({ storage: multer.memoryStorage() });

export const studentController = {
  // ── List ─────────────────────────────────────────────────────────────────────

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { classSectionId, search, isActive } = req.query as Record<string, string>;
      const data = await studentService.list({
        classSectionId,
        search,
        isActive: isActive === "false" ? false : true,
      });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  // ── Legacy list by class section (used by attendance system) ─────────────────

  async listByClassSection(req: Request, res: Response, next: NextFunction) {
    try {
      const classSectionId = req.params.classSectionId as string;
      const data = await studentService.list({ classSectionId });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  // ── Fetch one ────────────────────────────────────────────────────────────────

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await studentService.getById(req.params.id as string);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getByRollNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const rollNumber = req.params.rollNumber as string;
      const data = await studentService.getByRollNumber(rollNumber);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  // ── Create ───────────────────────────────────────────────────────────────────

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await studentService.createStudent(req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },

  // ── Update ───────────────────────────────────────────────────────────────────

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await studentService.updateStudent(id, req.body);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  // ── Soft Delete ──────────────────────────────────────────────────────────────

  async softDelete(req: Request, res: Response, next: NextFunction) {
    try {
      await studentService.softDelete(req.params.id as string);
      res.status(200).json({ message: "Student deactivated." });
    } catch (error) {
      next(error);
    }
  },

  // ── Hard Delete (legacy) ─────────────────────────────────────────────────────

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await studentService.deleteStudent(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // ── Promote ──────────────────────────────────────────────────────────────────

  async promote(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentIds, targetClassSectionId, note } = req.body as {
        studentIds: string[];
        targetClassSectionId: string;
        note?: string;
      };
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ error: "studentIds must be a non-empty array." });
      }
      const performedBy = (req as any).user?.email;
      const result = await studentService.bulkTransfer({
        studentIds,
        targetClassSectionId,
        action: StudentHistoryAction.PROMOTED,
        note,
        performedBy,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // ── Demote ───────────────────────────────────────────────────────────────────

  async demote(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentIds, targetClassSectionId, note } = req.body as {
        studentIds: string[];
        targetClassSectionId: string;
        note?: string;
      };
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ error: "studentIds must be a non-empty array." });
      }
      const performedBy = (req as any).user?.email;
      const result = await studentService.bulkTransfer({
        studentIds,
        targetClassSectionId,
        action: StudentHistoryAction.DEMOTED,
        note,
        performedBy,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // ── Bulk Import (CSV / XLSX) ─────────────────────────────────────────────────
  // Expects multipart/form-data with a "file" field + "classSectionId" field.
  // Columns: RollNumber, Name, Email (optional), Batch (optional)

  async bulkImportFile(req: Request, res: Response, next: NextFunction) {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ error: "No file uploaded." });

      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      const { classSectionId } = req.body as { classSectionId: string };
      if (!classSectionId) {
        return res.status(400).json({ error: "classSectionId is required." });
      }

      const students = rows.map((row: Record<string, string>) => ({
        rollNumber: (row["RollNumber"] ?? row["Roll Number"] ?? row["roll_number"] ?? "").toString().trim(),
        name: (row["Name"] ?? row["Student Name"] ?? "").toString().trim(),
        email: (row["Email"] ?? "").toString().trim() || undefined,
        batch: (row["Batch"] ?? "").toString().trim() || undefined,
        classSectionId,
      })).filter((s) => s.rollNumber && s.name);

      if (students.length === 0) {
        return res.status(400).json({ error: "No valid rows found. Ensure columns: RollNumber, Name." });
      }

      const performedBy = (req as any).user?.email;
      const result = await studentService.bulkImport(students, performedBy);
      res.status(200).json({ ...result, total: students.length });
    } catch (error) {
      next(error);
    }
  },

  // ── Legacy bulk upsert (existing endpoint) ───────────────────────────────────

  async bulkUpsert(req: Request, res: Response, next: NextFunction) {
    try {
      const { students } = req.body as {
        students: { rollNumber: string; name: string; email?: string; classSectionId: string }[];
      };
      if (!Array.isArray(students) || students.length === 0) {
        res.status(400).json({ error: "students array is required and must not be empty" });
        return;
      }
      const result = await studentService.bulkUpsert(students);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};

