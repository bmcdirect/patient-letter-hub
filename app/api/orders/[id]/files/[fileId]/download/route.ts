import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/session-manager";
import { prisma } from "@/lib/db";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const orderId = params.id;
    const fileId = params.fileId;

    // Get the file record
    const file = await prisma.orderFiles.findUnique({
      where: { id: fileId },
      include: { order: true }
    });

    if (!file) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Check if user has permission to download this file
    if (file.order.userId !== user.id && user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Check if file exists on disk
    if (!existsSync(file.filePath)) {
      return new NextResponse("File not found on disk", { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(file.filePath);

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.fileType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 