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

    const quotes = await prisma.quotes.findMany({
      include: {
        practice: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform the data to include practice name
    const quotesWithPracticeName = quotes.map(quote => ({
      ...quote,
      practiceName: quote.practice?.name || 'Unknown Practice',
    }));
    
    return NextResponse.json({ quotes: quotesWithPracticeName });
  } catch (err) {
    console.error("Error fetching admin quotes:", err);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
} 