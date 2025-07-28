import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const orderId = formData.get("orderId") as string;
    const fileType = formData.get("fileType") as string || "customer_data";
    const revisionNumber = formData.get("revisionNumber") as string;
    const adminNotes = formData.get("adminNotes") as string;

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

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${fileType}_${timestamp}.${fileExtension}`;
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
        uploadedBy: "admin", // This should come from session in production
      },
    });

    // If this is a proof upload, create revision record
    if (fileType === 'admin-proof' && revisionNumber) {
      // Create revision record in OrderApprovals table
      await prisma.orderApprovals.create({
        data: {
          orderId: orderId,
          revision: parseInt(revisionNumber),
          status: 'pending',
          comments: adminNotes || null,
          approvedBy: "admin", // This should come from session in production
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
      file: savedFile,
      message: fileType === 'admin-proof' 
        ? `Proof uploaded successfully! Revision ${revisionNumber} is ready for customer review.`
        : 'File uploaded successfully!'
    });

  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
} 