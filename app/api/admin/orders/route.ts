import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only allow admins to access this endpoint
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const orders = await prisma.orders.findMany({
      include: {
        practice: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform the data to include practice name
    const ordersWithPracticeName = orders.map(order => ({
      ...order,
      practiceName: order.practice?.name || 'Unknown Practice',
    }));
    
    return NextResponse.json({ orders: ordersWithPracticeName });
  } catch (err) {
    console.error("Error fetching admin orders:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
} 