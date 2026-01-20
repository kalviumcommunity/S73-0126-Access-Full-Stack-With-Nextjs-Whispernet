// app/api/admin/stats/route.ts
import { sendSuccess } from "@/lib/responseHandler";

export async function GET() {
  // If the request reached here, the Middleware has already verified
  // that the user is an ADMIN. We don't need to check again!

  const stats = {
    totalUsers: 150,
    activeClasses: 12,
    serverStatus: "Healthy",
  };

  return sendSuccess(stats, "Admin stats fetched successfully");
}
