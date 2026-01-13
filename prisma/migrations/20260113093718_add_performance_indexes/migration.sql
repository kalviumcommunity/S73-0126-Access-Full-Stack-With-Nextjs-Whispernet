-- CreateIndex
CREATE INDEX "Attendance_status_date_idx" ON "Attendance"("status", "date");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
