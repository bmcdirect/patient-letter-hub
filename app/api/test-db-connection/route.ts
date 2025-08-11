import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Test basic database connection
    await prisma.$connect();
    
    // Test if OrderApprovals table exists and can be queried
    const approvalCount = await prisma.orderApprovals.count();
    
    // Test if Orders table exists and can be queried
    const orderCount = await prisma.orders.count();
    
    // Test if OrderFiles table exists and can be queried
    const fileCount = await prisma.orderFiles.count();
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      counts: {
        approvals: approvalCount,
        orders: orderCount,
        files: fileCount
      }
    });
  } catch (error) {
    console.error("Database connection test failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown database error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
