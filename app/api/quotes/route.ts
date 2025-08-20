import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    // Get the current user's Clerk session
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

  const data = await req.json();
  
  // Debug logging to see what's being received
  console.log('🔍 Backend received quote data:', {
    practiceId: data.practiceId,
    estimatedRecipients: data.estimatedRecipients,
    colorMode: data.colorMode,
    dataCleansing: data.dataCleansing,
    ncoaUpdate: data.ncoaUpdate,
    firstClassPostage: data.firstClassPostage,
    totalCost: data.totalCost,
    totalCostType: typeof data.totalCost
  });
  
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

  // Debug logging to see what was actually saved
  console.log('✅ Backend created quote:', {
    quoteId: quote.id,
    quoteNumber: quote.quoteNumber,
    totalCost: quote.totalCost,
    totalCostType: typeof quote.totalCost
  });

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('❌ Quotes API - Error creating quote:', error);
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get the current user's Clerk session
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database to check their role and practice
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { practice: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('🔍 Quotes API - Current user:', {
      id: user.id,
      email: user.email,
      role: user.role,
      practiceId: user.practiceId,
      practiceName: user.practice?.name
    });

    let quotes;
    
    if (user.role === 'ADMIN') {
      // Admin sees all quotes
      quotes = await prisma.quotes.findMany({
        include: { practice: true, user: true },
        orderBy: { createdAt: "desc" },
      });
      console.log('🔍 Quotes API - Admin user, returning all quotes:', quotes.length);
    } else {
      // Regular user only sees quotes from their practice
      if (user.practiceId) {
        quotes = await prisma.quotes.findMany({
          where: { practiceId: user.practiceId },
          include: { practice: true, user: true },
          orderBy: { createdAt: "desc" },
        });
        console.log('🔍 Quotes API - Regular user, returning practice quotes:', quotes.length);
      } else {
        quotes = [];
        console.log('🔍 Quotes API - User has no practice, returning empty');
      }
    }
    
    return NextResponse.json({ quotes });
  } catch (error) {
    console.error('❌ Quotes API - Error fetching quotes:', error);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
} 