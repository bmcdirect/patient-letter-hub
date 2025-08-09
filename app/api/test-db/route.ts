import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  try {
    console.log("🔍 /api/test-db: Starting request");
    
    return NextResponse.json({
      success: true,
      message: "Database test route working",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in /api/test-db route:", error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
};
