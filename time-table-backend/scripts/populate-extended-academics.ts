import { SubjectType } from "@prisma/client";
import { prisma } from "../src/prisma/client";

type SubjectSeed = {
  code: string;
  name: string;
  type: SubjectType;
  creditHours: number;
};

const NEW_THEORY_SUBJECTS: SubjectSeed[] = [
  { code: "8TH201", name: "Advanced Data Structures", type: SubjectType.THEORY, creditHours: 4 },
  { code: "8TH202", name: "Database Management Systems", type: SubjectType.THEORY, creditHours: 4 },
  { code: "8TH203", name: "Operating Systems", type: SubjectType.THEORY, creditHours: 4 },
  { code: "8TH204", name: "Design And Analysis Of Algorithms", type: SubjectType.THEORY, creditHours: 4 },
  { code: "8TH205", name: "Software Engineering", type: SubjectType.THEORY, creditHours: 3 },
  { code: "8TH206", name: "Computer Networks", type: SubjectType.THEORY, creditHours: 4 },
  { code: "8TH207", name: "Theory Of Computation", type: SubjectType.THEORY, creditHours: 3 },
  { code: "8TH208", name: "Machine Learning Fundamentals", type: SubjectType.THEORY, creditHours: 4 },
  { code: "8TH209", name: "Cloud Computing", type: SubjectType.THEORY, creditHours: 3 },
  { code: "8TH210", name: "Information Security", type: SubjectType.THEORY, creditHours: 3 },
];

const NEW_LAB_SUBJECTS: SubjectSeed[] = [
  { code: "8LB251", name: "DBMS Lab", type: SubjectType.LAB, creditHours: 2 },
  { code: "8LB252", name: "OS Lab", type: SubjectType.LAB, creditHours: 2 },
  { code: "8LB253", name: "Algorithms Lab", type: SubjectType.LAB, creditHours: 2 },
  { code: "8LB254", name: "Networks Lab", type: SubjectType.LAB, creditHours: 2 },
  { code: "8LB255", name: "Machine Learning Lab", type: SubjectType.LAB, creditHours: 2 },
  { code: "8LB256", name: "Cloud Lab", type: SubjectType.LAB, creditHours: 2 },
  { code: "8LB257", name: "Cyber Security Lab", type: SubjectType.LAB, creditHours: 2 },
  { code: "8LB258", name: "DevOps Lab", type: SubjectType.LAB, creditHours: 2 },
];

async function ensureSubjects() {
  for (const subject of [...NEW_THEORY_SUBJECTS, ...NEW_LAB_SUBJECTS]) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: {
        name: subject.name,
        type: subject.type,
        creditHours: subject.creditHours,
      },
      create: subject,
    });
  }
}

async function assignSubjectsToTeachers() {
  const teachers = await prisma.teacher.findMany({
    orderBy: { id: "asc" },
    take: 5,
  });

  if (teachers.length < 5) {
    throw new Error("At least 5 teachers are required before running this script.");
  }

  const subjects = await prisma.subject.findMany({
    where: {
      code: {
        in: [
          "8TH201",
          "8TH202",
          "8TH203",
          "8TH204",
          "8TH205",
          "8TH206",
          "8TH207",
          "8TH208",
          "8TH209",
          "8LB251",
          "8LB252",
          "8LB253",
          "8LB254",
          "8LB255",
        ],
      },
    },
  });

  const subjectIdByCode = new Map(subjects.map((s) => [s.code, s.id]));

  const plan: Array<{ teacherId: number; codes: string[] }> = [
    { teacherId: teachers[0].id, codes: ["8TH201", "8TH202", "8LB251"] },
    { teacherId: teachers[1].id, codes: ["8TH201", "8TH203", "8LB252"] },
    { teacherId: teachers[2].id, codes: ["8TH204", "8TH205", "8LB253"] },
    { teacherId: teachers[3].id, codes: ["8TH206", "8TH207", "8LB254"] },
    { teacherId: teachers[4].id, codes: ["8TH208", "8TH209", "8LB255"] },
  ];

  for (const item of plan) {
    await prisma.teacherSubject.deleteMany({ where: { teacherId: item.teacherId } });

    for (const code of item.codes) {
      const subjectId = subjectIdByCode.get(code);
      if (!subjectId) {
        throw new Error(`Subject code not found for teacher assignment: ${code}`);
      }

      await prisma.teacherSubject.create({
        data: {
          teacherId: item.teacherId,
          subjectId,
        },
      });
    }
  }
}

async function assignSubjectsToTargetClasses() {
  const classSections = await prisma.classSection.findMany({
    where: {
      OR: [
        { branch: { name: "CSE" }, year: 2 },
        { branch: { name: "IT" }, year: 2 },
        { branch: { name: "CSE" }, year: 3 },
        { branch: { name: "IT" }, year: 3 },
      ],
    },
    include: { branch: true },
  });

  if (classSections.length < 4) {
    throw new Error("Required class sections CSE/IT years 2 and 3 are missing.");
  }

  const classId = (branch: string, year: number) => {
    const row = classSections.find((c) => c.branch.name === branch && c.year === year);
    if (!row) {
      throw new Error(`Class section missing for ${branch} year ${year}`);
    }
    return row.id;
  };

  const subjectRows = await prisma.subject.findMany({
    where: {
      code: {
        in: [
          "8TH201",
          "8TH202",
          "8TH203",
          "8TH204",
          "8TH205",
          "8TH206",
          "8TH207",
          "8TH208",
          "8TH209",
          "8TH210",
          "8LB251",
          "8LB252",
          "8LB253",
          "8LB254",
          "8LB255",
          "8LB256",
          "8LB257",
          "8LB258",
        ],
      },
    },
  });

  const sid = (code: string) => {
    const row = subjectRows.find((s) => s.code === code);
    if (!row) {
      throw new Error(`Subject code not found for class assignment: ${code}`);
    }
    return row.id;
  };

  const assignments = new Map<number, string[]>([
    [
      classId("CSE", 2),
      ["8TH201", "8TH202", "8TH204", "8TH206", "8TH205", "8LB251", "8LB252", "8LB253"],
    ],
    [
      classId("IT", 2),
      ["8TH201", "8TH202", "8TH204", "8TH206", "8TH207", "8LB251", "8LB252", "8LB254"],
    ],
    [
      classId("CSE", 3),
      ["8TH201", "8TH203", "8TH208", "8TH209", "8TH210", "8LB255", "8LB256", "8LB257"],
    ],
    [
      classId("IT", 3),
      ["8TH201", "8TH203", "8TH208", "8TH209", "8TH204", "8LB255", "8LB256", "8LB258"],
    ],
  ]);

  for (const [classSectionId, subjectCodes] of assignments) {
    await prisma.classSubject.deleteMany({ where: { classSectionId } });

    for (const code of subjectCodes) {
      await prisma.classSubject.create({
        data: {
          classSectionId,
          subjectId: sid(code),
        },
      });
    }
  }
}

async function main() {
  await ensureSubjects();
  await assignSubjectsToTeachers();
  await assignSubjectsToTargetClasses();

  console.log("Extended academic data population completed.");
}

main()
  .catch((error) => {
    console.error("Failed to populate extended academic data", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
