import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const orderId = formData.get("orderId") as string;
    const fileType = formData.get("fileType") as string || "customer_data";
    const revisionNumber = formData.get("revisionNumber") as string;
    const adminNotes = formData.get("adminNotes") as string;

    if (!files || files.length === 0 || !orderId) {
      return NextResponse.json({ error: "Files and orderId are required" }, { status: 400 });
    }

    // Check if user has permission to upload files for this order
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { userId: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow users to upload files for their own orders, or admins for any order
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

    const uploadedFiles: any[] = [];

    // Process each file
    for (const file of files) {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const fileName = `${fileType}_${timestamp}_${randomSuffix}.${fileExtension}`;
      const filePath = join(orderDir, fileName);

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Save file metadata to database with correct path format
      const savedFile = await prisma.orderFiles.create({
        data: {
          orderId: orderId,
          fileName: file.name, // Store original filename
          filePath: `uploads/${orderId}/${fileName}`, // Store relative path without leading slash
          fileType: fileType,
          uploadedBy: user.id,
        },
      });

      uploadedFiles.push(savedFile);
    }

    // If this is a proof upload, create revision record
    if (fileType === 'admin-proof' && revisionNumber) {
      // Create revision record in OrderApprovals table
      await prisma.orderApprovals.create({
        data: {
          orderId: orderId,
          revision: parseInt(revisionNumber),
          status: 'pending',
          comments: adminNotes || null,
          approvedBy: user.id,
        },
      });

      // Update order status to waiting-approval
      await prisma.orders.update({
        where: { id: orderId },
        data: { 
          status: `waiting-approval-rev${revisionNumber}`,
          updatedAt: new Date()
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      files: uploadedFiles,
      message: fileType === 'admin-proof' 
        ? `Proof uploaded successfully! Revision ${revisionNumber} is ready for customer review.`
        : `${uploadedFiles.length} file(s) uploaded successfully!`
    });

  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 });
  }
} 