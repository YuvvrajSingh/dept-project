import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, SubjectType } from "@prisma/client";
import bcrypt from "bcryptjs";

// Keep in sync with legacy data constants
const subjectsRaw = [
  { code: "6CSE41A", name: "Neural Networks", type: "THEORY", creditHours: 3 },
  { code: "6ADS42A", name: "Natural Language Processing", type: "THEORY", creditHours: 3 },
  { code: "6ADS51A", name: "Big Data Analytics", type: "THEORY", creditHours: 4 },
  { code: "6CSE11B", name: "Neural Networks Laboratory", type: "LAB", creditHours: 2 },
  { code: "6ADS13B", name: "Big Data Analytics Laboratory", type: "LAB", creditHours: 2 },
  { code: "4ADS41A", name: "Design and Analysis of Algorithms", type: "THEORY", creditHours: 4 },
  { code: "4ADS42A", name: "Web Technologies", type: "THEORY", creditHours: 3 },
  { code: "4ADS43A", name: "Computer Networks", type: "THEORY", creditHours: 4 },
  { code: "4ADS44A", name: "Database Management Systems", type: "THEORY", creditHours: 4 },
  { code: "4ADS35A", name: "Fundamentals of Statistical Inference", type: "THEORY", creditHours: 3 },
  { code: "4ADS42B", name: "Web Technologies Laboratory", type: "LAB", creditHours: 2 },
  { code: "4ADS43B", name: "Computer Networks Laboratory", type: "LAB", creditHours: 2 },
  { code: "4ADS44B", name: "Database Management Systems Laboratory", type: "LAB", creditHours: 2 },
  { code: "4ADS35B", name: "Statistical Inference using Python Laboratory", type: "LAB", creditHours: 3 },
  { code: "4IT41A", name: "Design and Analysis of Algorithms", type: "THEORY", creditHours: 4 },
  { code: "4IT42A", name: "Web Technologies", type: "THEORY", creditHours: 3 },
  { code: "4IT43A", name: "Computer Networks", type: "THEORY", creditHours: 4 },
  { code: "4IT44A", name: "Database Management Systems", type: "THEORY", creditHours: 4 },
  { code: "4IT45A", name: "Computer Organization and Architecture", type: "THEORY", creditHours: 3 },
  { code: "4IT42B", name: "Web Technologies Laboratory", type: "LAB", creditHours: 2 },
  { code: "4IT43B", name: "Computer Networks Laboratory", type: "LAB", creditHours: 2 },
  { code: "4IT44B", name: "Database Management Systems Laboratory", type: "LAB", creditHours: 2 },
  { code: "4IT45B", name: "Computer Organization and Architecture Laboratory", type: "LAB", creditHours: 2 },
  { code: "6IT41A", name: "Robotics and Embedded System", type: "THEORY", creditHours: 3 },
  { code: "6IT42A", name: "Wireless and Mobile Computing", type: "THEORY", creditHours: 3 },
  { code: "6IT52A", name: "Modern Web Development", type: "THEORY", creditHours: 4 },
  { code: "6CSE53A", name: "Advanced Machine Learning", type: "THEORY", creditHours: 4 },
  { code: "6CSE41B", name: "Robotics and Embedded System Laboratory", type: "LAB", creditHours: 2 },
  { code: "6IT52B", name: "Modern Web Development Laboratory", type: "LAB", creditHours: 2 },
  { code: "6ADS42B", name: "Natural Language Processing Laboratory", type: "LAB", creditHours: 2 },
  { code: "6CSE53B", name: "Advanced Machine Learning Laboratory", type: "LAB", creditHours: 2 },
  { code: "4CSE41A", name: "Design and Analysis of Algorithms", type: "THEORY", creditHours: 4 },
  { code: "4CSE42A", name: "Web Technologies", type: "THEORY", creditHours: 3 },
  { code: "4CSE43A", name: "Computer Networks", type: "THEORY", creditHours: 4 },
  { code: "4CSE44A", name: "Database Management Systems", type: "THEORY", creditHours: 3 },
  { code: "4CSE45A", name: "Computer Organization and Architecture", type: "THEORY", creditHours: 4 },
  { code: "4CSE42B", name: "Web Technologies Laboratory", type: "LAB", creditHours: 2 },
  { code: "4CSE43B", name: "Computer Networks Laboratory", type: "LAB", creditHours: 2 },
  { code: "4CSE44B", name: "Database Management Systems Laboratory", type: "LAB", creditHours: 2 },
  { code: "4CSE45B", name: "Computer Organization and Architecture Laboratory", type: "LAB", creditHours: 2 },
  { code: "6CSE42A", name: "Principle of Compiler Design", type: "THEORY", creditHours: 3 },
  { code: "6CSE51A", name: "Image Processing", type: "THEORY", creditHours: 4 },
  { code: "6CSE51B", name: "Image Processing Laboratory", type: "LAB", creditHours: 2 },
];

