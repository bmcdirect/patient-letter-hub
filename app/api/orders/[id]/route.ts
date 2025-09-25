import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/session-manager";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user's Clerk session
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database to check their role and practice
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orderId = params.id;

    // Get the order with all related data
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        practice: true,
        user: true,
        files: {
          orderBy: { createdAt: "desc" }
        },
        approvals: true,
        invoices: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user has permission to view this order
    if (user.role !== 'ADMIN' && order.practiceId !== user.practiceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    console.log('🔍 Orders API - Fetched order:', {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      practiceId: order.practiceId,
      userId: order.userId
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("❌ Orders API - Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const orderId = params.id;
    const body = await req.json();

    // Get the existing order to check permissions
    const existingOrder = await prisma.orders.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user has permission to edit this order
    if (user.role !== 'ADMIN' && existingOrder.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the order
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        subject: body.subject,
        purchaseOrder: body.purchaseOrder,
        costCenter: body.costCenter,
        actualRecipients: body.actualRecipients,
        cost: body.cost,
        status: body.status,
        colorMode: body.colorMode,
        preferredMailDate: body.preferredMailDate ? new Date(body.preferredMailDate) : undefined,
        dataCleansing: body.dataCleansing,
        ncoaUpdate: body.ncoaUpdate,
        firstClassPostage: body.firstClassPostage,
        notes: body.notes,
        // Add other fields as needed
      },
      include: {
        practice: true,
        user: true,
        files: true,
      },
    });

    console.log('✅ Orders API - Updated order:', {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("❌ Orders API - Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const orderId = params.id;

    // Get the existing order to check permissions
    const existingOrder = await prisma.orders.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user has permission to delete this order
    if (user.role !== 'ADMIN' && existingOrder.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the order (this will cascade delete related files, approvals, etc.)
    await prisma.orders.delete({
      where: { id: orderId }
    });

    console.log('✅ Orders API - Deleted order:', {
      id: orderId,
      orderNumber: existingOrder.orderNumber
    });

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("❌ Orders API - Error deleting order:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the current user's Clerk session
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;
    const { status } = await req.json();
    
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: { status },
      include: {
        practice: true,
        user: true,
        files: true,
      },
    });

    console.log('✅ Orders API - Updated order status:', {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (err) {
    console.error("❌ Orders API - Error updating order status:", err);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the current user's Clerk session
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;
    const { to, subject, message } = await req.json();
    
    if (!to || !subject || !message) {
      return NextResponse.json({ error: "Missing email fields" }, { status: 400 });
    }

    // TODO: Implement email sending functionality
    // For now, just log the email request
    console.log('📧 Orders API - Email request:', {
      orderId,
      to,
      subject,
      message
    });

    return NextResponse.json({ success: true, message: "Email request logged (not yet implemented)" });
  } catch (err) {
    console.error("❌ Orders API - Error processing email request:", err);
    return NextResponse.json({ error: "Failed to process email request" }, { status: 500 });
  }
} 