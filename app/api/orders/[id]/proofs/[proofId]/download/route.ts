import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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

    // Construct the file path for the proof using the stored filePath
    let proofFilePath;
    
    if (proof.filePath) {
      // If filePath is a relative path (starts with /uploads/), convert to absolute
      if (proof.filePath.startsWith('/uploads/')) {
        proofFilePath = join(process.cwd(), proof.filePath.substring(1)); // Remove leading /
      } else {
        // If it's already an absolute path, use as is
        proofFilePath = proof.filePath;
      }
    } else {
      return new NextResponse("Proof file path not found", { status: 404 });
    }
    
    console.log(`🔍 Looking for proof file at: ${proofFilePath}`);
    
    if (!existsSync(proofFilePath)) {
      console.log(`❌ Proof file not found at: ${proofFilePath}`);
      return new NextResponse("Proof file not found", { status: 404 });
    }

    // Read and return the file
    const fileBuffer = await readFile(proofFilePath);
    const fileName = proofFilePath.split('/').pop() || 'proof.pdf';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error downloading proof:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
