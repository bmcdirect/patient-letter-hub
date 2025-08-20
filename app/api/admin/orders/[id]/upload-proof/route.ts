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

    // Get the user from our database
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

    const orderId = params.id;
    
    // Verify the order exists
    const order = await prisma.orders.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Parse form data for file upload
    const formData = await request.formData();
    const proofFile = formData.get('proofFile') as File;
    const revision = parseInt(formData.get('revision') as string) || 1;
    const comments = formData.get('comments') as string || '';

    if (!proofFile) {
      return new NextResponse("Proof file is required", { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads", orderId, "proofs");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save the proof file
    const bytes = await proofFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const fileName = `admin-proof_${timestamp}_${proofFile.name}`;
    const filePath = join(uploadsDir, fileName);
    
    await writeFile(filePath, buffer);

    // Create OrderApproval record
    const approval = await prisma.orderApprovals.create({
      data: {
        orderId: orderId,
        revision: revision,
        status: 'pending',
        comments: comments,
        approvedBy: user.id,
        filePath: fileName, // Store the filename for easy retrieval
      }
    });

    // Update order status to indicate proof is ready
    await prisma.orders.update({
      where: { id: orderId },
      data: { status: 'proof-ready' }
    });

    console.log(`✅ Admin proof uploaded: ${fileName} for order ${orderId}`);

    return NextResponse.json({ 
      message: "Proof uploaded successfully",
      approval: approval,
      fileName: fileName
    });
  } catch (error) {
    console.error("Error uploading proof:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}