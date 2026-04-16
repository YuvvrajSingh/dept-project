/*
  Warnings:

  - The values [TIMETABLE_CHANGE,CANCELLATION,SUBSTITUTION] on the enum `NotificationLogType` will be removed. If these variants are still used in the database, this will fail.
  - The values [TUTORIAL] on the enum `TimetableEntryType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `teacherId` on the `NotificationLog` table. All the data in the column will be lost.
  - Added the required column `message` to the `NotificationLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationLogType_new" AS ENUM ('ENTRY_CREATED', 'ENTRY_UPDATED', 'ENTRY_DELETED', 'ENTRY_CANCELLED', 'ENTRY_CANCELLATION_UNDONE');
ALTER TABLE "NotificationLog" ALTER COLUMN "type" TYPE "NotificationLogType_new" USING ("type"::text::"NotificationLogType_new");
ALTER TYPE "NotificationLogType" RENAME TO "NotificationLogType_old";
ALTER TYPE "NotificationLogType_new" RENAME TO "NotificationLogType";
DROP TYPE "public"."NotificationLogType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TimetableEntryType_new" AS ENUM ('LECTURE', 'LAB');
ALTER TABLE "TimetableEntry" ALTER COLUMN "entryType" TYPE "TimetableEntryType_new" USING ("entryType"::text::"TimetableEntryType_new");
ALTER TYPE "TimetableEntryType" RENAME TO "TimetableEntryType_old";
ALTER TYPE "TimetableEntryType_new" RENAME TO "TimetableEntryType";
DROP TYPE "public"."TimetableEntryType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "NotificationLog" DROP CONSTRAINT "NotificationLog_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationLog" DROP CONSTRAINT "NotificationLog_timetableEntryId_fkey";

-- DropIndex
DROP INDEX "NotificationLog_timetableEntryId_teacherId_type_date_key";

-- AlterTable
ALTER TABLE "NotificationLog" DROP COLUMN "teacherId",
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "performedBy" TEXT,
ALTER COLUMN "timetableEntryId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "EntryCancellation" (
    "id" SERIAL NOT NULL,
    "timetableEntryId" INTEGER NOT NULL,
    "cancelDate" TEXT NOT NULL,
    "reason" TEXT,
    "cancelledByTeacherId" INTEGER,
    "cancelledByAdminId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntryCancellation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EntryCancellation_timetableEntryId_cancelDate_key" ON "EntryCancellation"("timetableEntryId", "cancelDate");

-- AddForeignKey
ALTER TABLE "EntryCancellation" ADD CONSTRAINT "EntryCancellation_timetableEntryId_fkey" FOREIGN KEY ("timetableEntryId") REFERENCES "TimetableEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryCancellation" ADD CONSTRAINT "EntryCancellation_cancelledByTeacherId_fkey" FOREIGN KEY ("cancelledByTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryCancellation" ADD CONSTRAINT "EntryCancellation_cancelledByAdminId_fkey" FOREIGN KEY ("cancelledByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_timetableEntryId_fkey" FOREIGN KEY ("timetableEntryId") REFERENCES "TimetableEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
