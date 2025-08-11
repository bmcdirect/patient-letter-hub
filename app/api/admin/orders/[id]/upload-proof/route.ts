import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if user is admin
    if (user.role !== "ADMIN") {
      return new NextResponse("Forbidden - Admin access required", { status: 403 });
    }

    const formData = await request.formData();
    const proofFile = formData.get("proofFile") as File;
    const adminNotes = formData.get("adminNotes") as string;
    const revisionNumber = formData.get("revisionNumber") as string;

    if (!proofFile || !revisionNumber) {
      return new NextResponse("Proof file and revision number are required", { status: 400 });
    }

    // Check if order exists
    const order = await prisma.orders.findUnique({
      where: { id: params.id },
      include: { practice: true }
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Create order-specific directory
    const orderDir = join(uploadsDir, params.id);
    if (!existsSync(orderDir)) {
      await mkdir(orderDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExtension = proofFile.name.split('.').pop()?.toLowerCase() || 'pdf';
    const fileName = `admin-proof_${timestamp}_${randomSuffix}.${fileExtension}`;
    const filePath = join(orderDir, fileName);

    // Convert file to buffer and save
    const bytes = await proofFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save file metadata to database
    const savedFile = await prisma.orderFiles.create({
      data: {
        orderId: params.id,
        fileName: proofFile.name,
        filePath: `uploads/${params.id}/${fileName}`,
        fileType: 'admin-proof',
        uploadedBy: user.id,
      },
    });

    // Create revision record in OrderApprovals table
    await prisma.orderApprovals.create({
      data: {
        orderId: params.id,
        revision: parseInt(revisionNumber),
        status: 'pending',
        comments: adminNotes || null,
        approvedBy: user.id,
      },
    });

    // Update order status to waiting-approval
    await prisma.orders.update({
      where: { id: params.id },
      data: { 
        status: `waiting-approval-rev${revisionNumber}`,
        updatedAt: new Date()
      },
    });

    return NextResponse.json({ 
      success: true,
      message: `Proof uploaded successfully! Revision ${revisionNumber} is ready for customer review.`,
      file: savedFile,
      orderId: params.id
    });

  } catch (error) {
    console.error("Error uploading proof:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}