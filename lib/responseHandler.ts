// lib/responseHandler.ts
import { NextResponse } from "next/server";

// 1. Success Response Envelope
export const sendSuccess = (
  data: unknown,
  message = "Success",
  status = 200
) => {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
};

// 2. Error Response Envelope
export const sendError = (
  message = "Something went wrong",
  code = "INTERNAL_ERROR",
  status = 500,
  details?: unknown
) => {
  return NextResponse.json(
    {
      success: false,
      message,
      error: {
        code,
        details: process.env.NODE_ENV === "development" ? details : undefined, // Hide details in prod
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
};
