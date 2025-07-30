import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/auth"; // Temporarily commented out
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(req: NextRequest) {
  try {
    // Temporarily bypass auth for development
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    
    // Mock user for development
    const mockUser = { id: "1", role: "USER" as const };

    const orders = await prisma.orders.findMany({
      where: {
        userId: mockUser.id,
      },
      include: {
        files: true,
        approvals: true,
        invoices: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Temporarily bypass auth for development
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    
    // Mock user for development
    const mockUser = { id: "1", role: "USER" as const };

    const body = await req.json();
    const { subject, cost, practiceId } = body;

    const order = await prisma.orders.create({
      data: {
        orderNumber: `O-${Date.now()}`,
        subject,
        cost,
        status: "pending",
        userId: mockUser.id,
        practiceId: practiceId || "default-practice-id",
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}