-- CreateEnum
CREATE TYPE "AcademicYearStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

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

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_label_key" ON "AcademicYear"("label");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_startYear_endYear_key" ON "AcademicYear"("startYear", "endYear");

-- AlterTable: Add abbreviation to Subject (if not exists)
ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "abbreviation" TEXT NOT NULL DEFAULT '';

-- AlterTable: Add email to Teacher (if not exists)
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- AlterTable: Add semester to ClassSection (if not exists)
ALTER TABLE "ClassSection" ADD COLUMN IF NOT EXISTS "semester" INTEGER NOT NULL DEFAULT 1;

-- AlterTable: Make TimetableEntry.subjectId nullable
ALTER TABLE "TimetableEntry" ALTER COLUMN "subjectId" DROP NOT NULL;

-- AlterTable: Add subjectId to LabGroupEntry (if not exists)
ALTER TABLE "LabGroupEntry" ADD COLUMN IF NOT EXISTS "subjectId" INTEGER;

-- Add FK for LabGroupEntry.subjectId (skip if exists)
DO $$ BEGIN
    ALTER TABLE "LabGroupEntry" ADD CONSTRAINT "LabGroupEntry_subjectId_fkey"
        FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: NotificationLog (if not exists)
CREATE TABLE IF NOT EXISTS "NotificationLog" (
    "id" SERIAL NOT NULL,
    "timetableEntryId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationLog_timetableEntryId_teacherId_type_date_key"
    ON "NotificationLog"("timetableEntryId", "teacherId", "type", "date");

-- ================================================================
-- ACADEMIC YEAR MIGRATION: Seed default year & link ClassSections
-- ================================================================

-- 1. Seed the default academic year (2025-2026, ACTIVE)
INSERT INTO "AcademicYear" ("label", "startYear", "endYear", "startDate", "endDate", "status", "isActive", "createdAt", "updatedAt")
VALUES ('2025-2026', 2025, 2026, '2025-07-01', '2026-06-30', 'ACTIVE', true, NOW(), NOW())
ON CONFLICT ("label") DO NOTHING;

-- 2. Add academicYearId column to ClassSection (nullable first)
ALTER TABLE "ClassSection" ADD COLUMN IF NOT EXISTS "academicYearId" INTEGER;

-- 3. Backfill all existing ClassSections to the seeded year
UPDATE "ClassSection"
SET "academicYearId" = (SELECT "id" FROM "AcademicYear" WHERE "label" = '2025-2026' LIMIT 1)
WHERE "academicYearId" IS NULL;

-- 4. Make the column NOT NULL
ALTER TABLE "ClassSection" ALTER COLUMN "academicYearId" SET NOT NULL;

-- 5. Add FK constraint
DO $$ BEGIN
    ALTER TABLE "ClassSection" ADD CONSTRAINT "ClassSection_academicYearId_fkey"
        FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 6. Drop old unique constraint on ClassSection (branchId, year, semester)
-- The old constraint might be named differently depending on migration history
DO $$ BEGIN
    ALTER TABLE "ClassSection" DROP CONSTRAINT IF EXISTS "ClassSection_branchId_year_semester_key";
    ALTER TABLE "ClassSection" DROP CONSTRAINT IF EXISTS "ClassSection_branchId_year_key";
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- 7. Add new unique constraint including academicYearId
CREATE UNIQUE INDEX IF NOT EXISTS "ClassSection_academicYearId_branchId_year_semester_key"
    ON "ClassSection"("academicYearId", "branchId", "year", "semester");
