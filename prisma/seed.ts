import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 1. Create a Teacher
  // FIX: Removed 'const teacher =' to satisfy strict TypeScript rules
  await prisma.user.upsert({
    where: { email: "teacher@rural.edu" },
    update: {},
    create: {
      email: "teacher@rural.edu",
      name: "Ms. Alice",
      role: "TEACHER",
    },
  });

  // 2. Create Students
  const s1 = await prisma.student.create({
    data: { name: "Rohan Kumar", grade: 5, section: "A" },
  });
  const s2 = await prisma.student.create({
    data: { name: "Priya Sharma", grade: 5, section: "A" },
  });

  // 3. Mark Attendance
  // We use s1 and s2 here, so keeping them as variables is fine!
  await prisma.attendance.createMany({
    data: [
      { studentId: s1.id, status: "PRESENT" },
      { studentId: s2.id, status: "ABSENT" },
    ],
  });

  // 4. Create Notices
  await prisma.notice.create({
    data: {
      title: "Holiday Tomorrow",
      content: "School will be closed due to heavy rain.",
    },
  });

  console.log("🌱 Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
