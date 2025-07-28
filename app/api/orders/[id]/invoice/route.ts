import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id;
  try {
    // Get order with related data
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        practice: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if order is completed
    if (order.status !== "completed") {
      return NextResponse.json({ error: "Invoice can only be generated for completed orders" }, { status: 400 });
    }

    // Check if invoice already exists
    const existingInvoice = await prisma.invoices.findFirst({
      where: { orderId: orderId },
    });

    if (existingInvoice) {
      return NextResponse.json({ error: "Invoice already exists for this order" }, { status: 400 });
    }

    // Generate invoice number (INV-2025-XXXX format)
    const currentYear = new Date().getFullYear();
    const latestInvoice = await prisma.invoices.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `INV-${currentYear}-`,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
    });

    let nextNumber = 1;
    if (latestInvoice) {
      const lastNumber = latestInvoice.invoiceNumber.split('-')[2];
      nextNumber = parseInt(lastNumber) + 1;
    }

    const invoiceNumber = `INV-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;

    // Calculate dates
    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Net 30 days

    // Calculate amounts
    const subtotal = parseFloat(order.cost?.toString() || '0');
    const taxAmount = 0; // No tax for now
    const totalAmount = subtotal + taxAmount;

    // Create invoice
    const invoice = await prisma.invoices.create({
      data: {
        invoiceNumber,
        orderId: orderId,
        userId: order.userId,
        practiceId: order.practiceId,
        invoiceDate: invoiceDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        status: 'draft',
        paymentTerms: 'Net 30',
        notes: `Invoice for order ${order.orderNumber}`,
      },
    });

    return NextResponse.json({ invoice });
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
} 