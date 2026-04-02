// ── Domain Types matching the backend Prisma schema ──

export interface Branch {
  id: number;
  name: string; // "CSE" | "IT" | "AI"
}

export interface ClassSection {
  id: number;
  branchId: number;
  year: number; // 2 | 3 | 4
  branch: Branch;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  type: "THEORY" | "LAB";
  creditHours: number;
}

export interface Teacher {
  id: number;
  name: string;
  abbreviation: string;
  email?: string;
}

export interface TeacherSubject {
  id: number;
  teacherId: number;
  subjectId: number;
  teacher?: Teacher;
  subject?: Subject;
}

export interface ClassSubject {
  id: number;
  classSectionId: number;
  subjectId: number;
  classSection?: ClassSection;
  subject?: Subject;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
}

export interface Lab {
  id: number;
  name: string;
  capacity: number;
}

export interface LabGroupEntry {
  id: number;
  groupName: string; // "A1" | "A2" | "A3"
  labId: number;
  teacherId: number;
  lab?: Lab;
  teacher?: Teacher;
}

export interface TimetableEntry {
  id: number;
  classSectionId: number;
  day: number;
  slotStart: number;
  slotEnd: number;
  entryType: "THEORY" | "LAB";
  subjectId: number;
  teacherId?: number;
  roomId?: number;
  subject?: Subject;
  teacher?: Teacher;
  room?: Room;
  classSection?: ClassSection;
  labGroups?: LabGroupEntry[];
}

// ── Timetable matrix response shape ──

export interface TheorySlot {
  type: "THEORY";
  entryId: number;
  subjectId: number;
  teacherId: number | null;
  roomId: number | null;
  subjectCode: string;
  subjectName: string;
  teacherAbbr: string | null;
  roomName: string | null;
}

export interface LabSlot {
  type: "LAB";
  entryId: number;
  groups: Record<string, {
    subjectId: number | null;
    subjectCode: string;
    subjectName: string;
    labId: number;
    teacherId: number;
    lab: string;
    teacher: string;
  }>;
}

export interface LabContinuationSlot {
  type: "LAB_CONTINUATION";
  mergedWith: number;
}

export type SlotData = TheorySlot | LabSlot | LabContinuationSlot | null;

export interface DaySchedule {
  label: string;
  slots: Record<string, SlotData>;
}

export interface TimetableMatrix {
  classSectionId: number;
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
