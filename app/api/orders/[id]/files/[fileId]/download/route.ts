import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const { id: orderId, fileId } = params;

    // Get the file record from database
    const fileRecord = await prisma.orderFiles.findUnique({
      where: { id: fileId },
      include: {
        order: {
          select: { userId: true }
        }
      }
    });

    if (!fileRecord) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Check if user has permission to download this file
    if (fileRecord.order.userId !== user.id && user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Construct the full file path
    const filePath = join(process.cwd(), fileRecord.filePath);

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error(`File not found at path: ${filePath}`);
      console.error(`Stored filePath: ${fileRecord.filePath}`);
      console.error(`Process cwd: ${process.cwd()}`);
      return new NextResponse("File not found on disk", { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const fileExtension = fileRecord.fileName.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (fileExtension) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'doc':
        contentType = 'application/msword';
        break;
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'xls':
        contentType = 'application/vnd.ms-excel';
        break;
      case 'xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileRecord.fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error("Error downloading file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 