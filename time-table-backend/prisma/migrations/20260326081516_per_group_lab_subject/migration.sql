-- DropForeignKey
ALTER TABLE "TimetableEntry" DROP CONSTRAINT "TimetableEntry_subjectId_fkey";

-- AlterTable
ALTER TABLE "LabGroupEntry" ADD COLUMN     "subjectId" INTEGER;

-- AlterTable
ALTER TABLE "TimetableEntry" ALTER COLUMN "subjectId" DROP NOT NULL;

-- Backfill legacy lab group rows with the previous entry-level subject
UPDATE "LabGroupEntry" lg
SET "subjectId" = te."subjectId"
FROM "TimetableEntry" te
WHERE lg."timetableEntryId" = te."id"
  AND lg."subjectId" IS NULL
  AND te."subjectId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabGroupEntry" ADD CONSTRAINT "LabGroupEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
