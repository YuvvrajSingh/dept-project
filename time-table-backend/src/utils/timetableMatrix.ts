import type {
  LabGroupEntry,
  Lab,
  Subject,
  Teacher,
  Room,
  Slot,
  TimetableEntry,
} from "@prisma/client";
import { DAY_LABELS } from "./timetableConstants";

type LabGroupWithRelations = LabGroupEntry & {
  subject: Subject;
  lab: Lab;
  teacher: Teacher;
};

type TimetableEntryWithRelations = TimetableEntry & {
  slot: Slot;
  subject: Subject | null;
  teacher: Teacher | null;
  room: Room | null;
  labGroups: LabGroupWithRelations[];
};

type TheoryCell = {
  type: "THEORY";
  entryId: string;
  subjectId: string;
  teacherId: string | null;
  roomId: string | null;
  subjectCode: string;
  subjectName: string;
  teacherAbbr: string | null;
  roomName: string | null;
};

type LabCell = {
  type: "LAB";
  entryId: string;
  groups: Record<
    string,
    {
      subjectId: string;
      subjectCode: string;
      subjectName: string;
      labId: string;
      teacherId: string;
      lab: string;
      teacher: string;
    }
  >;
};

type LabContinuationCell = {
  type: "LAB_CONTINUATION";
  entryId: string;
};

type MatrixCell = TheoryCell | LabCell | LabContinuationCell | null;

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
    const slotOrder = entry.slot.order; // use order (1-6) as the matrix key

    if (entry.entryType === "LECTURE") {
      if (!entry.subject) {
        continue;
      }

      matrix[dayKey].slots[String(slotOrder)] = {
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

    // LAB entry — populate start slot and continuation slot(s)
    const groups = entry.labGroups.reduce<
      Record<
        string,
        {
          subjectId: string;
          subjectCode: string;
          subjectName: string;
          labId: string;
          teacherId: string;
          lab: string;
          teacher: string;
        }
      >
    >((acc, group) => {
      acc[group.groupName] = {
        subjectId: group.subjectId,
        subjectCode: group.subject.code,
        subjectName: group.subject.name,
        labId: group.labId,
        teacherId: group.teacherId,
        lab: group.lab.name,
        teacher: group.teacher.abbreviation,
      };
      return acc;
    }, {});

    matrix[dayKey].slots[String(slotOrder)] = {
      type: "LAB",
      entryId: entry.id,
      groups,
    };

    // LAB spans two consecutive slots: mark order+1 as a continuation cell
    const continuationOrder = slotOrder + 1;
    if (continuationOrder <= 6) {
      matrix[dayKey].slots[String(continuationOrder)] = {
        type: "LAB_CONTINUATION",
        entryId: entry.id,
      };
    }
  }

  return matrix;
}
