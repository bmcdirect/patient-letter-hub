import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const orders = await prisma.orders.findMany({
      include: {
        practice: true,
        user: true,
        approvals: {
          orderBy: {
            createdAt: 'desc',
          },
        },
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
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
} 