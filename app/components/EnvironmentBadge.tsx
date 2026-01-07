export default function EnvironmentBadge() {
  const envName = process.env.NEXT_PUBLIC_ENV_NAME;
  
  // DEBUGGING: I commented out the "return null" check.
  // if (!envName) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-50 border-4 border-yellow-400">
      {/* If envName is found, show it. If not, show "MISSING" */}
      DEBUG STATUS: {envName ? envName.toUpperCase() : "MISSING VARIABLE"}
    </div>
  );
}