import type { LabGroupEntry, Lab, Subject, Teacher, Room, TimetableEntry } from "@prisma/client";
import { DAY_LABELS } from "./timetableConstants";

type LabGroupWithRelations = LabGroupEntry & {
  lab: Lab;
  teacher: Teacher;
};

type TimetableEntryWithRelations = TimetableEntry & {
  subject: Subject;
  teacher: Teacher | null;
  room: Room | null;
  labGroups: LabGroupWithRelations[];
};

type TheoryCell = {
  type: "THEORY";
  entryId: number;
  subjectId: number;
  teacherId: number | null;
  roomId: number | null;
  subjectCode: string;
  subjectName: string;
  teacherAbbr: string | null;
  roomName: string | null;
};

type LabCell = {
  type: "LAB";
  entryId: number;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  spansSlots: [5, 6];
  groups: Record<string, { labId: number; teacherId: number; lab: string; teacher: string }>;
};

type LabContinuationCell = {
  type: "LAB_CONTINUATION";
  mergedWith: 5;
};

type MatrixCell = TheoryCell | LabCell | LabContinuationCell | null;

type DayMatrix = {
  label: string;
  slots: Record<string, MatrixCell>;
};

export type TimetableMatrix = Record<string, DayMatrix>;

export function buildMatrix(entries: TimetableEntryWithRelations[]): TimetableMatrix {
  const matrix: TimetableMatrix = {};

  for (let day = 1; day <= 6; day += 1) {
    matrix[String(day)] = {
      label: DAY_LABELS[day as keyof typeof DAY_LABELS],
      slots: {
        "1": null,
        "2": null,
        "3": null,
        "4": null,
        "5": null,
        "6": null,
      },
    };
  }

  for (const entry of entries) {
    const dayKey = String(entry.day);

    if (entry.entryType === "THEORY") {
      matrix[dayKey].slots[String(entry.slotStart)] = {
        type: "THEORY",
        entryId: entry.id,
        subjectId: entry.subjectId,
        teacherId: entry.teacherId,
        roomId: entry.roomId,
        subjectCode: entry.subject.code,
        subjectName: entry.subject.name,
        teacherAbbr: entry.teacher?.abbreviation ?? null,
        roomName: entry.room?.name ?? null,
      };
      continue;
    }

    if (entry.slotStart === 5) {
      const groups = entry.labGroups.reduce<Record<string, { labId: number; teacherId: number; lab: string; teacher: string }>>(
        (acc, group) => {
          acc[group.groupName] = {
            labId: group.labId,
            teacherId: group.teacherId,
            lab: group.lab.name,
            teacher: group.teacher.abbreviation,
          };
          return acc;
        },
        {},
      );

      matrix[dayKey].slots["5"] = {
        type: "LAB",
        entryId: entry.id,
        subjectId: entry.subjectId,
        subjectCode: entry.subject.code,
        subjectName: entry.subject.name,
        spansSlots: [5, 6],
        groups,
      };

      matrix[dayKey].slots["6"] = {
        type: "LAB_CONTINUATION",
        mergedWith: 5,
      };
    }
  }

  return matrix;
}
