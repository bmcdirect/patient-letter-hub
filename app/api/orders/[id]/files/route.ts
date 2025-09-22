import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

    // Get the user from our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { practice: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the order to check access
    const order = await prisma.orders.findUnique({
      where: { id: params.id },
      include: {
        practice: true,
        user: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user has access to this order
    const hasAccess = 
      user.role === 'ADMIN' || // Admin can access all orders
      (user.practiceId && order.practiceId === user.practiceId) || // User from same practice
      order.userId === user.id; // User created the order

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get files for this order (without file data for performance)
    const files = await prisma.orderFiles.findMany({
      where: { orderId: params.id },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        uploadedBy: true,
        createdAt: true,
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📁 Order Files API - Found ${files.length} files for order ${params.id}`);

    return NextResponse.json({ files });

  } catch (error) {
    console.error("❌ Order Files API - Error fetching files:", error);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}