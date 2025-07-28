import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const practices = await prisma.practice.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ practices });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch practices" }, { status: 500 });
  }
} 