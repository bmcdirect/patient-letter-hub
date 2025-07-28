import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
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
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
} 