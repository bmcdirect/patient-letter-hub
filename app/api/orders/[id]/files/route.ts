import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 Order Files API - Starting request for order: ${params.id}`);
    
    // Add timeout wrapper for auth
    const authPromise = auth();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    );
    
    const { userId } = await Promise.race([authPromise, timeoutPromise]) as any;
    console.log(`🔍 Order Files API - User ID: ${userId}`);
    
    if (!userId) {
      console.log('❌ Order Files API - No user ID found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database with timeout
    console.log('🔍 Order Files API - Fetching user from database...');
    const userPromise = prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        role: true,
        practiceId: true
      }
    });
    
    const userTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('User query timeout')), 10000)
    );
    
    const user = await Promise.race([userPromise, userTimeoutPromise]) as any;
    
    if (!user) {
      console.log('❌ Order Files API - User not found in database');
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    console.log(`✅ Order Files API - User found: ${user.email}, role: ${user.role}, practiceId: ${user.practiceId}`);

    // Get the order to check access with timeout
    console.log(`🔍 Order Files API - Fetching order: ${params.id}`);
    const orderPromise = prisma.orders.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        orderNumber: true,
        practiceId: true,
        userId: true
      }
    });
    
    const orderTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Order query timeout')), 10000)
    );
    
    const order = await Promise.race([orderPromise, orderTimeoutPromise]) as any;

    if (!order) {
      console.log(`❌ Order Files API - Order not found: ${params.id}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    
    console.log(`✅ Order Files API - Order found: ${order.orderNumber}, practiceId: ${order.practiceId}, userId: ${order.userId}`);

    // Check if user has access to this order
    const hasAccess = 
      user.role === 'ADMIN' || // Admin can access all orders
      (user.practiceId && order.practiceId === user.practiceId) || // User from same practice
      order.userId === user.id; // User created the order

    console.log(`🔍 Order Files API - Access check:`, {
      userRole: user.role,
      userPracticeId: user.practiceId,
      orderPracticeId: order.practiceId,
      orderUserId: order.userId,
      userId: user.id,
      hasAccess
    });

    if (!hasAccess) {
      console.log('❌ Order Files API - Access denied');
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get files for this order (without file data for performance) with timeout
    console.log(`🔍 Order Files API - Fetching files for order: ${params.id}`);
    const filesPromise = prisma.orderFiles.findMany({
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
    
    const filesTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Files query timeout')), 10000)
    );
    
    const files = await Promise.race([filesPromise, filesTimeoutPromise]) as any;

    console.log(`✅ Order Files API - Found ${files.length} files for order ${params.id}:`, files.map((f: any) => ({ id: f.id, fileName: f.fileName, fileSize: f.fileSize })));

    return NextResponse.json({ files });

  } catch (error) {
    console.error("❌ Order Files API - Error fetching files:", {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      orderId: params.id
    });
    return NextResponse.json({ 
      error: "Failed to fetch files",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}