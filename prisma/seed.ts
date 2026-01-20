// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Cleaning database...");
  // Delete data in the correct order (Child first, then Parent) to avoid Foreign Key errors
  await prisma.attendance.deleteMany();
  await prisma.student.deleteMany();
  await prisma.notice.deleteMany();
  // We don't delete Users usually, or we use upsert (below)

  console.log("🌱 Seeding database...");

  // 1. Create/Update Teacher (Idempotent via upsert)
  await prisma.user.upsert({
    where: { email: "teacher@rural.edu" },
    update: { phone: "9876543210" }, // Update phone if exists
    create: {
      email: "teacher@rural.edu",
      name: "Ms. Alice",
      password: "hashed_password_placeholder", // TODO: Use proper hashing in production
      role: "TEACHER",
      phone: "9876543210", // Set phone for new
    },
  });

  // 2. Create Students
  // Since we deleted them at the top, we can use createMany safely
  await prisma.student.createMany({
    data: [
      { name: "Rohan Kumar", grade: 5, section: "A" },
      { name: "Priya Sharma", grade: 5, section: "A" },
      { name: "Amit Singh", grade: 6, section: "B" },
    ],
  });

  // Fetch them back to get their IDs for attendance
  const students = await prisma.student.findMany();

  // 3. Mark Attendance (Linked to real IDs)
  // We can just loop through the fetched students
  const attendanceData = students.map((s) => ({
    studentId: s.id,
    status: "PRESENT" as const, // Force TypeScript to recognize the Enum
    date: new Date(),
  }));

  await prisma.attendance.createMany({
    data: attendanceData,
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