const renames: Record<string, string> = {
  "6CSE41A": "6ADS41A",
  "6CSE11B": "6ADS41B",
  "6ADS13B": "6ADS51B",
};

const ABBR: Record<string, string> = {
  "6ADS41A": "NN", "6ADS42A": "NLP", "6ADS51A": "BDA", "6CSE11A": "RES",
  "6ADS41B": "NNL", "6ADS51B": "BDAL", "4ADS41A": "DAA", "4ADS42A": "WT",
  "4ADS43A": "CN", "4ADS44A": "DBMS", "4ADS35A": "FSI", "4ADS42B": "WTL",
  "4ADS43B": "CNL", "4ADS44B": "DBMSL", "4ADS35B": "SIPL", "4IT41A": "DAA",
  "4IT42A": "WT", "4IT43A": "CN", "4IT44A": "DBMS", "4IT45A": "COA",
  "4IT42B": "WTL", "4IT43B": "CNL", "4IT44B": "DBMSL", "4IT45B": "COAL",
  "6IT41A": "RES", "6IT42A": "WMC", "6IT52A": "MWD", "6CSE53A": "AML",
  "6CSE41B": "RESL", "6IT52B": "MWDL", "6ADS42B": "NLPL", "6CSE53B": "AMLL",
  "4CSE41A": "DAA", "4CSE42A": "WT", "4CSE43A": "CN", "4CSE44A": "DBMS",
  "4CSE45A": "COA", "4CSE42B": "WTL", "4CSE43B": "CNL", "4CSE44B": "DBMSL",
  "4CSE45B": "COAL", "6CSE42A": "PCD", "6CSE51A": "IP", "6CSE51B": "IPL",
};

const teachersRaw = [
  { abbreviation: "ABG", name: "Mr. Abhisek Gour" },
  { abbreviation: "AC", name: "Ms. Arpita Choudhary" },
  { abbreviation: "AG", name: "Dr. Anil Gupta" },
  { abbreviation: "AP", name: "Mr. Aakash Purohit" },
  { abbreviation: "ASG", name: "Dr. Alok Singh Gehlot" },
  { abbreviation: "DC", name: "Ms. Deepika Chopra" },
  { abbreviation: "JP", name: "Ms. Juhi Prihar" },
  { abbreviation: "MR", name: "Ms. Monika Rajpurohit" },
  { abbreviation: "MS", name: "Ms. Meenakshi Shankala" },
  { abbreviation: "NCB", name: "Dr. N. C. Barwar" },
  { abbreviation: "PJ", name: "Ms. Priyanka Joshi" },
  { abbreviation: "PS", name: "Ms. Priya Sharma" },
  { abbreviation: "RK", name: "Mr. Ram Kishore" },
  { abbreviation: "SC", name: "Dr. Simran Choudhary" },
  { abbreviation: "SM", name: "Mr. Shubham Mathur" },
  { abbreviation: "SR", name: "Dr. Shrwan Ram" },
  { abbreviation: "VA", name: "Ms. Vanshika Arya" },
];

