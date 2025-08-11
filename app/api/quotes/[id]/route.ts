import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const quoteId = params.id;
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

    // Get the quote to check permissions
    const existingQuote = await prisma.quotes.findUnique({
      where: { id: quoteId },
      include: { user: true }
    });

    if (!existingQuote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Check if user owns the quote or is admin
    if (existingQuote.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the updated quote data from request body
    const updateData = await req.json();
    
    // Update the quote
    const updatedQuote = await prisma.quotes.update({
      where: { id: quoteId },
      data: {
        subject: updateData.subject,
        totalCost: updateData.totalCost,
        purchaseOrder: updateData.purchaseOrder,
        costCenter: updateData.costCenter,
        estimatedRecipients: updateData.estimatedRecipients,
        colorMode: updateData.colorMode,
        dataCleansing: updateData.dataCleansing,
        ncoaUpdate: updateData.ncoaUpdate,
        firstClassPostage: updateData.firstClassPostage,
        notes: updateData.notes,
        updatedAt: new Date()
      },
      include: {
        practice: true,
        user: true
      }
    });

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: "Quote updated successfully"
    });

  } catch (err) {
    console.error("Error updating quote:", err);
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}

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

    // Get the quote to check permissions
    const existingQuote = await prisma.quotes.findUnique({
      where: { id: quoteId },
      include: { practice: true }
    });

    if (!existingQuote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Check if user owns the quote or is admin
    if (existingQuote.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    
    // Handle quote conversion
    if (body.action === "convert") {
      // Update quote status to converted
      const updatedQuote = await prisma.quotes.update({
        where: { id: quoteId },
        data: {
          status: "converted",
          updatedAt: new Date()
        },
        include: {
          practice: true,
          user: true
        }
      });

      return NextResponse.json({
        success: true,
        message: "Quote converted successfully",
        quote: updatedQuote
      });
    }

    // Handle creating order from quote (legacy functionality)
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
    console.error("Error processing quote action:", err);
    return NextResponse.json({ error: "Failed to process quote action" }, { status: 500 });
  }
} 