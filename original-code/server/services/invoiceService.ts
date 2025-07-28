import { db } from "../db";
import { invoices, orders, practices, users } from "@shared/schema";
import { eq, desc, and, like } from "drizzle-orm";
import type { Invoice, InsertInvoice, Order, Practice, User } from "@shared/schema";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export class InvoiceService {
  // Generate invoice number in format INV-2025-0001
  async generateInvoiceNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;
    
    // Get the latest invoice number for this year  
    const latestInvoice = await db
      .select()
      .from(invoices)
      .where(like(invoices.invoiceNumber, `${prefix}%`))
      .orderBy(desc(invoices.invoiceNumber))
      .limit(1);
    
    let nextNumber = 1;
    if (latestInvoice.length > 0) {
      const lastNumber = latestInvoice[0].invoiceNumber.split('-')[2];
      nextNumber = parseInt(lastNumber) + 1;
    }
    
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  // Create invoice for completed order
  async createInvoice(orderId: number, userId: string): Promise<Invoice> {
    // Get order details with related data
    const [orderData] = await db
      .select({
        order: orders,
        practice: practices,
        user: users,
      })
      .from(orders)
      .leftJoin(practices, eq(orders.practiceId, practices.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, orderId));

    if (!orderData) {
      throw new Error('Order not found');
    }

    const { order, practice, user } = orderData;

    // Check if order is completed
    if (order.status !== 'completed') {
      throw new Error('Invoice can only be generated for completed orders');
    }

    // Check if invoice already exists
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.orderId, orderId))
      .limit(1);

    if (existingInvoice.length > 0) {
      throw new Error('Invoice already exists for this order');
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();
    
    // Calculate dates
    const invoiceDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Net 30 days

    // Calculate amounts
    const subtotal = parseFloat(order.totalCost || '0');
    const taxAmount = 0; // No tax for now
    const totalAmount = subtotal + taxAmount;

    // Create invoice data
    const invoiceData: InsertInvoice = {
      tenantId: order.tenantId,
      invoiceNumber,
      orderId,
      userId: order.userId,
      practiceId: order.practiceId,
      invoiceDate: invoiceDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      dueDate: dueDate.toISOString().split('T')[0],
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      totalAmount: totalAmount.toString(),
      status: 'draft',
      paymentTerms: 'Net 30',
      notes: `Invoice for order ${order.orderNumber}`,
    };

    // Insert invoice
    const [invoice] = await db
      .insert(invoices)
      .values(invoiceData)
      .returning();

    // Update order with invoice reference
    await db
      .update(orders)
      .set({ invoiceId: invoice.id })
      .where(eq(orders.id, orderId));

    return invoice;
  }

  // Generate PDF invoice
  async generateInvoicePDF(invoiceId: number): Promise<string> {
    // Get invoice with related data
    const [invoiceData] = await db
      .select({
        invoice: invoices,
        order: orders,
        practice: practices,
        user: users,
      })
      .from(invoices)
      .leftJoin(orders, eq(invoices.orderId, orders.id))
      .leftJoin(practices, eq(invoices.practiceId, practices.id))
      .leftJoin(users, eq(invoices.userId, users.id))
      .where(eq(invoices.id, invoiceId));

    if (!invoiceData) {
      throw new Error('Invoice not found');
    }

    const { invoice, order, practice, user } = invoiceData;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create file path
    const fileName = `${invoice.invoiceNumber}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Pipe to file
    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(20).text('INVOICE', 50, 50);
    
    // Company Info (PatientLetterHub)
    doc.fontSize(12)
       .text('PatientLetterHub', 50, 100)
       .text('Healthcare Communication Platform', 50, 115)
       .text('support@patientletterhub.com', 50, 130);

    // Invoice Details
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 350, 100)
       .text(`Invoice Date: ${invoice.invoiceDate}`, 350, 115)
       .text(`Due Date: ${invoice.dueDate}`, 350, 130)
       .text(`Payment Terms: ${invoice.paymentTerms}`, 350, 145);

    // Customer Details
    doc.text('Bill To:', 50, 180)
       .fontSize(11)
       .text(practice?.name || 'Practice', 50, 200)
       .text(practice?.email || user?.email || '', 50, 215)
       .text(practice?.phone || '', 50, 230);

    // Order Details
    doc.fontSize(12).text('Order Details:', 50, 270);
    
    // Table Header
    const tableTop = 300;
    doc.text('Description', 50, tableTop)
       .text('Quantity', 250, tableTop)
       .text('Rate', 350, tableTop)
       .text('Amount', 450, tableTop);

    // Draw line
    doc.moveTo(50, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .stroke();

    // Order line items
    let currentY = tableTop + 30;
    
    doc.fontSize(10)
       .text(`${order?.subject || 'Letter Campaign'}`, 50, currentY)
       .text(`${order?.recipientCount || 0}`, 250, currentY)
       .text(`$${(parseFloat(invoice.subtotal) / (order?.recipientCount || 1)).toFixed(2)}`, 350, currentY)
       .text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, 450, currentY);

    currentY += 20;

    // Additional services
    if (order?.dataCleansing) {
      doc.text('Data Cleansing Service', 50, currentY)
         .text('1', 250, currentY)
         .text('$25.00', 350, currentY)
         .text('$25.00', 450, currentY);
      currentY += 20;
    }

    if (order?.ncoaUpdate) {
      doc.text('NCOA Update Service', 50, currentY)
         .text('1', 250, currentY)
         .text('$15.00', 350, currentY)
         .text('$15.00', 450, currentY);
      currentY += 20;
    }

    if (order?.firstClassPostage) {
      doc.text('First Class Postage', 50, currentY)
         .text('1', 250, currentY)
         .text('Included', 350, currentY)
         .text('$0.00', 450, currentY);
      currentY += 20;
    }

    // Total section
    currentY += 20;
    doc.moveTo(350, currentY)
       .lineTo(550, currentY)
       .stroke();

    currentY += 10;
    doc.fontSize(11)
       .text('Subtotal:', 350, currentY)
       .text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, 450, currentY);

    currentY += 15;
    doc.text('Tax:', 350, currentY)
       .text(`$${parseFloat(invoice.taxAmount || '0').toFixed(2)}`, 450, currentY);

    currentY += 15;
    doc.fontSize(12)
       .text('Total:', 350, currentY)
       .text(`$${parseFloat(invoice.totalAmount).toFixed(2)}`, 450, currentY);

    // Payment Terms
    doc.fontSize(10)
       .text('Payment Terms:', 50, currentY + 50)
       .text(`This invoice is due within ${(invoice.paymentTerms || 'Net 30').toLowerCase()}.`, 50, currentY + 65)
       .text('Please include invoice number with payment.', 50, currentY + 80);

    // Notes
    if (invoice.notes) {
      doc.text('Notes:', 50, currentY + 110)
         .text(invoice.notes, 50, currentY + 125);
    }

    // Finalize PDF
    doc.end();

    // Update invoice with PDF path
    await db
      .update(invoices)
      .set({ pdfPath: `uploads/invoices/${fileName}` })
      .where(eq(invoices.id, invoiceId));

    return filePath;
  }

  // Get invoice by ID
  async getInvoice(invoiceId: number): Promise<Invoice | null> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    return invoice || null;
  }

  // Get invoices for a user
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));
  }

  // Get all invoices (admin view)
  async getAllInvoices(): Promise<Invoice[]> {
    try {
      return await db
        .select()
        .from(invoices)
        .orderBy(desc(invoices.createdAt));
    } catch (error) {
      console.error('Error fetching all invoices:', error);
      throw error;
    }
  }

  // Update invoice status
  async updateInvoiceStatus(invoiceId: number, status: string): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ 
        status,
        updatedAt: new Date(),
        ...(status === 'paid' && { paidAt: new Date() })
      })
      .where(eq(invoices.id, invoiceId))
      .returning();

    return invoice;
  }

  // Mark invoice as paid
  async markInvoiceAsPaid(invoiceId: number, paidAmount: number, paymentMethod: string): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({
        status: 'paid',
        paidAmount: paidAmount.toString(),
        paymentMethod,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId))
      .returning();

    return invoice;
  }
}

export const invoiceService = new InvoiceService();