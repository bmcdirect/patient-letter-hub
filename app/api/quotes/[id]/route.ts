import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const quoteId = params.id;
  try {
    await prisma.quotes.delete({ where: { id: quoteId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete quote" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const quoteId = params.id;
  try {
    const quote = await prisma.quotes.findUnique({ where: { id: quoteId } });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    return NextResponse.json(quote);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const quoteId = params.id;
  try {
    // Find the quote
    const quote = await prisma.quotes.findUnique({ where: { id: quoteId } });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    // Create a new order from the quote
    const order = await prisma.orders.create({
      data: {
        orderNumber: `O-${Date.now()}`,
        practiceId: quote.practiceId,
        userId: quote.userId,
        subject: quote.subject,
        colorMode: quote.colorMode,
        cost: quote.totalCost,
        status: 'pending',
      },
    });
    // Update the quote status
    await prisma.quotes.update({
      where: { id: quoteId },
      data: { status: 'converted' },
    });
    return NextResponse.json({ success: true, order });
  } catch (err) {
    return NextResponse.json({ error: "Failed to convert quote to order" }, { status: 500 });
  }
} 