const TEACHER_ASSIGNMENTS: Record<string, string[]> = {
  AG: ["4ADS41A", "4IT41A", "4CSE41A"],
  ABG: ["6ADS41A", "6ADS41B", "6CSE51A", "6CSE51B"],
  MR: ["6ADS42A", "6ADS42B"],
  AC: ["6ADS51A", "6ADS51B", "4ADS42A", "4ADS42B"],
  ASG: ["6ADS41A", "6IT41A", "6CSE41B"],
  PJ: ["6CSE51A", "6CSE51B", "6IT52B", "6CSE42A"],
  DC: ["4ADS43A", "4ADS43B", "4CSE44A", "4CSE44B"],
  SM: ["4ADS44A", "4ADS44B", "4CSE45A", "4CSE45B"],
  SR: ["4ADS35A", "4ADS35B", "4CSE42A"],
  PS: ["4ADS42B", "4ADS44B", "6IT52B"],
  JP: ["4ADS43B", "4ADS44B", "4IT44A", "4IT44B", "6IT42A"],
  RK: ["4IT42A", "4IT42B", "4CSE43B"],
  NCB: ["4IT43A", "4CSE43A", "4IT43B"],
  AP: ["4IT45A", "4IT45B", "4CSE42B"],
  MS: ["6IT52A", "6IT52B"],
  SC: ["6CSE53A", "6CSE53B"],
  VA: ["6CSE41B", "6CSE53B"],
};

const CLASS_ASSIGNMENTS: Record<string, string[]> = {
  "ADS:4": ["4ADS41A", "4ADS42A", "4ADS43A", "4ADS44A", "4ADS35A", "4ADS42B", "4ADS43B", "4ADS44B", "4ADS35B"],
  "ADS:6": ["6ADS41A", "6ADS42A", "6ADS51A", "6ADS41A", "6CSE51A", "6ADS41B", "6ADS51B", "6CSE41B", "6CSE51B"],
  "IT:4": ["4IT41A", "4IT42A", "4IT43A", "4IT44A", "4IT45A", "4IT42B", "4IT43B", "4IT44B", "4IT45B"],
  "IT:6": ["6IT41A", "6IT42A", "6IT52A", "6ADS42A", "6CSE53A", "6CSE41B", "6IT52B", "6ADS42B", "6CSE53B"],
  "CSE:4": ["4CSE41A", "4CSE42A", "4CSE43A", "4CSE44A", "4CSE45A", "4CSE42B", "4CSE43B", "4CSE44B", "4CSE45B"],
  "CSE:6": ["6ADS41A", "6CSE42A", "6CSE51A", "6CSE53A", "6IT52A", "6CSE41B", "6CSE51B", "6CSE53B", "6IT52B"],
};

// ── SLOTS START ──
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SLOTS = [
  { label: "I",   order: 1, startTime: new Date("1970-01-01T10:00:00Z"), endTime: new Date("1970-01-01T10:55:00Z") },
  { label: "II",  order: 2, startTime: new Date("1970-01-01T10:55:00Z"), endTime: new Date("1970-01-01T11:50:00Z") },
  { label: "III", order: 3, startTime: new Date("1970-01-01T11:50:00Z"), endTime: new Date("1970-01-01T12:45:00Z") },
  { label: "IV",  order: 4, startTime: new Date("1970-01-01T14:00:00Z"), endTime: new Date("1970-01-01T14:55:00Z") },
  { label: "V",   order: 5, startTime: new Date("1970-01-01T14:55:00Z"), endTime: new Date("1970-01-01T15:50:00Z") },
  { label: "VI",  order: 6, startTime: new Date("1970-01-01T15:50:00Z"), endTime: new Date("1970-01-01T16:45:00Z") },
];

const BRANCH_NAMES = ["CSE", "IT", "ADS"];
const SEMESTERS = [2, 4, 6]; 

