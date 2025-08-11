import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
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

    const data = await req.json();
    if (!data.practiceId) {
      return NextResponse.json({ error: "Practice is required" }, { status: 400 });
    }

    // Create the quote
    const quote = await prisma.quotes.create({
      data: {
        practiceId: String(data.practiceId),
        userId: user.id,
        quoteNumber: `Q-${Date.now()}`,
        purchaseOrder: data.purchaseOrder ? String(data.purchaseOrder) : undefined,
        costCenter: data.costCenter ? String(data.costCenter) : undefined,
        subject: data.subject ? String(data.subject) : undefined,
        estimatedRecipients: typeof data.estimatedRecipients === 'number' ? data.estimatedRecipients : undefined,
        colorMode: data.colorMode ? String(data.colorMode) : undefined,
        dataCleansing: typeof data.dataCleansing === 'boolean' ? data.dataCleansing : undefined,
        ncoaUpdate: typeof data.ncoaUpdate === 'boolean' ? data.ncoaUpdate : undefined,
        firstClassPostage: typeof data.firstClassPostage === 'boolean' ? data.firstClassPostage : undefined,
        notes: data.notes ? String(data.notes) : undefined,
        status: "pending",
        totalCost: typeof data.totalCost === 'number' ? data.totalCost : 0,
      },
    });

    return NextResponse.json({ quote });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}

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

    // Get quotes based on user role
    let quotes;
    if (user.role === "ADMIN") {
      // Admins can see all quotes
      quotes = await prisma.quotes.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          practice: true,
          user: true
        }
      });
    } else {
      // Regular users can only see their own quotes
      quotes = await prisma.quotes.findMany({
        where: {
          userId: user.id,
        },
        orderBy: { createdAt: "desc" },
        include: {
          practice: true
        }
      });
    }

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
} 