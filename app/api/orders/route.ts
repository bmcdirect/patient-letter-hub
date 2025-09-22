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
    
    // Extract form fields - only use fields that exist in the current Orders model
    const practiceId = formData.get('practiceId') as string;
    const subject = formData.get('subject') as string;
    const totalCost = parseFloat(formData.get('totalCost') as string) || 0;
    const status = formData.get('status') as string || 'pending';
    const colorMode = formData.get('colorMode') as string;
    const preferredMailDateRaw = formData.get('preferredMailDate') as string;
    const fromQuoteId = formData.get('fromQuoteId') as string;
    
    // Sanitize and validate the preferredMailDate
    let preferredMailDate: Date | undefined;
    if (preferredMailDateRaw && preferredMailDateRaw.trim()) {
      try {
        // Remove any invalid characters and try to parse
        const cleanDate = preferredMailDateRaw.replace(/[^\d\-]/g, '');
        if (cleanDate && cleanDate.length >= 10) {
          const parsedDate = new Date(cleanDate);
          if (!isNaN(parsedDate.getTime())) {
            preferredMailDate = parsedDate;
            console.log('✅ Orders API - Valid date parsed:', preferredMailDate);
          } else {
            console.log('⚠️ Orders API - Invalid date format, ignoring:', preferredMailDateRaw);
          }
        }
      } catch (dateError) {
        console.log('⚠️ Orders API - Date parsing error, ignoring:', preferredMailDateRaw, dateError);
      }
    }
    
    // Log fields that are not supported in the current Orders model
    const dataCleansing = formData.get('dataCleansing') === 'true';
    const ncoaUpdate = formData.get('ncoaUpdate') === 'true';
    const firstClassPostage = formData.get('firstClassPostage') === 'true';
    const notes = formData.get('notes') as string;
    const purchaseOrder = formData.get('purchaseOrder') as string;
    const costCenter = formData.get('costCenter') as string;
    const actualRecipients = parseInt(formData.get('actualRecipients') as string) || 0;

    console.log('🔍 Orders API - Creating order with data:', {
      practiceId,
      subject,
      totalCost,
      status,
      colorMode,
      preferredMailDate,
      fromQuoteId
    });
    
    // Log fields that are not supported in the current Orders model
    console.log('⚠️ Orders API - Ignoring unsupported fields:', {
      dataCleansing,
      ncoaUpdate,
      firstClassPostage,
      notes,
      purchaseOrder,
      costCenter,
      actualRecipients
    });

    // Validate required fields
    if (!practiceId || practiceId.trim() === '') {
      console.log('❌ Orders API - Practice ID validation failed:', { practiceId, isEmpty: !practiceId, isBlank: practiceId?.trim() === '' });
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 });
    }

    // Create the order with only supported fields
    const orderData = {
      orderNumber: `O-${Date.now()}`,
      practiceId,
      userId: user.id,
      status,
      subject: subject || undefined,
      cost: totalCost,
      colorMode: colorMode || undefined,
      preferredMailDate: preferredMailDate || undefined,
    };
    
    console.log('🔍 Orders API - Final order data for creation:', orderData);
    
    let order;
    try {
      order = await prisma.orders.create({
        data: orderData,
      });
      console.log('✅ Orders API - Order created successfully:', order.id);
    } catch (dbError) {
      console.error('❌ Orders API - Database error creating order:', dbError);
      return NextResponse.json({ error: "Failed to create order in database" }, { status: 500 });
    }

    console.log('✅ Orders API - Created order:', {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status
    });

    // Handle quote conversion if fromQuoteId is provided
    if (fromQuoteId) {
      try {
        console.log('🔍 Orders API - Converting quote to order:', fromQuoteId);
        
        // Find and update the quote status
        const quote = await prisma.quotes.findUnique({ where: { id: fromQuoteId } });
        if (quote) {
          if (quote.status === 'converted') {
            console.log('⚠️ Orders API - Quote already converted, skipping status update');
          } else {
            await prisma.quotes.update({
              where: { id: fromQuoteId },
              data: { status: 'converted' },
            });
            console.log('✅ Orders API - Quote status updated to converted');
          }
        } else {
          console.log('⚠️ Orders API - Quote not found for conversion:', fromQuoteId);
        }
      } catch (quoteError) {
        console.error('❌ Orders API - Error converting quote:', quoteError);
        // Don't fail the order creation if quote conversion fails
      }
    }

    // Handle file uploads if any
    const files = formData.getAll('file') as File[];
    console.log(`📁 Orders API - Files received:`, {
      count: files.length,
      fileNames: files.map(f => f.name),
      fileSizes: files.map(f => f.size),
      fileTypes: files.map(f => f.type)
    });
    
    if (files.length > 0) {
      console.log(`📁 Orders API - Processing ${files.length} uploaded files`);
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), "uploads", order.id);
      console.log(`📁 Orders API - Creating uploads directory:`, uploadsDir);
      
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
        console.log(`✅ Orders API - Created uploads directory`);
      }

      const uploadedFiles = [];
      let newRecipientCount: number | null = null;

      // Save each file
      for (const file of files) {
        try {
          console.log(`📁 Orders API - Processing file: ${file.name} (${file.size} bytes, ${file.type})`);
          
          if (file.size > 0) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const timestamp = Date.now();
            const originalName = file.name;
            const fileName = `${timestamp}_${originalName}`;
            const filePath = join(uploadsDir, fileName);
            
            console.log(`📁 Orders API - Writing file to: ${filePath}`);
            await writeFile(filePath, buffer);
            console.log(`✅ Orders API - File written successfully`);

            // Save file record to database
            console.log(`📁 Orders API - Creating database record for file`);
            const savedFile = await prisma.orderFiles.create({
              data: {
                orderId: order.id,
                fileName: fileName,
                filePath: filePath,
                fileType: file.type,
                uploadedBy: user.id,
              }
            });
            uploadedFiles.push(savedFile);
            console.log(`✅ Orders API - Saved file: ${fileName} for order ${order.id}`);

            // If this is a CSV, parse and count records
            if (originalName.toLowerCase().endsWith('.csv')) {
              try {
                console.log(`📊 Orders API - Parsing CSV file for recipient count`);
                const csvText = buffer.toString('utf-8');
                const records = parseCSV(csvText, { columns: true });
                newRecipientCount = records.length;
                console.log(`📊 Orders API - CSV parsed: ${newRecipientCount} recipients`);
              } catch (err) {
                console.error('❌ Orders API - Failed to parse CSV for recipient count:', err);
              }
            }
          } else {
            console.log(`⚠️ Orders API - Skipping empty file: ${file.name}`);
          }
        } catch (fileError) {
          console.error(`❌ Orders API - Error processing file ${file.name}:`, fileError);
        }
      }

      // Note: actualRecipients field doesn't exist in current Orders model
      // CSV parsing succeeded, but we can't store recipient count in the order
      if (newRecipientCount && newRecipientCount > 0) {
        console.log(`📊 Orders API - CSV parsed successfully with ${newRecipientCount} recipients`);
        console.log(`⚠️ Orders API - Cannot store recipient count - actualRecipients field not in schema`);
      }

      console.log(`✅ Orders API - Successfully processed ${uploadedFiles.length} files`);
      console.log(`📁 Orders API - File processing complete. Files saved:`, uploadedFiles.map(f => f.fileName));
    } else {
      console.log(`📁 Orders API - No files to process`);
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("❌ Orders API - Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}