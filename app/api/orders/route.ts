import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
// File handling imports removed for Vercel serverless compatibility
// import { writeFile, mkdir } from "fs/promises";
// import { join } from "path";
// import { existsSync } from "fs";
// import { parse as parseCSV } from 'csv-parse/sync';

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
    
    // Debug: Log all form data keys
    console.log('🔍 Orders API - Form data keys:', Array.from(formData.keys()));
    
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
    
    // Extract additional order fields
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
      fromQuoteId,
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

    // Validate that the practice exists
    try {
      const practice = await prisma.practice.findUnique({
        where: { id: practiceId }
      });
      if (!practice) {
        console.log('❌ Orders API - Practice not found:', practiceId);
        return NextResponse.json({ error: "Practice not found" }, { status: 400 });
      }
      console.log('✅ Orders API - Practice validated:', practice.name);
    } catch (practiceError) {
      console.error('❌ Orders API - Error validating practice:', practiceError);
      return NextResponse.json({ error: "Failed to validate practice" }, { status: 500 });
    }

    // Create the order with all supported fields
    const orderData = {
      orderNumber: `O-${Date.now()}`,
      practiceId,
      userId: user.id,
      status,
      subject: subject || undefined,
      cost: totalCost,
      colorMode: colorMode || undefined,
      preferredMailDate: preferredMailDate || undefined,
      purchaseOrder: purchaseOrder || undefined,
      costCenter: costCenter || undefined,
      actualRecipients: actualRecipients || undefined,
      dataCleansing: dataCleansing || false,
      ncoaUpdate: ncoaUpdate || false,
      firstClassPostage: firstClassPostage || false,
      notes: notes || undefined,
    };
    
    console.log('🔍 Orders API - Final order data for creation:', orderData);
    
    let order;
    try {
      console.log('🔍 Orders API - Attempting to create order with data:', JSON.stringify(orderData, null, 2));
      order = await prisma.orders.create({
        data: orderData,
      });
      console.log('✅ Orders API - Order created successfully:', order.id);
    } catch (dbError) {
      console.error('❌ Orders API - Database error creating order:', {
        error: dbError,
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : undefined,
        orderData: JSON.stringify(orderData, null, 2)
      });
      return NextResponse.json({ 
        error: "Failed to create order in database", 
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
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

    // Handle file uploads - store in database using BYTEA
    const files = formData.getAll('file') as File[];
    console.log(`📁 Orders API - Files received:`, {
      count: files.length,
      fileNames: files.map(f => f.name),
      fileSizes: files.map(f => f.size),
      fileTypes: files.map(f => f.type)
    });
    
    if (files.length > 0) {
      console.log(`📁 Orders API - Processing ${files.length} files for database storage`);
      
      try {
        // Process each file and store in database
        for (const file of files) {
          if (file.size === 0) {
            console.log(`⚠️ Orders API - Skipping empty file: ${file.name}`);
            continue;
          }
          
          // Convert file to buffer for BYTEA storage
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          
          // Store file in database
          await prisma.orderFiles.create({
            data: {
              orderId: order.id,
              fileName: file.name,
              fileType: file.type || 'application/octet-stream',
              fileSize: file.size,
              fileData: fileBuffer,
              uploadedBy: user.id,
            }
          });
          
          console.log(`✅ Orders API - File stored in database: ${file.name} (${file.size} bytes)`);
        }
        
        console.log(`✅ Orders API - All files processed and stored in database`);
      } catch (fileError) {
        console.error('❌ Orders API - Error storing files in database:', fileError);
        // Don't fail the order creation if file storage fails
        console.log('⚠️ Orders API - Order created successfully, but file storage failed');
      }
    } else {
      console.log(`📁 Orders API - No files to process`);
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("❌ Orders API - Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}