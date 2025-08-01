import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
// import { auth } from "@/auth"; // Temporarily commented out
import { StatusManager, type OrderStatus } from "@/lib/status-management";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Temporarily bypass auth for development
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    
    // Mock user for development
    const mockUser = { id: "1", role: "USER" as const };

    const orderId = params.id;
    const { newStatus, comments } = await req.json();

    // Get the order with current status
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { 
        user: true, 
        practice: true,
        statusHistory: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check permissions (user owns the order or is admin)
    if (order.userId !== mockUser.id && mockUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const currentStatus = order.status as OrderStatus;
    const userRole = mockUser.role as 'ADMIN' | 'USER';

    // Validate the status transition
    const validation = StatusManager.isValidTransition(currentStatus, newStatus, userRole);
    
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.error || "Invalid status transition" 
      }, { status: 400 });
    }

    const transition = validation.transition!;

    // Check if comments are required but not provided
    if (transition.requiresComment && (!comments || comments.trim() === '')) {
      return NextResponse.json({ 
        error: "Comments are required for this status transition" 
      }, { status: 400 });
    }

    // Perform the status change within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the order status
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: { 
          status: newStatus,
          updatedAt: new Date()
        },
        include: { 
          user: true, 
          practice: true,
          statusHistory: {
            include: { user: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      // Create status history entry
      const statusHistoryEntry = await tx.orderStatusHistory.create({
        data: {
          orderId: orderId,
          fromStatus: currentStatus,
          toStatus: newStatus,
          changedBy: mockUser.id,
          changedByRole: userRole,
          comments: comments || null,
          metadata: {
            transitionDescription: transition.description,
            autoNotify: transition.autoNotify
          }
        },
        include: { user: true }
      });

      // Send email notification if autoNotify is enabled
      if (transition.autoNotify) {
        try {
          const notificationData = {
            emailType: 'status_change',
            recipientEmail: order.practice?.email || order.user?.email || 'customer@example.com',
            subject: `Order Status Updated - ${order.orderNumber}`,
            content: `Your order ${order.orderNumber} status has been updated from "${currentStatus}" to "${newStatus}". ${comments ? `Comments: ${comments}` : ''}`,
            orderId: orderId,
            practiceId: order.practiceId,
            userId: order.userId
          };

          await fetch(`${req.nextUrl.origin}/api/admin/emails`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notificationData)
          });
        } catch (emailError) {
          console.error("Failed to send status change notification:", emailError);
        }
      }

      return { updatedOrder, statusHistoryEntry };
    });

    return NextResponse.json({
      message: "Status updated successfully",
      order: result.updatedOrder,
      statusHistory: result.statusHistoryEntry
    });

  } catch (err) {
    console.error("Error updating order status:", err);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Temporarily bypass auth for development
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    
    // Mock user for development
    const mockUser = { id: "1", role: "USER" as const };

    const orderId = params.id;

    // Get the order with status history
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { 
        user: true, 
        practice: true,
        statusHistory: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check permissions (user owns the order or is admin)
    if (order.userId !== mockUser.id && mockUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const currentStatus = order.status as OrderStatus;
    const userRole = mockUser.role as 'ADMIN' | 'USER';

    // Get available transitions for current user
    const availableTransitions = StatusManager.getAvailableTransitions(currentStatus, userRole);

    // Get status display info
    const statusInfo = StatusManager.getStatusDisplayInfo(currentStatus);

    return NextResponse.json({
      currentStatus,
      statusInfo,
      availableTransitions,
      statusHistory: order.statusHistory,
      isCustomerActionable: StatusManager.isCustomerActionable(currentStatus),
      isAdminActionable: StatusManager.isAdminActionable(currentStatus),
      requiresCustomerAction: StatusManager.requiresCustomerAction(currentStatus),
      requiresAdminAction: StatusManager.requiresAdminAction(currentStatus)
    });

  } catch (err) {
    console.error("Error fetching order status:", err);
    return NextResponse.json({ error: "Failed to fetch order status" }, { status: 500 });
  }
} 