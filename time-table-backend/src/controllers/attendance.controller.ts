import type { Request, Response } from "express";
import { prisma } from "../prisma/client";

export class AttendanceController {
  
  // ── Mark bulk attendance ──
  public async markBulk(req: Request, res: Response): Promise<void> {
    try {
      const records: Array<{ studentId: string; subjectId: string; date: string; status: string }> = req.body;
      
      for (const record of records) {
        const d = new Date(record.date);
        d.setUTCHours(0, 0, 0, 0);

        const existing = await prisma.attendanceRecord.findFirst({
          where: {
            studentId: record.studentId,
            subjectId: record.subjectId,
            date: d
          }
        });

        if (existing) {
          await prisma.attendanceRecord.update({
            where: { id: existing.id },
            data: { status: record.status }
          });
        } else {
          await prisma.attendanceRecord.create({
            data: {
              studentId: record.studentId,
              subjectId: record.subjectId,
              date: d,
              status: record.status
            }
          });
        }
      }
      res.json({ message: "Attendance saved successfully" });
    } catch (err) {
      console.error("[AttendanceController] markBulk error:", err);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to save attendance" });
    }
  }

  // ── Student Attendance ──
  public async getStudentAttendance(req: Request, res: Response): Promise<void> {
    try {
      const rollNumber = req.params.rollNumber as string;
      if (!rollNumber) {
        res.status(400).json({ message: "rollNumber required" });
        return;
      }

      // Find student first to resolve id
      const student = await prisma.student.findUnique({
        where: { rollNumber }
      });

      if (!student) {
        res.status(404).json({ message: "Student not found" });
        return;
      }

      const records = await prisma.attendanceRecord.findMany({
        where: { studentId: student.id },
        include: { subject: true },
        orderBy: { date: 'desc' }
      });

      // Format for frontend
      const stats: Record<string, any> = {};
      
      records.forEach(r => {
        const sid = r.subjectId;
        if (!stats[sid]) {
          stats[sid] = {
            subject: r.subject,
            total: 0,
            present: 0
          };
        }
        stats[sid].total++;
        if (r.status === "Present") stats[sid].present++;
      });

      res.status(200).json({
        attendance: records,
        stats: Object.values(stats)
      });
    } catch (err) {
      console.error("[AttendanceController] getStudentAttendance error:", err);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to fetch student attendance" });
    }
  }

  // ── Assigned History ──
  public async getAssignedAll(req: Request, res: Response): Promise<void> {
    try {
      const { teacherId } = req.query;
      if (!teacherId) {
         res.status(400).json({ message: "teacherId required" });
         return;
      }

      // Re-use logic to find assigned classes
      const regularEntries = await prisma.timetableEntry.findMany({
        where: { teacherId: teacherId as string, subjectId: { not: null } },
        select: { classSectionId: true, subjectId: true, classSection: { include: { branch: true } } },
        distinct: ['classSectionId', 'subjectId']
      });

      const labEntries = await prisma.labGroupEntry.findMany({
        where: { teacherId: teacherId as string },
        select: { subjectId: true, timetableEntry: { select: { classSectionId: true, classSection: { include: { branch: true } } } } },
      });

      const assignedSubjectIds = new Set<string>();
      const classMap = new Map<string, string>(); // maps subjectId -> className

      regularEntries.forEach(e => {
        if (!e.subjectId) return;
        assignedSubjectIds.add(e.subjectId);
        classMap.set(e.subjectId, `${e.classSection.branch.name} Sem ${e.classSection.semester}`);
      });
      labEntries.forEach(e => {
        assignedSubjectIds.add(e.subjectId);
        classMap.set(e.subjectId, `${e.timetableEntry.classSection.branch.name} Sem ${e.timetableEntry.classSection.semester}`);
      });

      const records = await prisma.attendanceRecord.findMany({
        where: { subjectId: { in: Array.from(assignedSubjectIds) } },
        include: { student: true, subject: true },
        orderBy: { date: 'desc' }
      });

      // Map to frontend expectation
      const finalRecords = records.map(r => ({
        _id: r.id,
        date: r.date,
        status: r.status,
        studentId: r.student,
        subjectId: r.subject,
        className: classMap.get(r.subjectId) || "Unknown Class"
      }));

      res.json(finalRecords);
    } catch (err) {
      console.error("[AttendanceController] getAssignedAll error:", err);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Error fetching history" });
    }
  }

  // ── Update Single Record ──
  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      if (!["Present", "Absent"].includes(status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
      }

      const updated = await prisma.attendanceRecord.update({
        where: { id },
        data: { status },
        include: { student: true, subject: true }
      });

      res.json({ message: "Attendance updated", record: updated });
    } catch (err) {
      console.error("[AttendanceController] updateStatus error:", err);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Update failed" });
    }
  }
}
