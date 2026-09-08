-- Production schema: typed attendance, richer notices, auditable students.
-- Written by hand so that existing rows survive the enum + date conversions.

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "NoticeCategory" AS ENUM ('GENERAL', 'ACADEMIC', 'EXAM', 'EVENT', 'SPORTS', 'HOLIDAY', 'FACILITY', 'MEETING');

-- CreateEnum
CREATE TYPE "NoticePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_studentId_fkey";

-- AlterTable: User
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: Student
ALTER TABLE "Student" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "guardianName" TEXT,
ADD COLUMN "guardianPhone" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "rollNumber" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Student" SET "section" = 'A' WHERE "section" IS NULL;
ALTER TABLE "Student" ALTER COLUMN "section" SET NOT NULL,
ALTER COLUMN "section" SET DEFAULT 'A';

-- AlterTable: Attendance (preserve existing status values through the enum cast)
ALTER TABLE "Attendance" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "markedById" INTEGER,
ADD COLUMN "note" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Attendance" SET "status" = 'PRESENT'
WHERE UPPER("status") NOT IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

ALTER TABLE "Attendance"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "AttendanceStatus" USING UPPER("status")::"AttendanceStatus",
  ALTER COLUMN "status" SET DEFAULT 'PRESENT';

ALTER TABLE "Attendance" ALTER COLUMN "date" DROP DEFAULT,
ALTER COLUMN "date" SET DATA TYPE DATE;

-- Collapse any rows that became duplicates once timestamps were truncated to days,
-- keeping the most recently created record for each student/day pair.
DELETE FROM "Attendance" a
USING "Attendance" b
WHERE a."studentId" = b."studentId"
  AND a."date" = b."date"
  AND a."id" < b."id";

-- AlterTable: Notice
ALTER TABLE "Notice" ADD COLUMN "authorId" INTEGER,
ADD COLUMN "authorName" TEXT NOT NULL DEFAULT 'School Office',
ADD COLUMN "category" "NoticeCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "priority" "NoticePriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Notice" ALTER COLUMN "authorName" DROP DEFAULT;
ALTER TABLE "Notice" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Attendance_status_date_idx" ON "Attendance"("status", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_studentId_date_key" ON "Attendance"("studentId", "date");
CREATE INDEX IF NOT EXISTS "Notice_isActive_publishedAt_idx" ON "Notice"("isActive", "publishedAt");
CREATE INDEX IF NOT EXISTS "Notice_category_idx" ON "Notice"("category");
CREATE INDEX IF NOT EXISTS "Notice_isPinned_idx" ON "Notice"("isPinned");
CREATE INDEX IF NOT EXISTS "Student_grade_section_idx" ON "Student"("grade", "section");
CREATE INDEX IF NOT EXISTS "Student_isActive_idx" ON "Student"("isActive");
CREATE INDEX IF NOT EXISTS "Student_name_idx" ON "Student"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Student_grade_section_rollNumber_key" ON "Student"("grade", "section", "rollNumber");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
