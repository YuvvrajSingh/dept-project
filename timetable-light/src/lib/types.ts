// ── Domain Types matching the backend Prisma schema ──

export interface Branch {
  id: string;
  name: string;
}

export interface AcademicYear {
  id: string;
  label: string;
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isActive: boolean;
  _count?: { classSections: number };
}

export interface ClassSection {
  id: string;
  academicYearId: string;
  branchId: string;
  year: number;
  semester: number;
  branch: Branch;
  academicYear?: AcademicYear;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  type: "THEORY" | "LAB";
  creditHours: number;
  isActive?: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  abbreviation: string;
  email?: string;
}

export interface TeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
  teacher?: Teacher;
  subject?: Subject;
}

export interface ClassSubject {
  id: string;
  classSectionId: string;
  subjectId: string;
  classSection?: ClassSection;
  subject?: Subject;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export interface Lab {
  id: string;
  name: string;
  capacity: number;
}

export interface LabGroupEntry {
  id: string;
  groupName: string; // "A1" | "A2" | "A3"
  labId: string;
  teacherId: string;
  lab?: Lab;
  teacher?: Teacher;
}

export interface TimetableEntry {
  id: string;
  classSectionId: string;
  day: number;
  slotId: string;
  slot: { order: number; label: string; startTime: string; endTime: string };
  entryType: "LECTURE" | "LAB";
  subjectId: string;
  teacherId?: string;
  roomId?: string;
  subject?: Subject;
  teacher?: Teacher;
  room?: Room;
  classSection?: ClassSection;
  labGroups?: LabGroupEntry[];
}

// ── Timetable matrix response shape ──

export interface TheorySlot {
  type: "THEORY";
  entryId: string;
  subjectId: string;
  teacherId: string | null;
  roomId: string | null;
  subjectCode: string;
  subjectName: string;
  teacherAbbr: string | null;
  roomName: string | null;
}

export interface LabSlot {
  type: "LAB";
  entryId: string;
  groups: Record<string, {
    subjectId: string | null;
    subjectCode: string;
    subjectName: string;
    labId: string;
    teacherId: string;
    lab: string;
    teacher: string;
  }>;
}

export interface LabContinuationSlot {
  type: "LAB_CONTINUATION";
  mergedWith: string;
}

export type SlotData = TheorySlot | LabSlot | LabContinuationSlot | null;

export interface DaySchedule {
  label: string;
  slots: Record<string, SlotData>;
}

export interface TimetableMatrix {
  classSectionId: string;
  branch: string;
  year: number;
  timetable: Record<string, DaySchedule>;
}

// ── Constants ──

export const SLOT_TIMES: Record<number, { label: string; start: string; end: string }> = {
  1: { label: "I", start: "10:00", end: "10:55" },
  2: { label: "II", start: "10:55", end: "11:50" },
  3: { label: "III", start: "11:50", end: "12:45" },
  4: { label: "IV", start: "14:00", end: "14:55" },
  5: { label: "V", start: "14:55", end: "15:50" },
  6: { label: "VI", start: "15:50", end: "16:45" },
};

export const DAY_LABELS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export const DAY_SHORT: Record<number, string> = {
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
};
