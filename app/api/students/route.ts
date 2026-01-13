// app/api/students/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Import our singleton client

// 1. GET: Fetch all students (with Pagination)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination Logic
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Fetch Data
    const students = await prisma.student.findMany({
      skip: skip,
      take: limit,
      orderBy: { id: "asc" }, // Consistent ordering
    });

    const total = await prisma.student.count();

    return NextResponse.json({
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

// 2. POST: Create a new student
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic Validation
    if (!body.name || !body.grade) {
      return NextResponse.json(
        { error: "Name and Grade are required" },
        { status: 400 }
      );
    }

    const newStudent = await prisma.student.create({
      data: {
        name: body.name,
        grade: body.grade,
        section: body.section || "A",
      },
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
