import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { StatusManager, STATUS_TRANSITIONS, type OrderStatus } from "@/lib/status-management";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const currentStatus = order.status as OrderStatus;
    const userRole = user.role as 'ADMIN' | 'USER';

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
          changedBy: user.id,
          changedByRole: userRole,
          comments: comments || null,
          metadata: {
            transitionDescription: transition.description,
            autoNotify: transition.autoNotify
          }
        },
        include: { user: true }
      });

      return { updatedOrder, statusHistoryEntry };
    });

    // Return the updated order with status history
    return NextResponse.json({
      success: true,
      order: result.updatedOrder,
      statusHistory: result.statusHistoryEntry,
      message: `Order status updated to ${newStatus}`
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const orderId = params.id;

    // Get the order to check permissions and current status
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { userId: true, status: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user has permission to view this order
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get status history for this order
    const statusHistory = await prisma.orderStatusHistory.findMany({
      where: { orderId },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });

    // Get available status transitions for the current status
    const currentStatus = order.status as OrderStatus;
    const userRole = user.role as 'ADMIN' | 'USER';
    
    console.log(`🔍 Status endpoint: Current status: ${currentStatus}, User role: ${userRole}`);
    
    // Get all possible transitions from current status
    const allTransitions = STATUS_TRANSITIONS.filter(t => t.from === currentStatus);
    console.log(`🔍 Status endpoint: All transitions from ${currentStatus}:`, allTransitions);
    
    // Filter transitions based on user role
    const availableTransitions = allTransitions.filter(t => 
      t.allowedRoles.includes(userRole)
    );
    console.log(`🔍 Status endpoint: Available transitions for ${userRole}:`, availableTransitions);

    // Get status info for current status
    const statusInfo = StatusManager.getStatusDisplayInfo(currentStatus);
    console.log(`🔍 Status endpoint: Status info:`, statusInfo);

    const responseData = { 
      statusHistory,
      availableTransitions,
      statusInfo,
      currentStatus
    };
    
    console.log(`🔍 Status endpoint: Returning:`, responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching status information:", error);
    return NextResponse.json({ error: "Failed to fetch status information" }, { status: 500 });
  }
} 