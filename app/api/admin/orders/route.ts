import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // SECURITY FIX: Add authentication check
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database to check their role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { practice: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // SECURITY FIX: Only admins can access this endpoint
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    console.log('🔍 Admin Orders API - Authenticated admin user:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Admin sees all orders
    const orders = await prisma.orders.findMany({
      include: {
        practice: true,
        user: true,
        approvals: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        proofs: {
          orderBy: {
            proofRound: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log('🔍 Admin Orders API - Found orders:', {
      count: orders.length,
      orderIds: orders.map(o => ({ id: o.id, orderNumber: o.orderNumber, status: o.status }))
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