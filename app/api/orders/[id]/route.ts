import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/email";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id;
  try {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        files: true,
        user: true,
        practice: true,
        approvals: {
          orderBy: { createdAt: 'desc' }
        }
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id;
  try {
    const { status } = await req.json();
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: { status },
    });
    return NextResponse.json({ order: updatedOrder });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id;
  try {
    const { to, subject, message } = await req.json();
    if (!to || !subject || !message) {
      return NextResponse.json({ error: "Missing email fields" }, { status: 400 });
    }
    // Send email using Resend
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      to,
      subject,
      html: `<div>${message}</div>`
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}

// Customer approval endpoint
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id;
  try {
    const { revisionId, comments, decision } = await req.json();

    if (!revisionId || !decision) {
      return NextResponse.json({ error: "Revision ID and decision are required" }, { status: 400 });
    }

    // Update the approval record
    await prisma.orderApprovals.update({
      where: { id: revisionId },
      data: {
        status: decision,
        comments: comments || null,
        approvedBy: "customer", // This should come from session in production
      },
    });

    // Update order status based on decision
    let newStatus = 'approved';
    if (decision === 'changes-requested') {
      newStatus = 'draft'; // Return to draft for admin to make changes
    }

        const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      },
      include: {
        practice: true
      }
    });

    // Send notification email to admin
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
        to: "admin@yourdomain.com", // This should be the admin email
        subject: `Order ${updatedOrder.orderNumber} - Customer ${decision}`,
        html: `
          <div>
            <h2>Customer Decision for Order ${updatedOrder.orderNumber}</h2>
            <p><strong>Decision:</strong> ${decision}</p>
            ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
            <p><strong>Customer:</strong> ${updatedOrder.practice?.name || 'Unknown'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order ${decision} successfully`
    });

  } catch (err) {
    console.error('Approval error:', err);
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
  }
} 