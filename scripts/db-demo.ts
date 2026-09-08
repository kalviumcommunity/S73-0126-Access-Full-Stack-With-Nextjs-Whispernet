// scripts/db-demo.ts
// Demonstrates the two database behaviours the app relies on:
// transactional writes that roll back cleanly, and projected/paginated reads.
//
//   npx tsx scripts/db-demo.ts
//   npx tsx scripts/db-demo.ts --fail   (forces the transaction to roll back)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_STUDENT = "ZZ Transaction Demo";

async function transactionDemo(shouldFail: boolean) {
  console.log("\n--- Transaction demo ---");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          name: DEMO_STUDENT,
          grade: 10,
          section: "Z",
          rollNumber: "DEMO",
        },
      });
      console.log(`  created student #${student.id}`);

      if (shouldFail) {
        // A duplicate (studentId, date) violates the unique constraint, which
        // aborts the transaction — exactly what a replayed offline submission
        // would hit if the upsert in the API were a plain insert.
        const today = new Date(new Date().toISOString().slice(0, 10));
        await tx.attendance.create({
          data: { studentId: student.id, date: today, status: "PRESENT" },
        });
        await tx.attendance.create({
          data: { studentId: student.id, date: today, status: "ABSENT" },
        });
      } else {
        await tx.attendance.create({
          data: {
            studentId: student.id,
            date: new Date(new Date().toISOString().slice(0, 10)),
            status: "PRESENT",
          },
        });
        console.log("  marked attendance");
      }

      return student;
    });

    console.log(`  committed: student #${result.id} exists`);
  } catch (error) {
    console.log(`  failed: ${(error as Error).message.split("\n")[0]}`);

    const leftover = await prisma.student.findFirst({
      where: { name: DEMO_STUDENT },
    });
    console.log(
      `  rollback verified: student still in database? ${Boolean(leftover)}`
    );
  } finally {
    // The demo must not leave rows behind; attendance cascades with the student.
    await prisma.student.deleteMany({ where: { name: DEMO_STUDENT } });
  }
}

async function queryDemo() {
  console.log("\n--- Query shape demo ---");

  const total = await prisma.student.count();
  console.log(`  ${total} students in the database`);

  console.time("  every column, every row");
  const everything = await prisma.student.findMany();
  console.timeEnd("  every column, every row");
  console.log(`    -> ${everything.length} full records over the wire`);

  console.time("  projected + paginated + indexed");
  const page = await prisma.student.findMany({
    select: { id: true, name: true },
    where: { isActive: true },
    take: 10,
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });
  console.timeEnd("  projected + paginated + indexed");
  console.log(`    -> ${page.length} partial records over the wire`);
  console.log(
    "\n  The second shape is what /api/students uses: on a 2G link the"
  );
  console.log("  payload size matters far more than the query time.");
}

async function main() {
  const shouldFail = process.argv.includes("--fail");

  await transactionDemo(shouldFail);
  await queryDemo();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
