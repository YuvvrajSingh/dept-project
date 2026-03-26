"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAY_LABELS = exports.SLOT_TIMES = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.SLOT_TIMES = {
    1: { label: "I", start: "10:00", end: "10:55" },
    2: { label: "II", start: "10:55", end: "11:50" },
    3: { label: "III", start: "11:50", end: "12:45" },
    4: { label: "IV", start: "14:00", end: "14:55" },
    5: { label: "V", start: "14:55", end: "15:50" },
    6: { label: "VI", start: "15:50", end: "16:45" },
};
exports.DAY_LABELS = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
};
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
        type: client_1.SubjectType.THEORY,
        creditHours: 4,
    },
    {
        code: "7ADS42B",
        name: "Computer Vision",
        type: client_1.SubjectType.THEORY,
        creditHours: 4,
    },
    {
        code: "7ADSL45L",
        name: "Computer Vision Lab",
        type: client_1.SubjectType.LAB,
        creditHours: 2,
    },
];
async function main() {
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
    const branches = await Promise.all(BRANCH_NAMES.map((name) => prisma.branch.create({
        data: { name },
    })));
    for (const branch of branches) {
        for (const year of YEARS) {
            await prisma.classSection.create({
                data: {
                    branchId: branch.id,
                    year,
                },
            });
        }
    }
    await Promise.all(Array.from({ length: 7 }).map((_, index) => prisma.room.create({
        data: {
            name: `R-${index + 1}`,
            capacity: 60,
        },
    })));
    await Promise.all(Array.from({ length: 5 }).map((_, index) => prisma.lab.create({
        data: {
            name: `LAB-${index + 1}`,
            capacity: 20,
        },
    })));
    await prisma.teacher.createMany({
        data: TEACHERS,
    });
    await prisma.subject.createMany({
        data: SUBJECTS,
    });
    console.log("Seed completed successfully");
}
main()
    .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
