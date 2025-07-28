import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const orders = await prisma.orders.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // TODO: Replace with real user/practice IDs from session
    const userId = "test-user-id";
    const practiceId = "test-practice-id";
    const order = await prisma.orders.create({
      data: {
        orderNumber: `O-${Date.now()}`,
        practiceId,
        userId,
        subject: data.subject,
        colorMode: data.colorMode,
        cost: data.cost,
        status: data.status,
      },
    });
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
} 