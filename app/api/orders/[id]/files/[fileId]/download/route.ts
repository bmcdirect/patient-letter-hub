import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/session-manager";
import { prisma } from "@/lib/db";

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

    // Check if file has data
    if (!file.fileData) {
      return new NextResponse("File data not found", { status: 404 });
    }

    // Ensure fileData is a Buffer
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(file.fileData)) {
      fileBuffer = file.fileData;
    } else if (file.fileData instanceof Uint8Array) {
      fileBuffer = Buffer.from(file.fileData);
    } else {
      console.log('❌ Order File Download - Invalid file data type:', typeof file.fileData);
      return new NextResponse("Invalid file data format", { status: 500 });
    }

    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', file.fileType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${file.fileName}"`);
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Cache-Control', 'private, max-age=3600');

    console.log(`📁 Order File Download - Serving file: ${file.fileName} (${fileBuffer.length} bytes, ${file.fileType})`);

    // Return the file data as a response
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error("Error downloading file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 