import type {
  LabGroupEntry,
  Lab,
  Subject,
  Teacher,
  Room,
  TimetableEntry,
} from "@prisma/client";
import { DAY_LABELS } from "./timetableConstants";

type LabGroupWithRelations = LabGroupEntry & {
  subject: Subject | null;
  lab: Lab;
  teacher: Teacher;
};

type TimetableEntryWithRelations = TimetableEntry & {
  subject: Subject | null;
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
  groups: Record<
    string,
    {
      subjectId: number | null;
      subjectCode: string;
      subjectName: string;
      labId: number;
      teacherId: number;
      lab: string;
      teacher: string;
    }
  >;
};

type MatrixCell = TheoryCell | LabCell | null;

type DayMatrix = {
  label: string;
  slots: Record<string, MatrixCell>;
};

export type TimetableMatrix = Record<string, DayMatrix>;

export function buildMatrix(
  entries: TimetableEntryWithRelations[],
): TimetableMatrix {
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
      if (!entry.subject) {
        continue;
      }

      matrix[dayKey].slots[String(entry.slotStart)] = {
        type: "THEORY",
        entryId: entry.id,
        subjectId: entry.subjectId ?? entry.subject.id,
        teacherId: entry.teacherId,
        roomId: entry.roomId,
        subjectCode: entry.subject.code,
        subjectName: entry.subject.name,
        teacherAbbr: entry.teacher?.abbreviation ?? null,
        roomName: entry.room?.name ?? null,
      };
      continue;
    }

    const groups = entry.labGroups.reduce<
      Record<
        string,
        {
          subjectId: number | null;
          subjectCode: string;
          subjectName: string;
          labId: number;
          teacherId: number;
          lab: string;
          teacher: string;
        }
      >
    >((acc, group) => {
      acc[group.groupName] = {
        subjectId: group.subjectId,
        subjectCode: group.subject?.code ?? entry.subject?.code ?? "N/A",
        subjectName:
          group.subject?.name ?? entry.subject?.name ?? "Unknown Subject",
        labId: group.labId,
        teacherId: group.teacherId,
        lab: group.lab.name,
        teacher: group.teacher.abbreviation,
      };
      return acc;
    }, {});

    matrix[dayKey].slots[String(entry.slotStart)] = {
      type: "LAB",
      entryId: entry.id,
      groups,
    };
  }

  return matrix;
}
