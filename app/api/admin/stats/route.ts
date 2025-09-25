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
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // SECURITY FIX: Only admins can access this endpoint
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const [users, practices, quotes, orders] = await Promise.all([
      prisma.user.count(),
      prisma.practice.count(),
      prisma.quotes.count(),
      prisma.orders.count(),
    ]);
    return NextResponse.json({ stats: { users, practices, quotes, orders } });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
} 