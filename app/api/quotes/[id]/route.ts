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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const quoteId = params.id;
  try {
    const data = await req.json();
    
    // Find the quote first
    const existingQuote = await prisma.quotes.findUnique({ where: { id: quoteId } });
    if (!existingQuote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Update the quote with the new data
    const updatedQuote = await prisma.quotes.update({
      where: { id: quoteId },
      data: {
        purchaseOrder: data.purchaseOrder ? String(data.purchaseOrder) : undefined,
        costCenter: data.costCenter ? String(data.costCenter) : undefined,
        subject: data.subject ? String(data.subject) : undefined,
        estimatedRecipients: typeof data.estimatedRecipients === 'number' ? data.estimatedRecipients : undefined,
        colorMode: data.colorMode ? String(data.colorMode) : undefined,
        dataCleansing: typeof data.dataCleansing === 'boolean' ? data.dataCleansing : undefined,
        ncoaUpdate: typeof data.ncoaUpdate === 'boolean' ? data.ncoaUpdate : undefined,
        firstClassPostage: typeof data.firstClassPostage === 'boolean' ? data.firstClassPostage : undefined,
        notes: data.notes ? String(data.notes) : undefined,
        totalCost: typeof data.totalCost === 'number' ? data.totalCost : existingQuote.totalCost,
      },
    });

    return NextResponse.json({ success: true, quote: updatedQuote });
  } catch (err) {
    console.error('Error updating quote:', err);
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
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
    
    // Check if quote has already been converted
    if (quote.status === 'converted') {
      console.log('⚠️ Quote already converted, skipping conversion:', {
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        status: quote.status
      });
      return NextResponse.json({ 
        success: false, 
        message: "Quote has already been converted to an order",
        status: 'already_converted'
      });
    }
    
    // Debug logging
    console.log('🔍 Converting quote to order:', {
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      practiceId: quote.practiceId,
      userId: quote.userId,
      subject: quote.subject,
      colorMode: quote.colorMode,
      totalCost: quote.totalCost,
      totalCostType: typeof quote.totalCost
    });
    
    // Create a new order from the quote
    const orderData = {
      orderNumber: `O-${Date.now()}`,
      practiceId: quote.practiceId,
      userId: quote.userId,
      subject: quote.subject,
      colorMode: quote.colorMode,
      cost: quote.totalCost,
      status: 'pending',
    };
    
    console.log('📝 Creating order with data:', orderData);
    
    const order = await prisma.orders.create({
      data: orderData,
    });
    
    console.log('✅ Order created successfully:', order.id);
    
    // Update the quote status
    await prisma.quotes.update({
      where: { id: quoteId },
      data: { status: 'converted' },
    });
    
    console.log('✅ Quote status updated to converted');
    
    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error('❌ Error converting quote to order:', err);
    return NextResponse.json({ error: "Failed to convert quote to order" }, { status: 500 });
  }
} 