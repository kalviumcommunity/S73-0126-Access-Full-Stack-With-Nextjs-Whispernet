import Link from "next/link";

// 1. Fetch data. By default, Next.js caches this (Static Site Generation).
async function getTextbooks() {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
  return res.json();
}

export default async function TextbooksPage() {
  const books = await getTextbooks();

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">📚 Digital Textbooks (Static)</h1>
      <p className="mb-4 text-gray-600">Generated at build time. Fast & low data usage.</p>
      <div className="grid gap-4">
        {books.map((book: any) => (
          <div key={book.id} className="border p-4 rounded shadow">
            <h2 className="font-semibold">{book.title}</h2>
            <p>Read Chapter →</p>
          </div>
        ))}
      </div>
    </div>
  );
}