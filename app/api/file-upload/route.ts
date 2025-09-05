import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Create order-specific directory
    const orderDir = join(uploadsDir, orderId);
    if (!existsSync(orderDir)) {
      await mkdir(orderDir, { recursive: true });
    }

    // Generate unique filename while preserving original name
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const baseName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const fileName = `${baseName}_${timestamp}.${fileExtension}`;
    const filePath = join(orderDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save file metadata to database
    const savedFile = await prisma.orderFiles.create({
      data: {
        orderId: orderId,
        fileName: file.name,
        filePath: `/uploads/${orderId}/${fileName}`,
        fileType: fileType,
        uploadedBy: currentUser.id, // Use the authenticated user's ID
      },
    });

    return NextResponse.json({ 
      success: true, 
      file: savedFile,
      filePath: savedFile.filePath, // Add this for the proof creation
      fileUrl: savedFile.filePath,  // Use filePath as fileUrl for now
      message: 'File uploaded successfully!'
    });

  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
} 