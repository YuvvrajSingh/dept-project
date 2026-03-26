import { EntryType, SubjectType } from "@prisma/client";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "../src/prisma/client";

const DAY_LABELS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const SLOT_LABELS: Record<number, string> = {
  1: "I (10:00-10:55)",
  2: "II (10:55-11:50)",
  3: "III (11:50-12:45)",
  4: "IV (14:00-14:55)",
  5: "V (14:55-15:50)",
  6: "VI (15:50-16:45)",
};

function cell(value: string | number | null | undefined): string {
  return String(value ?? "-").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function table(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const head = `| ${headers.map(cell).join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.length
    ? rows.map((row) => `| ${row.map(cell).join(" | ")} |`).join("\n")
    : `| ${headers.map(() => "-").join(" | ")} |`;

  return [head, sep, body].join("\n");
}

async function main() {
  const [
    branches,
    classSections,
    subjects,
    teachers,
    teacherSubjects,
    classSubjects,
    rooms,
    labs,
    timetableEntries,
  ] = await Promise.all([
    prisma.branch.findMany({
      include: { sections: true },
      orderBy: { id: "asc" },
    }),
    prisma.classSection.findMany({
      include: { branch: true },
      orderBy: [{ branch: { name: "asc" } }, { year: "asc" }],
    }),
    prisma.subject.findMany({
      orderBy: { id: "asc" },
    }),
    prisma.teacher.findMany({
      orderBy: { id: "asc" },
    }),
    prisma.teacherSubject.findMany({
      include: { teacher: true, subject: true },
      orderBy: [{ teacherId: "asc" }, { subjectId: "asc" }],
    }),
    prisma.classSubject.findMany({
      include: { classSection: { include: { branch: true } }, subject: true },
      orderBy: [{ classSectionId: "asc" }, { subjectId: "asc" }],
    }),
    prisma.room.findMany({ orderBy: { id: "asc" } }),
    prisma.lab.findMany({ orderBy: { id: "asc" } }),
    prisma.timetableEntry.findMany({
      include: {
        classSection: { include: { branch: true } },
        subject: true,
        teacher: true,
        room: true,
        labGroups: { include: { lab: true, teacher: true } },
      },
      orderBy: [{ classSectionId: "asc" }, { day: "asc" }, { slotStart: "asc" }],
    }),
  ]);

  const lines: string[] = [];
  lines.push("# Timetable Data Overview");
  lines.push("");
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Branches: ${branches.length}`);
  lines.push(`- Class Sections: ${classSections.length}`);
  lines.push(`- Subjects: ${subjects.length}`);
  lines.push(`- Teachers: ${teachers.length}`);
  lines.push(`- Teacher-Subject Assignments: ${teacherSubjects.length}`);
  lines.push(`- Class-Subject Assignments: ${classSubjects.length}`);
  lines.push(`- Rooms: ${rooms.length}`);
  lines.push(`- Labs: ${labs.length}`);
  lines.push(`- Timetable Entries: ${timetableEntries.length}`);
  lines.push("");

  lines.push("## Branches And Sections");
  lines.push("");
  lines.push(
    table(
      ["Branch", "Section IDs"],
      branches.map((b) => [
        b.name,
        b.sections
          .sort((a, c) => a.year - c.year)
          .map((s) => `ID ${s.id} (Year ${s.year})`)
          .join(", "),
      ]),
    ),
  );
  lines.push("");

  lines.push("## Class Sections");
  lines.push("");
  lines.push(
    table(
      ["ClassSection ID", "Branch", "Year"],
      classSections.map((c) => [c.id, c.branch.name, c.year]),
    ),
  );
  lines.push("");

  lines.push("## Subjects");
  lines.push("");
  lines.push(
    table(
      ["Subject ID", "Code", "Name", "Type", "Credits"],
      subjects.map((s) => [s.id, s.code, s.name, s.type === SubjectType.THEORY ? "THEORY" : "LAB", s.creditHours]),
    ),
  );
  lines.push("");

  lines.push("## Teachers");
  lines.push("");
  lines.push(
    table(
      ["Teacher ID", "Abbreviation", "Name"],
      teachers.map((t) => [t.id, t.abbreviation, t.name]),
    ),
  );
  lines.push("");

  lines.push("## Subject Assignments To Teachers");
  lines.push("");
  lines.push(
    table(
      ["Teacher", "Subject"],
      teacherSubjects.map((ts) => [
        `${ts.teacher.abbreviation} (${ts.teacher.name})`,
        `${ts.subject.code} - ${ts.subject.name}`,
      ]),
    ),
  );
  lines.push("");

  lines.push("## Subject Assignments To Class Sections");
  lines.push("");
  lines.push(
    table(
      ["Class Section", "Subject"],
      classSubjects.map((cs) => [
        `${cs.classSection.branch.name} Year ${cs.classSection.year} (ID ${cs.classSection.id})`,
        `${cs.subject.code} - ${cs.subject.name}`,
      ]),
    ),
  );
  lines.push("");

  lines.push("## Rooms");
  lines.push("");
  lines.push(table(["Room ID", "Name", "Capacity"], rooms.map((r) => [r.id, r.name, r.capacity])));
  lines.push("");

  lines.push("## Labs");
  lines.push("");
  lines.push(table(["Lab ID", "Name", "Capacity"], labs.map((l) => [l.id, l.name, l.capacity])));
  lines.push("");

  lines.push("## Timetable Entries");
  lines.push("");

  const timetableRows = timetableEntries.flatMap((entry) => {
    const baseClass = `${entry.classSection.branch.name} Year ${entry.classSection.year} (ID ${entry.classSection.id})`;
    const dayLabel = DAY_LABELS[entry.day] ?? `Day ${entry.day}`;
    const slotLabel =
      entry.entryType === EntryType.LAB
        ? `${SLOT_LABELS[entry.slotStart]} + ${SLOT_LABELS[entry.slotEnd]}`
        : SLOT_LABELS[entry.slotStart] ?? `Slot ${entry.slotStart}`;

    if (entry.entryType === EntryType.THEORY) {
      return [
        [
          entry.id,
          baseClass,
          dayLabel,
          slotLabel,
          "THEORY",
          `${entry.subject.code} - ${entry.subject.name}`,
          entry.teacher ? `${entry.teacher.abbreviation} (${entry.teacher.name})` : "-",
          entry.room ? entry.room.name : "-",
          "-",
        ],
      ];
    }

    const groupSummary = entry.labGroups
      .map((g) => `${g.groupName}: ${g.lab.name} with ${g.teacher.abbreviation}`)
      .join("; ");

    return [
      [
        entry.id,
        baseClass,
        dayLabel,
        slotLabel,
        "LAB",
        `${entry.subject.code} - ${entry.subject.name}`,
        "-",
        "-",
        groupSummary || "-",
      ],
    ];
  });

  lines.push(
    table(
      [
        "Entry ID",
        "Class Section",
        "Day",
        "Slot",
        "Type",
        "Subject",
        "Teacher",
        "Room",
        "Lab Groups",
      ],
      timetableRows,
    ),
  );
  lines.push("");

  const outputPath = resolve(process.cwd(), "DATA_OVERVIEW.md");
  writeFileSync(outputPath, lines.join("\n"), "utf8");

  console.log(`Data overview generated at ${outputPath}`);
}

main()
  .catch((error) => {
    console.error("Failed to generate data overview", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
