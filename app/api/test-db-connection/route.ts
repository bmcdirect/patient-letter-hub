import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const GET = async (req: Request) => {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Forbidden', { status: 403 });
  }
  
  try {
    console.log("🔍 /api/test-db-connection: Starting request");
    
    // Test database connection
    await prisma.$connect();
    console.log("🔍 /api/test-db-connection: Database connected successfully");
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log("🔍 /api/test-db-connection: User count:", userCount);
    
    return NextResponse.json({
      success: true,
      message: "Database connection working",
      userCount: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in /api/test-db-connection route:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
