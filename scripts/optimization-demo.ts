import { prisma } from "../lib/prisma";

async function main() {
  console.log("\n--- ⚡ QUERY OPTIMIZATION DEMO ---\n");

  // 1. Seed dummy data so we can measure performance
  const count = await prisma.student.count();
  if (count < 100) {
    console.log("Generating 100 dummy students for testing...");
    await prisma.student.createMany({
      data: Array.from({ length: 100 }).map((_, i) => ({
        name: `Student ${i}`,
        grade: 8,
        section: "B",
      })),
    });
  }

  // --- BAD QUERY ---
  console.time("❌ Slow Query (Select *)");
  // Fetches ALL fields (id, name, grade, section) for ALL students
  const allStudents = await prisma.student.findMany();
  console.timeEnd("❌ Slow Query (Select *)");
  console.log(`   Fetched ${allStudents.length} records (Full Objects)\n`);

  // --- OPTIMIZED QUERY ---
  console.time("✅ Fast Query (Select + Take)");
  // Fetches ONLY 'name', and only the first 10
  const optimizedStudents = await prisma.student.findMany({
    select: { id: true, name: true }, // Projection (Select specific fields)
    take: 10, // Pagination (Limit)
    orderBy: { id: "desc" }, // Uses Index
  });
  console.timeEnd("✅ Fast Query (Select + Take)");
  console.log(
    `   Fetched ${optimizedStudents.length} records (Partial Objects)`
  );
}

main().finally(() => prisma.$disconnect());
