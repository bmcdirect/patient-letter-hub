import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(
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
      where: { clerkId: userId },
      include: { practice: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the file from database
    const file = await prisma.orderFiles.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            practice: true,
            user: true
          }
        }
      }
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if user has access to this file
    const hasAccess = 
      user.role === 'ADMIN' || // Admin can access all files
      (user.practiceId && file.order.practiceId === user.practiceId) || // User from same practice
      file.uploadedBy === user.id; // User uploaded the file

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if file data exists
    if (!file.fileData) {
      return NextResponse.json({ error: "File data not found" }, { status: 404 });
    }

    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', file.fileType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${file.fileName}"`);
    headers.set('Content-Length', file.fileSize?.toString() || '0');
    headers.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour

    console.log(`📁 Files API - Serving file: ${file.fileName} (${file.fileSize} bytes, ${file.fileType})`);

    // Return the file data as a response
    return new NextResponse(file.fileData, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error("❌ Files API - Error serving file:", error);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
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
