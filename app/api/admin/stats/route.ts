import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const [users, practices, quotes, orders] = await Promise.all([
      prisma.user.count(),
      prisma.practice.count(),
      prisma.quotes.count(),
      prisma.orders.count(),
    ]);
    return NextResponse.json({ stats: { users, practices, quotes, orders } });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
} 