-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AcademicYearStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('THEORY', 'LAB');

-- CreateEnum
CREATE TYPE "TimetableEntryType" AS ENUM ('LECTURE', 'LAB', 'TUTORIAL');

-- CreateEnum
CREATE TYPE "NotificationLogType" AS ENUM ('TIMETABLE_CHANGE', 'CANCELLATION', 'SUBSTITUTION');

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "AcademicYearStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slot" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 60,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lab" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSection" (
    "id" SERIAL NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL DEFAULT '',
    "type" "SubjectType" NOT NULL,
    "creditHours" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherSubject" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,

    CONSTRAINT "TeacherSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSubject" (
    "id" SERIAL NOT NULL,
    "classSectionId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,

    CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" SERIAL NOT NULL,
    "classSectionId" INTEGER NOT NULL,
    "slotId" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "entryType" "TimetableEntryType" NOT NULL,
    "subjectId" INTEGER,
    "teacherId" INTEGER,
    "roomId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabGroupEntry" (
    "id" SERIAL NOT NULL,
    "timetableEntryId" INTEGER NOT NULL,
    "groupName" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "labId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,

    CONSTRAINT "LabGroupEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" SERIAL NOT NULL,
    "timetableEntryId" INTEGER NOT NULL,
    "teacherId" INTEGER,
    "type" "NotificationLogType" NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_label_key" ON "AcademicYear"("label");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_startYear_endYear_key" ON "AcademicYear"("startYear", "endYear");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_name_key" ON "Branch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Slot_label_key" ON "Slot"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Slot_order_key" ON "Slot"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Lab_name_key" ON "Lab"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSection_academicYearId_branchId_year_semester_key" ON "ClassSection"("academicYearId", "branchId", "year", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_abbreviation_key" ON "Teacher"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSubject_teacherId_subjectId_key" ON "TeacherSubject"("teacherId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSubject_classSectionId_subjectId_key" ON "ClassSubject"("classSectionId", "subjectId");

-- CreateIndex
CREATE INDEX "TimetableEntry_teacherId_day_slotId_idx" ON "TimetableEntry"("teacherId", "day", "slotId");

-- CreateIndex
CREATE INDEX "TimetableEntry_roomId_day_slotId_idx" ON "TimetableEntry"("roomId", "day", "slotId");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableEntry_classSectionId_day_slotId_key" ON "TimetableEntry"("classSectionId", "day", "slotId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_timetableEntryId_teacherId_type_date_key" ON "NotificationLog"("timetableEntryId", "teacherId", "type", "date");

-- AddForeignKey
ALTER TABLE "ClassSection" ADD CONSTRAINT "ClassSection_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSection" ADD CONSTRAINT "ClassSection_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_classSectionId_fkey" FOREIGN KEY ("classSectionId") REFERENCES "ClassSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_classSectionId_fkey" FOREIGN KEY ("classSectionId") REFERENCES "ClassSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabGroupEntry" ADD CONSTRAINT "LabGroupEntry_timetableEntryId_fkey" FOREIGN KEY ("timetableEntryId") REFERENCES "TimetableEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabGroupEntry" ADD CONSTRAINT "LabGroupEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabGroupEntry" ADD CONSTRAINT "LabGroupEntry_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabGroupEntry" ADD CONSTRAINT "LabGroupEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_timetableEntryId_fkey" FOREIGN KEY ("timetableEntryId") REFERENCES "TimetableEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