async function main() {
  console.log("--- Starting Seed ---");
  // 1. Clear database
  await prisma.entryCancellation.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.labGroupEntry.deleteMany();
  await prisma.timetableEntry.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.user.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.classSection.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.room.deleteMany();
  await prisma.lab.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.academicYear.deleteMany();

  // 2. Foundational Data
  await prisma.slot.createMany({ data: SLOTS, skipDuplicates: true });
  console.log("✓ Slots");

  const ac2025 = await prisma.academicYear.create({
    data: {
      label: "2025-2026", startYear: 2025, endYear: 2026,
      startDate: new Date("2025-07-01"), endDate: new Date("2026-05-31"),
      status: "ARCHIVED", isActive: false,
    },
  });
  const ac2026 = await prisma.academicYear.create({
    data: {
      label: "2026-2027", startYear: 2026, endYear: 2027,
      startDate: new Date("2026-07-01"), endDate: new Date("2027-05-31"),
      status: "ACTIVE", isActive: true,
    },
  });
  console.log("✓ Academic Years");

  const branches = await Promise.all(BRANCH_NAMES.map((name) => prisma.branch.create({ data: { name } })));
  console.log("✓ Branches");

  for (const branch of branches) {
    for (const semester of SEMESTERS) {
      const year = Math.ceil(semester / 2);
      await prisma.classSection.create({ data: { branchId: branch.id, academicYearId: ac2025.id, year, semester } });
      await prisma.classSection.create({ data: { branchId: branch.id, academicYearId: ac2026.id, year, semester } });
    }
  }
  console.log("✓ Class Sections");

  await Promise.all(Array.from({ length: 9 }).map((_, i) => prisma.room.create({ data: { name: `CSE-${i + 1}`, capacity: 60 } })));
  await Promise.all(Array.from({ length: 6 }).map((_, i) => prisma.lab.create({ data: { name: `LAB-${i + 1}`, capacity: 30 } })));
  console.log("✓ Rooms/Labs");

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@dept.local").trim().toLowerCase();
  const passwordHash = await bcrypt.hash("changeme", 12);
  await prisma.user.create({ data: { email: adminEmail, passwordHash, role: Role.ADMIN } });
  console.log("✓ Admin User");

  // 3. Subjects & Teachers (Legacy)
  const processedSubs = subjectsRaw.map((s) => {
    let code = renames[s.code] || s.code;
    return { code, name: s.name, type: s.type as SubjectType, creditHours: s.creditHours, abbreviation: ABBR[code] || code };
  });
  const uniqueSubs = Array.from(new Map(processedSubs.map(s => [s.code, s])).values());
  await prisma.subject.createMany({ data: uniqueSubs });
  await prisma.teacher.createMany({ data: teachersRaw });
  console.log("✓ Legacy Subjects/Teachers");

  // 4. Mappings
  const [dbSubs, dbTeacs, dbClasses] = await Promise.all([
    prisma.subject.findMany(), prisma.teacher.findMany(), prisma.classSection.findMany({ include: { branch: true } })
  ]);
  const subMap = Object.fromEntries(dbSubs.map(s => [s.code, s.id]));
  const tecMap = Object.fromEntries(dbTeacs.map(t => [t.abbreviation, t.id]));

  for (const [abbr, codes] of Object.entries(TEACHER_ASSIGNMENTS)) {
    const tid = tecMap[abbr];
    if (!tid) continue;
    for (const raw of codes) {
      const sid = subMap[renames[raw] || raw];
      if (sid) {
        await prisma.teacherSubject.create({ data: { teacherId: tid, subjectId: sid } }).catch(() => {});
      }
    }
  }

  // NOTE: CLASS_ASSIGNMENTS keys are something like "ADS:4". We need it for both 2025 and 2026.
  for (const cls of dbClasses) {
    if (!cls.branch) continue;
    let bName = cls.branch.name === "AI" || cls.branch.name === "AID" ? "ADS" : cls.branch.name;
    const key = `${bName}:${cls.semester}`;
    const codes = CLASS_ASSIGNMENTS[key];
    if (codes) {
      for (const raw of codes) {
        const sid = subMap[renames[raw] || raw];
        if (sid) {
          await prisma.classSubject.create({ data: { classSectionId: cls.id, subjectId: sid } }).catch(() => {});
        }
      }
    }
  }
  console.log("✓ Legacy Mappings");

  console.log("\n--- Seed Completed Successfully ---");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
