import type { Request, Response } from "express";
import { prisma } from "../prisma/client";
import bcrypt from "bcryptjs";

export class InternalController {
  
  // POST /api/internal/auth/teacher
  public async verifyTeacher(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "BAD_REQUEST", message: "Email and password are required" });
        return;
      }

      // Check User table for auth (teachers are mapped to Users)
      const user = await prisma.user.findUnique({
        where: { email },
        include: { teacher: true }
      });

      if (!user || user.role !== "TEACHER" || !user.teacher) {
        res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid credentials or not a teacher" });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid credentials" });
        return;
      }

      const teacher = user.teacher;
      // Send back safe info for the microservice
      res.json({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        abbreviation: teacher.abbreviation,
      });
    } catch (err) {
      console.error("[InternalController] verifyTeacher error:", err);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Server error" });
    }
  }

  // POST /api/internal/auth/student
  public async verifyStudent(req: Request, res: Response): Promise<void> {
    try {
      const { email, rollNumber, password } = req.body;
      if (!password || (!email && !rollNumber)) {
        res.status(400).json({ error: "BAD_REQUEST", message: "Roll number/email and password are required" });
        return;
      }

      const student = await prisma.student.findFirst({
        where: rollNumber ? { rollNumber } : { email: email as string }
      });

      if (!student || !student.passwordHash) {
        res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid credentials or uninitialized account" });
        return;
      }

      const isMatch = await bcrypt.compare(password, student.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid credentials" });
        return;
      }

      // Strip passwordHash before sending
      const { passwordHash, ...safeStudent } = student;
      res.json(safeStudent);
    } catch (err) {
      console.error("[InternalController] verifyStudent error:", err);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Server error" });
    }
  }

  // GET /api/internal/students
  // Query strings supported: classSectionId, year, branch
  public async getStudents(req: Request, res: Response): Promise<void> {
    try {
      const { classSectionId, year, branch, branchId } = req.query;
      
      const filter: any = {};
      if (classSectionId) filter.classSectionId = classSectionId;
      if (year || branch || branchId) {
        filter.classSection = {};
        if (year) filter.classSection.year = parseInt(year as string);
        if (branchId) filter.classSection.branchId = branchId;
        if (branch) filter.classSection.branch = { name: branch as string };
      }

      const students = await prisma.student.findMany({
        where: filter,
        include: {
          classSection: {
            include: { branch: true }
          }
        }
      });
      res.json(students);
    } catch (err) {
      console.error("[InternalController] getStudents error:", err);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Server error" });
    }
  }

  // GET /api/internal/subjects
  // Query strings supported: teacherId, classSectionId
  public async getSubjects(req: Request, res: Response): Promise<void> {
    try {
      const { teacherId, classSectionId } = req.query;
      const filter: any = {};
      
      if (teacherId) {
        filter.teacherSubjects = { some: { teacherId: teacherId as string } };
      }
      if (classSectionId) {
        filter.classSubjects = { some: { classSectionId: classSectionId as string } };
      }

      const subjects = await prisma.subject.findMany({ where: filter });
      res.json(subjects);
    } catch (err) {
      console.error("[InternalController] getSubjects error:", err);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Server error" });
    }
  }

  // GET /api/internal/teacher/assigned-classes
  // Query strings supported: teacherId
  public async getAssignedClasses(req: Request, res: Response): Promise<void> {
    try {
      const { teacherId } = req.query;
      if (!teacherId) {
        res.status(400).json({ error: "BAD_REQUEST", message: "teacherId is required" });
        return;
      }

      const regularEntries = await prisma.timetableEntry.findMany({
        where: { teacherId: teacherId as string, subjectId: { not: null } },
        select: { classSectionId: true, subjectId: true, classSection: { include: { branch: true } }, subject: true },
        distinct: ['classSectionId', 'subjectId']
      });

      const labEntries = await prisma.labGroupEntry.findMany({
        where: { teacherId: teacherId as string },
        select: { subjectId: true, timetableEntry: { select: { classSectionId: true, classSection: { include: { branch: true } } } }, subject: true },
      });

      // Deduplicate all combos
      const uniquePairs = new Map<string, any>();

      regularEntries.forEach(entry => {
        if (!entry.subjectId) return;
        const key = `${entry.classSectionId}_${entry.subjectId}`;
        if (!uniquePairs.has(key)) {
          uniquePairs.set(key, {
            classSectionId: entry.classSectionId,
            branchName: entry.classSection.branch.name,
            year: entry.classSection.year,
            semester: entry.classSection.semester,
            subjectId: entry.subjectId,
            subjectName: entry.subject?.name,
            subjectType: entry.subject?.type
          });
        }
      });

      labEntries.forEach(lab => {
        const classSectionId = lab.timetableEntry.classSectionId;
        const key = `${classSectionId}_${lab.subjectId}`;
        if (!uniquePairs.has(key)) {
          uniquePairs.set(key, {
            classSectionId: classSectionId,
            branchName: lab.timetableEntry.classSection.branch.name,
            year: lab.timetableEntry.classSection.year,
            semester: lab.timetableEntry.classSection.semester,
            subjectId: lab.subjectId,
            subjectName: lab.subject.name,
            subjectType: lab.subject.type
          });
        }
      });

      res.json(Array.from(uniquePairs.values()));
    } catch (err) {
      console.error("[InternalController] getAssignedClasses error:", err);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Server error" });
    }
  }
}
