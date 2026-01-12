// app/textbooks/page.tsx

// 1. Define the shape of the data we expect
interface Book {
  id: number;
  title: string;
  body: string;
  userId: number;
}

async function getTextbooks(): Promise<Book[]> {
  const res = await fetch(
    "https://jsonplaceholder.typicode.com/posts?_limit=5"
  );
  return res.json();
}

export default async function TextbooksPage() {
  const books = await getTextbooks();

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">📚 Digital Textbooks (Static)</h1>
      <p className="mb-4 text-gray-600">
        Generated at build time. Fast & low data usage.
      </p>
      <div className="grid gap-4">
        {/* CHANGED: Replaced 'any' with the specific 'Book' type */}
        {books.map((book: Book) => (
          <div key={book.id} className="border p-4 rounded shadow">
            <h2 className="font-semibold">{book.title}</h2>
            <p>Read Chapter →</p>
          </div>
        ))}
      </div>
    </div>
  );
}
