import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user from our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Get the order to verify user has access
    const order = await prisma.orders.findUnique({
      where: { id: params.id },
      include: { practice: true }
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Check if user has access to this order
    if (user.role !== 'ADMIN' && order.practiceId !== user.practiceId) {
      return new NextResponse("Access denied", { status: 403 });
    }

    // Fetch proofs for this order
    const proofs = await prisma.orderApprovals.findMany({
      where: { orderId: params.id },
      include: { approver: true },
      orderBy: { revision: 'desc' }
    });

    console.log(`🔍 Proofs API - Fetched ${proofs.length} proofs for order ${params.id}`);

    return NextResponse.json({ proofs });
  } catch (error) {
    console.error("Error fetching proofs:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
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

    // Get the user from our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return new NextResponse("Admin access required", { status: 403 });
    }

    // Your proofs logic here
    return NextResponse.json({ 
      message: "Proofs logic would be implemented here",
      orderId: params.id,
      userId: user.id 
    });
  } catch (error) {
    console.error("Error handling proofs:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 