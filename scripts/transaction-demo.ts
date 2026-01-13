// scripts/transaction-demo.ts
import { prisma } from "../lib/prisma";

async function main() {
  console.log("\n--- 🔄 STARTING TRANSACTION DEMO ---\n");

  const email = `student-${Date.now()}@rural.edu`;

  try {
    // We use an Interactive Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Create the Student
      console.log("1. Creating Student...");
      const student = await tx.student.create({
        data: {
          name: "Transaction Test User",
          grade: 10,
          section: "X",
        },
      });

      // Step 2: Create Initial Attendance (Simulate a failure here to test rollback)
      console.log("2. Marking Attendance...");

      // UNCOMMENT the next line to trigger a Rollback (invalid Enum value)
      // const status = "INVALID_STATUS" as any;
      //   const status = "INVALID_STATUS" as any; // This will cause a failure
      const status = "PRESENT"; // Valid status to succeed

      const attendance = await tx.attendance.create({
        data: {
          studentId: student.id,
          status: status,
          date: new Date(),
        },
      });

      return { student, attendance };
    });

    console.log("✅ Transaction SUCCESS:", result);
  } catch (error) {
    console.error("❌ Transaction FAILED. Rolling back changes...");
    console.error("   Reason:", (error as Error).message);

    // Prove Rollback: Check if the student was created
    const check = await prisma.user.findFirst({ where: { email } });
    console.log("   Rollback Verification: Student exists in DB?", !!check);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
