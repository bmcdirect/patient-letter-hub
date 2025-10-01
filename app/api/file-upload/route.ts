import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session-manager";
import { auditLogger } from '@/lib/audit-service';
import { getAuditContext, getCurrentUserForAudit } from '@/lib/audit-context';
import { AuditAction, AuditResource } from '@prisma/client';

export async function POST(req: NextRequest) {
  // ✅ ADD: Get audit context at the start
  const auditContext = await getAuditContext(req);
  const user = await getCurrentUserForAudit();
  
  // ✅ ADD: Check authentication and log unauthorized attempts
  if (!user) {
    await auditLogger.logFailure(
      AuditAction.UPLOAD,
      AuditResource.ORDER_FILE,
      undefined,
      undefined,
      'Unauthorized file upload attempt',
      'No authenticated user',
      auditContext.ipAddress,
      auditContext.userAgent
    );
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const orderId = formData.get("orderId") as string;
    const fileType = formData.get("fileType") as string || "customer_data";

    if (!file || !orderId) {
      // ✅ ADD: Log validation failure
      await auditLogger.logFailure(
        AuditAction.UPLOAD,
        AuditResource.ORDER_FILE,
        user.id,
        user.email!,
        `File upload validation failed: ${!file ? 'Missing file' : 'Missing orderId'}`,
        'Missing required fields',
        auditContext.ipAddress,
        auditContext.userAgent
      );
      return NextResponse.json({ error: "File and orderId are required" }, { status: 400 });
    }

    // Convert file to buffer for database storage
    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);

    // Save file metadata and binary data to database
    const savedFile = await prisma.orderFiles.create({
      data: {
        orderId: orderId,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileData: fileBuffer, // Store binary data in BYTEA column
        uploadedBy: user.id, // Use the authenticated user's ID
      },
    });

    // ✅ ADD: Audit log AFTER successful upload
    await auditLogger.logFileOperation(
      'UPLOAD',
      savedFile.id,
      file.name,
      orderId,
      user.id,
      user.email!,
      user.role,
      user.practiceId!,
      auditContext.ipAddress,
      auditContext.userAgent
    );

    console.log(`✅ File uploaded to database: ${file.name} (${file.size} bytes) for order ${orderId}`);

    return NextResponse.json({ 
      success: true, 
      file: savedFile,
      message: 'File uploaded successfully!'
    });

  } catch (error: any) {
    // ✅ ADD: Audit log for failed upload
    await auditLogger.logFailure(
      AuditAction.UPLOAD,
      AuditResource.ORDER_FILE,
      user?.id,
      user?.email || undefined,
      `Failed to upload file: ${error.message}`,
      error.message,
      auditContext.ipAddress,
      auditContext.userAgent
    );

    console.error("File upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
} 