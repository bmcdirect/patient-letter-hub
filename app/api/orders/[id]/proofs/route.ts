import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/session-manager";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 GET /api/orders/${params.id}/proofs: Starting request`);
    
    const { userId } = await auth();
    
    if (!userId) {
      console.log(`❌ GET /api/orders/${params.id}/proofs: Unauthorized - no userId`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getCurrentUser();
    
    if (!user) {
      console.log(`❌ GET /api/orders/${params.id}/proofs: User not found for clerkId ${userId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`✅ GET /api/orders/${params.id}/proofs: User authenticated: ${user.email} (${user.role})`);

    const orderId = params.id;

    // Get order with files and approvals
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        files: {
          where: {
            fileType: 'admin-proof'
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        approvals: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!order) {
      console.log(`❌ GET /api/orders/${params.id}/proofs: Order not found`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log(`🔍 GET /api/orders/${params.id}/proofs: Order found: ${order.orderNumber}, files: ${order.files.length}, approvals: ${order.approvals.length}`);

    // Check if user has permission to view this order
    if (order.userId !== user.id && user.role !== "ADMIN") {
      console.log(`❌ GET /api/orders/${params.id}/proofs: Unauthorized - user ${user.id} cannot access order ${order.userId}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    console.log(`✅ GET /api/orders/${params.id}/proofs: Request successful`);

    return NextResponse.json({ 
      proofs: order.files,
      approvals: order.approvals,
      orderStatus: order.status
    });
  } catch (error) {
    console.error(`❌ GET /api/orders/${params.id}/proofs: Error:`, error);
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Your proofs logic here
    return NextResponse.json({ 
      message: "Proofs logic would be implemented here",
      orderId: params.id,
      userId: user.id 
    });
  } catch (error) {
    console.error("Error handling proofs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 