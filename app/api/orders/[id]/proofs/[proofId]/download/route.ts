import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; proofId: string } }
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

    const orderId = params.id;
    const proofId = params.proofId;

    // Get the order to verify user has access
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { practice: true }
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Check if user has access to this order
    if (user.role !== 'ADMIN' && order.practiceId !== user.practiceId) {
      return new NextResponse("Access denied", { status: 403 });
    }

    // Get the proof record
    const proof = await prisma.proof.findUnique({
      where: { id: proofId }
    });

    if (!proof) {
      return new NextResponse("Proof not found", { status: 404 });
    }

    // Verify this proof belongs to the order
    if (proof.orderId !== orderId) {
      return new NextResponse("Proof does not belong to this order", { status: 400 });
    }

    // Check if proof has file data
    if (!proof.fileData) {
      return new NextResponse("Proof file data not found", { status: 404 });
    }

    // Ensure fileData is a Buffer
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(proof.fileData)) {
      fileBuffer = proof.fileData;
    } else if (proof.fileData instanceof Uint8Array) {
      fileBuffer = Buffer.from(proof.fileData);
    } else {
      console.log('❌ Proof Download - Invalid file data type:', typeof proof.fileData);
      return new NextResponse("Invalid file data format", { status: 500 });
    }

    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', proof.fileType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${proof.fileName || 'proof.pdf'}"`);
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Cache-Control', 'private, max-age=3600');

    console.log(`📁 Proof Download - Serving proof: ${proof.fileName} (${fileBuffer.length} bytes, ${proof.fileType})`);

    // Return the file data as a response
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error("Error downloading proof:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
