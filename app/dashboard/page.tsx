// 1. Force dynamic rendering so it runs on every request
export const dynamic = 'force-dynamic';

async function getStudentStats() {
  // cache: 'no-store' ensures we never use stale data
  const res = await fetch('https://jsonplaceholder.typicode.com/users?_limit=3', {
    cache: 'no-store'
  });
  return res.json();
}

export default async function DashboardPage() {
  const students = await getStudentStats();
  const timestamp = new Date().toLocaleTimeString();

  return (
    <div className="p-10 bg-gray-50">
      <h1 className="text-2xl font-bold mb-2">🎓 Teacher Dashboard (Dynamic)</h1>
      <p className="mb-4 text-red-500">Live Data fetched at: {timestamp}</p>
      
      <div className="grid gap-4">
        {students.map((student: any) => (
          <div key={student.id} className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
            <h3 className="font-bold">{student.name}</h3>
            <p>Status: Active | Grade: A</p>
          </div>
        ))}
      </div>
    </div>
  );
}