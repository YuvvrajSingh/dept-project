import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { academicYearController } from "../controllers/academicYear.controller";
import { classController } from "../controllers/class.controller";
import { timetableController } from "../controllers/timetable.controller";
import { objectIdSchema } from "../schemas/common";
import { prisma } from "../prisma/client";

const router = Router();

// Validation schemas matching the original routes
const classSectionParamSchema = z.object({
  classSectionId: objectIdSchema,
});


// 1. Get active academic year
router.get("/active-year", academicYearController.getActive);

// 2. Get classes (supports ?academicYearId= query param)
router.get("/classes", (req, _res, next) => {
  (req as any).academicYearId = req.query.academicYearId || undefined;
  next();
}, classController.list);

// 3. Get timetable matrix by class section ID
router.get("/timetable/:classSectionId", (req, _res, next) => {
  try {
    classSectionParamSchema.parse({
      classSectionId: req.params.classSectionId,
    });
    next();
  } catch (error) {
    next(error);
  }
}, timetableController.getClassTimetable);

// 4. Get today's cancellations for a class
// e.g., /api/public/cancellations/today?classSectionId=123
router.get("/cancellations/today", timetableController.getTodayCancellations);

// 5. Get subjects for a given branchId + semester (used by Exam Builder dropdown)
// e.g., GET /api/public/subjects-for-class?branchId=abc&semester=3
router.get("/subjects-for-class", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branchId = req.query.branchId as string;
    const semester = parseInt(req.query.semester as string, 10);

    if (!branchId || isNaN(semester)) {
      return res.status(400).json({ error: "branchId and semester are required" });
    }

    // Find active classSections matching branch + semester across all academic years
    const classSections = await prisma.classSection.findMany({
      where: { branchId, semester },
      select: { id: true },
    });

    if (classSections.length === 0) {
      return res.status(200).json([]);
    }

    const classSectionIds = classSections.map((cs) => cs.id);

    // Get all unique subjects assigned to those sections
    const classSubjects = await prisma.classSubject.findMany({
      where: { classSectionId: { in: classSectionIds } },
      include: {
        subject: { select: { id: true, code: true, name: true, abbreviation: true } },
      },
    });

    // Deduplicate by subject id
    const seen = new Set<string>();
    const subjects = classSubjects
      .map((cs) => cs.subject)
      .filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json(subjects);
  } catch (err) {
    next(err);
  }
});

// 6. Get all branches (for Exam Builder branch dropdown)
router.get("/branches", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return res.status(200).json(branches);
  } catch (err) {
    next(err);
  }
});

export default router;
