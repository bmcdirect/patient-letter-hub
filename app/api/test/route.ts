import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const GET = async (req: Request) => {
  try {
    console.log("🔍 /api/test: Starting request");
    
    const { userId, orgId } = await auth();
    console.log("🔍 /api/test: Auth result - userId:", userId, "orgId:", orgId);
    
    return NextResponse.json({
      success: true,
      userId,
      orgId,
      message: "Test route working"
    });
  } catch (error) {
    console.error("Error in /api/test route:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
};
