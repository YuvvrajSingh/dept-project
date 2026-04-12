import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, SubjectType } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Slot definitions are the single source of truth for time periods.
// Keep in sync with src/utils/timetableConstants.ts.
// These rows must exist before any TimetableEntry can be created (FK constraint).
const SLOTS = [
  { label: "I",   order: 1, startTime: new Date("1970-01-01T10:00:00Z"), endTime: new Date("1970-01-01T10:55:00Z") },
  { label: "II",  order: 2, startTime: new Date("1970-01-01T10:55:00Z"), endTime: new Date("1970-01-01T11:50:00Z") },
  { label: "III", order: 3, startTime: new Date("1970-01-01T11:50:00Z"), endTime: new Date("1970-01-01T12:45:00Z") },
  { label: "IV",  order: 4, startTime: new Date("1970-01-01T14:00:00Z"), endTime: new Date("1970-01-01T14:55:00Z") },
  { label: "V",   order: 5, startTime: new Date("1970-01-01T14:55:00Z"), endTime: new Date("1970-01-01T15:50:00Z") },
  { label: "VI",  order: 6, startTime: new Date("1970-01-01T15:50:00Z"), endTime: new Date("1970-01-01T16:45:00Z") },
];

const BRANCH_NAMES = ["CSE", "IT", "AI"];
const YEARS = [2, 3, 4];

const TEACHERS = [
  { name: "Mr. Abhisek Gour", abbreviation: "ABG" },
  { name: "Ms. Simran Mehta", abbreviation: "SM" },
  { name: "Mr. Pranav Joshi", abbreviation: "PJ" },
  { name: "Dr. Shreya Rao", abbreviation: "SR" },
  { name: "Ms. Kiran Nair", abbreviation: "KN" },
];

const SUBJECTS = [
  {
    code: "7ADS41A",
    name: "Generative Artificial Intelligence",
    type: SubjectType.THEORY,
    creditHours: 4,
  },
  {
    code: "7ADS42B",
    name: "Computer Vision",
    type: SubjectType.THEORY,
    creditHours: 4,
  },
  {
    code: "7ADSL45L",
    name: "Computer Vision Lab",
    type: SubjectType.LAB,
    creditHours: 2,
  },
];

async function main() {
  // ── 1. Clear dependent tables in FK-safe order ──────────────────────────────
  await prisma.notificationLog.deleteMany();
  await prisma.labGroupEntry.deleteMany();
  await prisma.timetableEntry.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.classSection.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.room.deleteMany();
  await prisma.lab.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.academicYear.deleteMany();

  // ── 2. Slots — must be created before any TimetableEntry (FK: slotId) ───────
  await prisma.slot.createMany({ data: SLOTS, skipDuplicates: true });
  console.log("✓ Slots seeded");

  // ── 3. Academic Year ─────────────────────────────────────────────────────────
  const academicYear = await prisma.academicYear.create({
    data: {
      label: "2025-2026",
      startYear: 2025,
      endYear: 2026,
      startDate: new Date("2025-07-01"),
      endDate: new Date("2026-05-31"),
      status: "ACTIVE",
      isActive: true,
    },
  });
  console.log("✓ Academic year seeded");

  // ── 4. Branches ──────────────────────────────────────────────────────────────
  const branches = await Promise.all(
    BRANCH_NAMES.map((name) => prisma.branch.create({ data: { name } })),
  );
  console.log("✓ Branches seeded");

  // ── 5. Class Sections ────────────────────────────────────────────────────────
  for (const branch of branches) {
    for (const year of YEARS) {
      const semester = year * 2 - 1; // year 2 → sem 3, year 3 → sem 5, year 4 → sem 7
      await prisma.classSection.create({
        data: {
          branchId: branch.id,
          academicYearId: academicYear.id,
          year,
          semester,
        },
      });
    }
  }
  console.log("✓ Class sections seeded");

  // ── 6. Rooms & Labs ──────────────────────────────────────────────────────────
  await Promise.all(
    Array.from({ length: 7 }).map((_, index) =>
      prisma.room.create({ data: { name: `R-${index + 1}`, capacity: 60 } }),
    ),
  );

  await Promise.all(
    Array.from({ length: 5 }).map((_, index) =>
      prisma.lab.create({ data: { name: `LAB-${index + 1}`, capacity: 20 } }),
    ),
  );
  console.log("✓ Rooms and labs seeded");

  // ── 7. Teachers & Subjects ───────────────────────────────────────────────────
  const teachers = await prisma.teacher.findMany();
  const subjects = await prisma.subject.findMany();
  const classSections = await prisma.classSection.findMany();

  // Assign all subjects to all teachers (for demo)
  for (const t of teachers) {
    for (const s of subjects) {
      await prisma.teacherSubject.create({ data: { teacherId: t.id, subjectId: s.id } });
    }
  }

  // Assign all subjects to all class sections (for demo)
  for (const cs of classSections) {
    for (const s of subjects) {
      await prisma.classSubject.create({ data: { classSectionId: cs.id, subjectId: s.id } });
    }
  }
  console.log("✓ Assignments seeded");

  console.log("\nSeed completed successfully ✓");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
