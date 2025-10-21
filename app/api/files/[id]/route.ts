import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { auditLogger } from '@/lib/audit-service';
import { getAuditContext, getCurrentUserForAudit } from '@/lib/audit-context';
import { AuditAction, AuditResource } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ✅ ADD: Get audit context at the start
  const auditContext = await getAuditContext(req);
  const user = await getCurrentUserForAudit();
  
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
      // ✅ ADD: Log unauthorized file download attempt
      await auditLogger.logFailure(
        AuditAction.DOWNLOAD,
        AuditResource.ORDER_FILE,
        undefined,
        undefined,
        `Unauthorized file download attempt for file ${params.id}`,
        'No authenticated user',
        auditContext.ipAddress,
        auditContext.userAgent
      );
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
      // ✅ ADD: Log user not found
      await auditLogger.logFailure(
        AuditAction.DOWNLOAD,
        AuditResource.ORDER_FILE,
        userId,
        undefined,
        `File download failed - user not found in database for file ${params.id}`,
        'User not found',
        auditContext.ipAddress,
        auditContext.userAgent
      );
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
      // ✅ ADD: Log file not found
      await auditLogger.logFailure(
        AuditAction.DOWNLOAD,
        AuditResource.ORDER_FILE,
        user.id,
        user.email!,
        `File download failed - file ${params.id} not found`,
        'File not found',
        auditContext.ipAddress,
        auditContext.userAgent
      );
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
      // ✅ ADD: Log access denied
      await auditLogger.logFailure(
        AuditAction.DOWNLOAD,
        AuditResource.ORDER_FILE,
        user.id,
        user.email!,
        `File download access denied for file ${file.fileName} (${params.id})`,
        'Access denied',
        auditContext.ipAddress,
        auditContext.userAgent
      );
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

    // ✅ ADD: Log successful file download
    await auditLogger.logFileOperation(
      'DOWNLOAD',
      file.id,
      file.fileName,
      file.orderId,
      user.id,
      user.email!,
      user.role,
      file.order.practiceId,
      auditContext.ipAddress,
      auditContext.userAgent
    );

    // Return the file data as a response
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    // ✅ ADD: Log file download error
    await auditLogger.logFailure(
      AuditAction.DOWNLOAD,
      AuditResource.ORDER_FILE,
      user?.id,
      user?.email || undefined,
      `File download failed for file ${params.id}: ${error.message}`,
      error.message,
      auditContext.ipAddress,
      auditContext.userAgent
    );

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
  // ✅ ADD: Get audit context at the start
  const auditContext = await getAuditContext(req);
  const user = await getCurrentUserForAudit();
  
  try {
    // Get the current user's Clerk session
    const { userId } = await auth();
    
    if (!userId) {
      // ✅ ADD: Log unauthorized file delete attempt
      await auditLogger.logFailure(
        AuditAction.DELETE,
        AuditResource.ORDER_FILE,
        undefined,
        undefined,
        `Unauthorized file delete attempt for file ${params.id}`,
        'No authenticated user',
        auditContext.ipAddress,
        auditContext.userAgent
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!dbUser) {
      // ✅ ADD: Log user not found
      await auditLogger.logFailure(
        AuditAction.DELETE,
        AuditResource.ORDER_FILE,
        userId,
        undefined,
        `File delete failed - user not found in database for file ${params.id}`,
        'User not found',
        auditContext.ipAddress,
        auditContext.userAgent
      );
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
      // ✅ ADD: Log file not found
      await auditLogger.logFailure(
        AuditAction.DELETE,
        AuditResource.ORDER_FILE,
        dbUser.id,
        dbUser.email!,
        `File delete failed - file ${params.id} not found`,
        'File not found',
        auditContext.ipAddress,
        auditContext.userAgent
      );
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if user has permission to delete this file
    const canDelete = 
      dbUser.role === 'ADMIN' || // Admin can delete all files
      file.uploadedBy === dbUser.id; // User uploaded the file

    if (!canDelete) {
      // ✅ ADD: Log permission denied
      await auditLogger.logFailure(
        AuditAction.DELETE,
        AuditResource.ORDER_FILE,
        dbUser.id,
        dbUser.email!,
        `File delete permission denied for file ${file.fileName} (${params.id})`,
        'Permission denied',
        auditContext.ipAddress,
        auditContext.userAgent
      );
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Delete the file from database
    await prisma.orderFiles.delete({
      where: { id: params.id }
    });

    // ✅ ADD: Log successful file deletion
    await auditLogger.logFileOperation(
      'DELETE',
      file.id,
      file.fileName,
      file.orderId,
      dbUser.id,
      dbUser.email!,
      dbUser.role,
      file.order.practiceId,
      auditContext.ipAddress,
      auditContext.userAgent
    );

    console.log(`🗑️ Files API - Deleted file: ${file.fileName}`);

    return NextResponse.json({ message: "File deleted successfully" });

  } catch (error: any) {
    // ✅ ADD: Log file deletion error
    await auditLogger.logFailure(
      AuditAction.DELETE,
      AuditResource.ORDER_FILE,
      user?.id,
      user?.email || undefined,
      `File delete failed for file ${params.id}: ${error.message}`,
      error.message,
      auditContext.ipAddress,
      auditContext.userAgent
    );

    console.error("❌ Files API - Error deleting file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
