export default function EnvTestPage() {
  // Client-side variable (Available)
  const appName = process.env.NEXT_PUBLIC_APP_NAME;

  // Server-side variable (Undefined on client)
  // This helps demonstrate that secrets don't leak!
  const dbUrl = process.env.DATABASE_URL;

  return (
    <div className="p-10 border-2 border-dashed border-gray-300 m-10 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Environment Security Test 🔐</h1>

      <div className="space-y-4">
        {/* Safe Variable */}
        <div className="p-4 bg-green-100 rounded">
          <h2 className="font-bold text-green-800">
            ✅ Public Variable (Client)
          </h2>
          <p>
            NEXT_PUBLIC_APP_NAME: <strong>{appName}</strong>
          </p>
          <p className="text-sm text-gray-600">
            This connects to: {process.env.NEXT_PUBLIC_API_BASE_URL}
          </p>
        </div>

        {/* Secret Variable */}
        <div className="p-4 bg-red-100 rounded">
          <h2 className="font-bold text-red-800">
            🚫 Private Secret (Server Only)
          </h2>
          <p>
            DATABASE_URL: <strong>{dbUrl || "HIDDEN (Undefined)"}</strong>
          </p>
          <p className="text-xs mt-2 text-red-600">
            *If this says HIDDEN&apos;, your security is working! Server
            variables return undefined in client components.*
          </p>
        </div>
      </div>
    </div>
  );
}
