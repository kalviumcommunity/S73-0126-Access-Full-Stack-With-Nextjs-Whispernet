import { prisma } from "@/lib/prisma"; // Use the singleton

export default async function Home() {
  // Fetch data directly in the Server Component
  const userCount = await prisma.user.count();
  const studentCount = await prisma.student.count();

  return (
    <div className="p-10 font-sans">
      <h1 className="text-3xl font-bold mb-6">🏫 Rural School Portal</h1>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-blue-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold">Teachers</h2>
          <p className="text-4xl font-bold text-blue-600">{userCount}</p>
        </div>

        <div className="bg-green-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold">Students</h2>
          <p className="text-4xl font-bold text-green-600">{studentCount}</p>
        </div>
      </div>

      <p className="mt-6 text-gray-500">
        Database connection verified via <code>lib/prisma.ts</code>
      </p>
    </div>
  );
}
