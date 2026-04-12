import { SubjectType } from "@prisma/client";
import { prisma } from "../src/prisma/client";

const subjectsRaw = [
  { code: "6CSE41A", name: "Neural Networks", type: "THEORY", creditHours: 3 },
  { code: "6ADS42A", name: "Natural Language Processing", type: "THEORY", creditHours: 3 },
  { code: "6ADS51A", name: "Big Data Analytics", type: "THEORY", creditHours: 4 },
  // { code: "6CSE11A", name: "Robotics and Embedded System", type: "THEORY", creditHours: 3 }, // Removed as per sync-subjects
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
  "6ADS41A": "NN", // Renamed from 6CSE41A
  "6ADS42A": "NLP",
  "6ADS51A": "BDA",
  "6CSE11A": "RES",
  "6ADS41B": "NNL", // Renamed from 6CSE11B
  "6ADS51B": "BDAL", // Renamed from 6ADS13B
  "4ADS41A": "DAA",
  "4ADS42A": "WT",
  "4ADS43A": "CN",
  "4ADS44A": "DBMS",
  "4ADS35A": "FSI",
  "4ADS42B": "WTL",
  "4ADS43B": "CNL",
  "4ADS44B": "DBMSL",
  "4ADS35B": "SIPL",
  "4IT41A": "DAA",
  "4IT42A": "WT",
  "4IT43A": "CN",
  "4IT44A": "DBMS",
  "4IT45A": "COA",
  "4IT42B": "WTL",
  "4IT43B": "CNL",
  "4IT44B": "DBMSL",
  "4IT45B": "COAL",
  "6IT41A": "RES",
  "6IT42A": "WMC",
  "6IT52A": "MWD",
  "6CSE53A": "AML",
  "6CSE41B": "RESL",
  "6IT52B": "MWDL",
  "6ADS42B": "NLPL",
  "6CSE53B": "AMLL",
  "4CSE41A": "DAA",
  "4CSE42A": "WT",
  "4CSE43A": "CN",
  "4CSE44A": "DBMS",
  "4CSE45A": "COA",
  "4CSE42B": "WTL",
  "4CSE43B": "CNL",
  "4CSE44B": "DBMSL",
  "4CSE45B": "COAL",
  "6CSE42A": "PCD",
  "6CSE51A": "IP",
  "6CSE51B": "IPL",
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
  ASG: ["6ADS41A", "6IT41A", "6CSE41B"], // Fixed 6CSE41A to 6ADS41A
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
  "ADS:4": ["4ADS41A", "4ADS42A", "4ADS43A", "4ADS44A", "4ADS35A", "4ADS42B", "4ADS43B", "4ADS44B", "4ADS35B",],
  "ADS:6": ["6ADS41A", "6ADS42A", "6ADS51A", "6ADS41A", "6CSE51A", "6ADS41B", "6ADS51B", "6CSE41B", "6CSE51B",],
  "IT:4": ["4IT41A", "4IT42A", "4IT43A", "4IT44A", "4IT45A", "4IT42B", "4IT43B", "4IT44B", "4IT45B",],
  "IT:6": ["6IT41A", "6IT42A", "6IT52A", "6ADS42A", "6CSE53A", "6CSE41B", "6IT52B", "6ADS42B", "6CSE53B",],
  "CSE:4": ["4CSE41A", "4CSE42A", "4CSE43A", "4CSE44A", "4CSE45A", "4CSE42B", "4CSE43B", "4CSE44B", "4CSE45B",],
  "CSE:6": ["6ADS41A", "6CSE42A", "6CSE51A", "6CSE53A", "6IT52A", "6CSE41B", "6CSE51B", "6CSE53B", "6IT52B",],
};

