import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-10 flex flex-col items-start gap-6 bg-white text-black">
      <h1 className="text-4xl font-bold">Rural School Portal 🏫</h1>
      <p className="text-xl text-gray-600">
        Optimized for low-bandwidth environments.
      </p>

      <div className="flex flex-wrap gap-4">
        <Link 
          href="/textbooks" 
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
        >
          📚 Textbooks (Static)
        </Link>
        
        <Link 
          href="/dashboard" 
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition"
        >
          🎓 Teacher Dashboard (SSR)
        </Link>

        <Link 
          href="/notices" 
          className="bg-yellow-500 text-black px-6 py-3 rounded hover:bg-yellow-600 transition"
        >
          📢 Notices (ISR)
        </Link>
      </div>
    </main>
  );
}