import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const practice = await prisma.practice.findUnique({
    where: { id },
  });
  if (!practice) {
    return NextResponse.json({ error: "Practice not found" }, { status: 404 });
  }
  return NextResponse.json(practice);
} 