async function main() {
  console.log("--- Starting Seeding Analysis & Migration ---");

  // 1. Prepare Subjects
  const processedSubjects = subjectsRaw.map((s) => {
    let code = renames[s.code] || s.code;
    const abbreviation = ABBR[code] || code;
    return {
      code,
      name: s.name,
      type: s.type as SubjectType,
      creditHours: s.creditHours,
      abbreviation,
    };
  });

  // Deduplicate on code
  const uniqueSubjects = [];
  const seenCodes = new Set();
  for (const s of processedSubjects) {
    if (!seenCodes.has(s.code)) {
      seenCodes.add(s.code);
      uniqueSubjects.push(s);
    }
  }

  // Insert Subjects
  console.log("\n1. Seeding Subjects...");
  let subjectOk = 0;
  for (const s of uniqueSubjects) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        type: s.type,
        creditHours: s.creditHours,
        abbreviation: s.abbreviation,
      },
      create: {
        code: s.code,
        name: s.name,
        type: s.type,
        creditHours: s.creditHours,
        abbreviation: s.abbreviation,
      },
    });
    subjectOk++;
  }
  console.log(`✓ Upserted ${subjectOk} unique subjects.`);

  // Insert Teachers
  console.log("\n2. Seeding Teachers...");
  let teacherOk = 0;
  for (const t of teachersRaw) {
    await prisma.teacher.upsert({
      where: { abbreviation: t.abbreviation },
      update: { name: t.name },
      create: { name: t.name, abbreviation: t.abbreviation },
    });
    teacherOk++;
  }
  console.log(`✓ Upserted ${teacherOk} teachers.`);

  // Teacher Subjects
  console.log("\n3. Mapping Teacher Subjects...");
  const subjectsInDb = await prisma.subject.findMany();
  const subjectByCode = Object.fromEntries(subjectsInDb.map((s) => [s.code, s.id]));

  const teachersInDb = await prisma.teacher.findMany();
  const teacherByAbbr = Object.fromEntries(teachersInDb.map((t) => [t.abbreviation, t.id]));

  let tSuccess = 0;
  for (const [abbr, codes] of Object.entries(TEACHER_ASSIGNMENTS)) {
    const teacherId = teacherByAbbr[abbr];
    if (!teacherId) continue;
    
    for (const rawCode of codes) {
      const code = renames[rawCode] || rawCode;
      const subjectId = subjectByCode[code];
      if (!subjectId) continue;

      try {
        await prisma.teacherSubject.upsert({
          where: { teacherId_subjectId: { teacherId, subjectId } },
          update: {},
          create: { teacherId, subjectId },
        });
        tSuccess++;
      } catch (e) {
        console.error(`Error assigning ${code} to ${abbr}`);
      }
    }
  }
  console.log(`✓ Created/Verified ${tSuccess} teacher-subject mappings.`);

  // Class Subjects
  console.log("\n4. Mapping Class Subjects...");
  // Attempt to find the ADS branch since it might be named differently
  const branches = await prisma.branch.findMany();
  const branchNames = branches.map(b => b.name);
  const adsBranchName = branchNames.find(b => ["ADS", "AI", "AID"].includes(b)) || "ADS";
  console.log(`Using ADS branch name: ${adsBranchName}`);

  const activeClasses = await prisma.classSection.findMany({
    include: { branch: true },
  });

  let cSuccess = 0;
  for (const cls of activeClasses) {
    if (!cls.branch) continue;
    const branchName = cls.branch.name === adsBranchName ? "ADS" : cls.branch.name;
    const key = `${branchName}:${cls.semester}`;
    const codes = CLASS_ASSIGNMENTS[key];
    if (!codes) continue;

    for (const rawCode of codes) {
      const code = renames[rawCode] || rawCode;
      const subjectId = subjectByCode[code];
      if (!subjectId) continue;

      try {
        await prisma.classSubject.upsert({
          where: { classSectionId_subjectId: { classSectionId: cls.id, subjectId } },
          update: {},
          create: { classSectionId: cls.id, subjectId },
        });
        cSuccess++;
      } catch (e) {
        console.error(`Error assigning ${code} to class ${cls.id}`);
      }
    }
  }
  console.log(`✓ Created/Verified ${cSuccess} class-subject mappings.`);

  console.log("\n--- Migration Complete ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
