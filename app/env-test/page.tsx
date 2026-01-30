export default function EnvTestPage() {
  // Client-side variable (Available)
  const appName = process.env.NEXT_PUBLIC_APP_NAME;
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const envName = process.env.NEXT_PUBLIC_ENV_NAME;

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
            ✅ Public Variables (Client)
          </h2>
          <p>
            NEXT_PUBLIC_APP_NAME: <strong>{appName || "NOT SET"}</strong>
          </p>
          <p>
            NEXT_PUBLIC_ENV_NAME: <strong>{envName || "NOT SET"}</strong>
          </p>
          <p>
            NEXT_PUBLIC_API_URL: <strong>{apiUrl || "NOT SET"}</strong>
          </p>
          <p>
            NEXT_PUBLIC_GOOGLE_CLIENT_ID:{" "}
            <strong>
              {googleClientId
                ? `${googleClientId.substring(0, 20)}...`
                : "NOT SET"}
            </strong>
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
            *If this says HIDDEN, your security is working! Server variables
            return undefined in client components.*
          </p>
        </div>
      </div>
    </div>
  );
}
