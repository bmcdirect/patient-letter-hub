import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 Files API - Starting request for file: ${params.id}`);
    
    // Add timeout wrapper for auth
    const authPromise = auth();
    const authTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    );
    
    const { userId } = await Promise.race([authPromise, authTimeoutPromise]) as any;
    console.log(`🔍 Files API - User ID: ${userId}`);
    
    if (!userId) {
      console.log('❌ Files API - No user ID found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database with timeout
    console.log('🔍 Files API - Fetching user from database...');
    const userPromise = prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        role: true,
        practiceId: true
      }
    });
    
    const userTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('User query timeout')), 10000)
    );
    
    const user = await Promise.race([userPromise, userTimeoutPromise]) as any;
    
    if (!user) {
      console.log('❌ Files API - User not found in database');
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    console.log(`✅ Files API - User found: ${user.email}, role: ${user.role}`);

    // Get the file from database with timeout
    console.log(`🔍 Files API - Fetching file: ${params.id}`);
    const filePromise = prisma.orderFiles.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        fileData: true,
        uploadedBy: true,
        orderId: true,
        order: {
          select: {
            practiceId: true,
            userId: true
          }
        }
      }
    });
    
    const fileTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('File query timeout')), 10000)
    );
    
    const file = await Promise.race([filePromise, fileTimeoutPromise]) as any;

    if (!file) {
      console.log(`❌ Files API - File not found: ${params.id}`);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    console.log(`✅ Files API - File found: ${file.fileName}, orderId: ${file.orderId}`);

    // Check if user has access to this file
    const hasAccess = 
      user.role === 'ADMIN' || // Admin can access all files
      (user.practiceId && file.order.practiceId === user.practiceId) || // User from same practice
      file.uploadedBy === user.id; // User uploaded the file

    console.log(`🔍 Files API - Access check:`, {
      userRole: user.role,
      userPracticeId: user.practiceId,
      fileOrderPracticeId: file.order.practiceId,
      fileUploadedBy: file.uploadedBy,
      userId: user.id,
      hasAccess
    });

    if (!hasAccess) {
      console.log('❌ Files API - Access denied');
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if file data exists
    if (!file.fileData) {
      console.log('❌ Files API - File data not found');
      return NextResponse.json({ error: "File data not found" }, { status: 404 });
    }
    
    console.log(`✅ Files API - File data found: ${file.fileData.length} bytes`);

    // Ensure fileData is a Buffer
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(file.fileData)) {
      fileBuffer = file.fileData;
    } else if (file.fileData instanceof Uint8Array) {
      fileBuffer = Buffer.from(file.fileData);
    } else {
      console.log('❌ Files API - Invalid file data type:', typeof file.fileData);
      return NextResponse.json({ error: "Invalid file data format" }, { status: 500 });
    }

    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', file.fileType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${file.fileName}"`);
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour

    console.log(`📁 Files API - Serving file: ${file.fileName} (${fileBuffer.length} bytes, ${file.fileType})`);

    // Return the file data as a response
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error("❌ Files API - Error serving file:", {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      fileId: params.id
    });
    return NextResponse.json({ 
      error: "Failed to serve file",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user's Clerk session
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the file from database
    const file = await prisma.orderFiles.findUnique({
      where: { id: params.id },
      include: {
        order: true
      }
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if user has permission to delete this file
    const canDelete = 
      user.role === 'ADMIN' || // Admin can delete all files
      file.uploadedBy === user.id; // User uploaded the file

    if (!canDelete) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Delete the file from database
    await prisma.orderFiles.delete({
      where: { id: params.id }
    });

    console.log(`🗑️ Files API - Deleted file: ${file.fileName}`);

    return NextResponse.json({ message: "File deleted successfully" });

  } catch (error) {
    console.error("❌ Files API - Error deleting file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
