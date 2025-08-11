import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
// import { resend } from "@/lib/email"; // Temporarily commented out

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id;
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

    // Check if user has permission to view this order
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id;
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

    const { status } = await req.json();
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Check if user has permission to update this order
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { userId: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

    const { to, subject, message } = await req.json();
    if (!to || !subject || !message) {
      return NextResponse.json({ error: "Missing email fields" }, { status: 400 });
    }

    // Check if user has permission to send email for this order
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { userId: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // TODO: Re-enable email functionality after authentication is working
    // Send email using Resend
    // await resend.emails.send({
    //   from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
    //   to,
    //   subject,
    //   html: `<div>${message}</div>`
    // });
    
    console.log(`Email would be sent: To: ${to}, Subject: ${subject}, Message: ${message}`);
    return NextResponse.json({ success: true, message: "Email functionality temporarily disabled" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}

// Customer approval endpoint
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id;
  try {
    console.log(`🔍 PUT /api/orders/${orderId}: Starting approval process`);
    
    const { userId } = await auth();
    if (!userId) {
      console.log(`❌ PUT /api/orders/${orderId}: Unauthorized - no userId`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      console.log(`❌ PUT /api/orders/${orderId}: User not found for clerkId ${userId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`✅ PUT /api/orders/${orderId}: User authenticated: ${user.email} (${user.role})`);

    const { revisionId, comments, decision } = await req.json();
    console.log(`🔍 PUT /api/orders/${orderId}: Request data:`, { revisionId, decision, comments: comments ? 'provided' : 'none' });

    if (!revisionId || !decision) {
      console.log(`❌ PUT /api/orders/${orderId}: Missing required fields`);
      return NextResponse.json({ error: "Revision ID and decision are required" }, { status: 400 });
    }

    // Check if user has permission to approve this order
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { userId: true, status: true, orderNumber: true }
    });

    if (!order) {
      console.log(`❌ PUT /api/orders/${orderId}: Order not found`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log(`🔍 PUT /api/orders/${orderId}: Order found: ${order.orderNumber}, status: ${order.status}, userId: ${order.userId}`);

    if (order.userId !== user.id && user.role !== "ADMIN") {
      console.log(`❌ PUT /api/orders/${orderId}: Unauthorized - user ${user.id} cannot access order ${order.userId}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify order is in waiting-approval status (including rev1, rev2, rev3)
    if (!order.status.startsWith("waiting-approval")) {
      console.log(`❌ PUT /api/orders/${orderId}: Invalid status for approval: ${order.status}`);
      return NextResponse.json(
        { error: "Order is not waiting for proof approval" },
        { status: 400 }
      );
    }

    // Get the current revision number based on status
    let currentRevision = 1;
    if (order.status === 'waiting-approval-rev1') currentRevision = 1;
    else if (order.status === 'waiting-approval-rev2') currentRevision = 2;
    else if (order.status === 'waiting-approval-rev3') currentRevision = 3;

    console.log(`🔍 PUT /api/orders/${orderId}: Current revision: ${currentRevision}`);

    // Create or update the approval record
    const approvalData = {
      orderId: orderId,
      revision: currentRevision,
      status: decision,
      comments: comments || null,
      approvedBy: user.id,
    };

    console.log(`🔍 PUT /api/orders/${orderId}: Approval data:`, approvalData);

    // Check if approval record already exists for this revision
    const existingApproval = await prisma.orderApprovals.findFirst({
      where: {
        orderId: orderId,
        revision: currentRevision
      }
    });

    let approvalRecord;
    if (existingApproval) {
      console.log(`🔍 PUT /api/orders/${orderId}: Updating existing approval ${existingApproval.id}`);
      // Update existing approval
      approvalRecord = await prisma.orderApprovals.update({
        where: { id: existingApproval.id },
        data: approvalData
      });
    } else {
      console.log(`🔍 PUT /api/orders/${orderId}: Creating new approval record`);
      // Create new approval
      approvalRecord = await prisma.orderApprovals.create({
        data: approvalData
      });
    }

    console.log(`✅ PUT /api/orders/${orderId}: Approval record ${approvalRecord.id} created/updated`);

    // Update order status based on decision
    let newStatus = 'approved';
    if (decision === 'changes-requested') {
      // Determine next revision number
      if (currentRevision === 1) newStatus = 'waiting-approval-rev2';
      else if (currentRevision === 2) newStatus = 'waiting-approval-rev3';
      else if (currentRevision === 3) newStatus = 'changes-requested'; // Max revisions reached
    }

    console.log(`🔍 PUT /api/orders/${orderId}: Updating order status from ${order.status} to ${newStatus}`);

    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      },
      include: {
        practice: true,
        files: true,
        approvals: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log(`✅ PUT /api/orders/${orderId}: Order status updated successfully`);

    // Create status history record
    const statusHistoryRecord = await prisma.orderStatusHistory.create({
      data: {
        orderId: orderId,
        fromStatus: order.status,
        toStatus: newStatus,
        changedBy: user.id,
        changedByRole: user.role as any,
        comments: comments || null,
        metadata: {
          decision: decision,
          revision: currentRevision,
          approvalId: approvalRecord.id
        }
      }
    });

    console.log(`✅ PUT /api/orders/${orderId}: Status history record ${statusHistoryRecord.id} created`);

    console.log(`✅ PUT /api/orders/${orderId}: Approval process completed successfully`);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      approval: approvalRecord,
      message: `Order ${decision} successfully`
    });

  } catch (err) {
    console.error(`❌ PUT /api/orders/${orderId}: Error in approval process:`, err);
    return NextResponse.json({ 
      error: "Failed to process approval",
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 });
  }
} 