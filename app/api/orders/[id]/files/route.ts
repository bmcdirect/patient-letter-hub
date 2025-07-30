import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
// import { auth } from "@/auth"; // Temporarily commented out
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { parse as parseCSV } from 'csv-parse/sync';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Temporarily bypass auth for development
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    
    // Mock user for development
    const mockUser = { id: "1", role: "USER" as const };

    const orderId = params.id;

    // Get the order to check permissions
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user has permission to view this order
    if (order.userId !== mockUser.id && mockUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get files for this order
    const files = await prisma.orderFiles.findMany({
      where: { orderId },
      include: { uploader: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ files });
  } catch (err) {
    console.error("Error fetching files:", err);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Temporarily bypass auth for development
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    
    // Mock user for development
    const mockUser = { id: "1", role: "USER" as const };

    const orderId = params.id;

    // Get the order to check permissions
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user has permission to upload files to this order
    if (order.userId !== mockUser.id && mockUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const files = formData.getAll("file") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads", orderId);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uploadedFiles = [];
    let newRecipientCount: number | null = null;

    // Save each file
    for (const file of files) {
      if (file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const timestamp = Date.now();
        const originalName = file.name;
        const fileName = `${timestamp}_${originalName}`;
        const filePath = join(uploadsDir, fileName);
        await writeFile(filePath, buffer);

        // Save file record to database
        const savedFile = await prisma.orderFiles.create({
          data: {
            orderId: orderId,
            fileName: fileName,
            filePath: filePath,
            fileType: file.type,
            uploadedBy: mockUser.id,
          },
          include: { uploader: true }
        });
        uploadedFiles.push(savedFile);
        console.log(`Saved additional file: ${fileName} for order ${orderId}`);

        // If this is a CSV, parse and count records
        if (originalName.toLowerCase().endsWith('.csv')) {
          try {
            const csvText = buffer.toString('utf-8');
            const records = parseCSV(csvText, { columns: true });
            newRecipientCount = records.length;
          } catch (err) {
            console.error('Failed to parse CSV for recipient count:', err);
          }
        }
        // (Excel support can be added here if needed)
      }
    }

    // If we found a new recipient count, update the order and recalculate cost
    let updatedOrder = null;
    if (newRecipientCount && newRecipientCount > 0) {
      // Simple cost calculation (replace with your real logic)
      const baseCostPer = order.colorMode === 'color' ? 0.65 : 0.5;
      const totalCost = newRecipientCount * baseCostPer;
      updatedOrder = await prisma.orders.update({
        where: { id: orderId },
        data: {
          actualRecipients: newRecipientCount,
          cost: totalCost,
        },
      });
    }

    return NextResponse.json({ 
      message: `Successfully uploaded ${uploadedFiles.length} file(s)` + (newRecipientCount ? `, updated recipient count to ${newRecipientCount}` : ''),
      files: uploadedFiles,
      updatedOrder
    });
  } catch (err) {
    console.error("Error uploading files:", err);
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Temporarily bypass auth for development
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    
    // Mock user for development
    const mockUser = { id: "1", role: "USER" as const };

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    // Get the file to check permissions
    const file = await prisma.orderFiles.findUnique({
      where: { id: fileId },
      include: { order: true }
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if user has permission to delete this file
    if (file.uploadedBy !== mockUser.id && mockUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the file from database
    await prisma.orderFiles.delete({
      where: { id: fileId }
    });

    // TODO: Delete the actual file from disk
    // For now, just delete from database

    return NextResponse.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Error deleting file:", err);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
} 