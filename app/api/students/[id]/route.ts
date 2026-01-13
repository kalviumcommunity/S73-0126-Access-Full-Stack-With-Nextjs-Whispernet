// app/api/students/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to validate ID
function parseId(params: { id: string }) {
  const id = parseInt(params.id);
  return isNaN(id) ? null : id;
}

// 1. GET: Fetch Single Student
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Params are promises in Next.js 15
) {
  const { id } = await params;
  const studentId = parseId({ id });

  if (!studentId) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { attendance: true }, // Bonus: Include their attendance history
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json(student);
}

// 2. PATCH: Update Student details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const studentId = parseId({ id });
  if (!studentId)
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const body = await request.json();

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: body,
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// 3. DELETE: Remove Student
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const studentId = parseId({ id });
  if (!studentId)
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    await prisma.student.delete({
      where: { id: studentId },
    });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
