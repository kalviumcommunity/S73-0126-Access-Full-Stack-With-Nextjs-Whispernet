// app/api/admin/stats/route.ts
import { sendSuccess } from "@/lib/responseHandler";
import { handleError } from "@/lib/errorHandler"; // Import the handler

export async function GET() {
  try {
    // SIMULATE A CRASH
    const shouldFail = false; // Change to true to test error handling
    if (shouldFail) {
      throw new Error("Database connection timed out! (Simulated Error)");
    }

    const stats = {
      totalUsers: 150,
      activeClasses: 12,
      serverStatus: "Healthy",
    };

    return sendSuccess(stats, "Admin stats fetched successfully");
  } catch (error) {
    // Use the Centralized Handler
    return handleError(error, "GET /api/admin/stats");
  }
}
