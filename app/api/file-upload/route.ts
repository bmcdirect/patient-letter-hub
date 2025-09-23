import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-manager";

export async function POST(req: NextRequest) {
  try {
    // Get current user from session
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const orderId = formData.get("orderId") as string;
    const fileType = formData.get("fileType") as string || "customer_data";

    if (!file || !orderId) {
      return NextResponse.json({ error: "File and orderId are required" }, { status: 400 });
    }

    // Convert file to buffer for database storage
    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);

    // Save file metadata and binary data to database
    const savedFile = await prisma.orderFiles.create({
      data: {
        orderId: orderId,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileData: fileBuffer, // Store binary data in BYTEA column
        uploadedBy: currentUser.id, // Use the authenticated user's ID
      },
    });

    console.log(`✅ File uploaded to database: ${file.name} (${file.size} bytes) for order ${orderId}`);

    return NextResponse.json({ 
      success: true, 
      file: savedFile,
      message: 'File uploaded successfully!'
    });

  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
} 