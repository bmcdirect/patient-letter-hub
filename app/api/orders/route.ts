import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { parse as parseCSV } from 'csv-parse/sync';

export async function GET(req: NextRequest) {
  try {
    // Get the current user's Clerk session
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database to check their role and practice
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { practice: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('🔍 Orders API - Current user:', {
      id: user.id,
      email: user.email,
      role: user.role,
      practiceId: user.practiceId,
      practiceName: user.practice?.name
    });

    let orders;
    
    if (user.role === 'ADMIN') {
      // Admin sees all orders
      orders = await prisma.orders.findMany({
        include: {
          practice: true,
          user: true,
          files: true,
          approvals: true,
          invoices: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      console.log('🔍 Orders API - Admin user, returning all orders:', orders.length);
    } else {
      // Regular user only sees orders from their practice
      if (user.practiceId) {
        orders = await prisma.orders.findMany({
          where: { practiceId: user.practiceId },
          include: {
            practice: true,
            user: true,
            files: true,
            approvals: true,
            invoices: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        console.log('🔍 Orders API - Regular user, returning practice orders:', orders.length);
      } else {
        orders = [];
        console.log('🔍 Orders API - User has no practice, returning empty');
      }
    }

    // Debug logging
    console.log('🔍 Orders API - Found orders:', {
      count: orders.length,
      orderIds: orders.map(o => ({ id: o.id, orderNumber: o.orderNumber, status: o.status }))
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    // Parse FormData instead of JSON
    const formData = await req.formData();
    
    // Extract form fields
    const practiceId = formData.get('practiceId') as string;
    const subject = formData.get('subject') as string;
    const totalCost = parseFloat(formData.get('totalCost') as string) || 0;
    const status = formData.get('status') as string || 'pending';
    const colorMode = formData.get('colorMode') as string;
    const dataCleansing = formData.get('dataCleansing') === 'true';
    const ncoaUpdate = formData.get('ncoaUpdate') === 'true';
    const firstClassPostage = formData.get('firstClassPostage') === 'true';
    const notes = formData.get('notes') as string;
    const preferredMailDate = formData.get('preferredMailDate') as string;
    const fromQuoteId = formData.get('fromQuoteId') as string;

    console.log('🔍 Orders API - Creating order with data:', {
      practiceId,
      subject,
      totalCost,
      status,
      colorMode,
      dataCleansing,
      ncoaUpdate,
      firstClassPostage,
      fromQuoteId
    });

    // Validate required fields
    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 });
    }

    // Create the order
    const order = await prisma.orders.create({
      data: {
        orderNumber: `O-${Date.now()}`,
        practiceId,
        userId: user.id,
        status,
        subject: subject || undefined,
        cost: totalCost,
        colorMode: colorMode || undefined,
        preferredMailDate: preferredMailDate ? new Date(preferredMailDate) : undefined,
        // Add any additional fields that might be needed
      },
    });

    console.log('✅ Orders API - Created order:', {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status
    });

    // Handle file uploads if any
    const files = formData.getAll('file') as File[];
    if (files.length > 0) {
      console.log(`📁 Orders API - Processing ${files.length} uploaded files`);
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), "uploads", order.id);
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
              orderId: order.id,
              fileName: fileName,
              filePath: filePath,
              fileType: file.type,
              uploadedBy: user.id,
            },
            include: { uploader: true }
          });
          uploadedFiles.push(savedFile);
          console.log(`✅ Orders API - Saved file: ${fileName} for order ${order.id}`);

          // If this is a CSV, parse and count records
          if (originalName.toLowerCase().endsWith('.csv')) {
            try {
              const csvText = buffer.toString('utf-8');
              const records = parseCSV(csvText, { columns: true });
              newRecipientCount = records.length;
              console.log(`📊 Orders API - CSV parsed: ${newRecipientCount} recipients`);
            } catch (err) {
              console.error('❌ Orders API - Failed to parse CSV for recipient count:', err);
            }
          }
        }
      }

      // If we found a new recipient count, update the order
      if (newRecipientCount && newRecipientCount > 0) {
        await prisma.orders.update({
          where: { id: order.id },
          data: {
            actualRecipients: newRecipientCount,
          },
        });
        console.log(`✅ Orders API - Updated order with ${newRecipientCount} recipients`);
      }

      console.log(`✅ Orders API - Successfully processed ${uploadedFiles.length} files`);
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("❌ Orders API - Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}