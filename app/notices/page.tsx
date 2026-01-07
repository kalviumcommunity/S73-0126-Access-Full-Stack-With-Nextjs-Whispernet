// 1. Revalidate this segment every 60 seconds
export const revalidate = 60;

async function getNotices() {
  // The 'next: { revalidate: 60 }' option does the magic here
  const res = await fetch('https://jsonplaceholder.typicode.com/comments?_limit=3', {
    next: { revalidate: 60 }
  });
  return res.json();
}

export default async function NoticesPage() {
  const notices = await getNotices();
  
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">📢 School Board (Hybrid/ISR)</h1>
      <p className="mb-4 text-gray-600">Updates every 60 seconds if there is new data.</p>
      
      <ul>
        {notices.map((notice: any) => (
          <li key={notice.id} className="mb-3 p-3 bg-yellow-50 rounded">
            <strong>{notice.email}:</strong> {notice.name}
          </li>
        ))}
      </ul>
    </div>
  );
}