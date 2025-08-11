import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orders = await prisma.orders.findMany({
      where: {
        userId: user.id,
      },
      include: {
        practice: true,
        files: true,
        approvals: true,
        invoices: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Return in the format expected by the frontend
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { 
      subject, 
      cost, 
      practiceId, 
      customerNumber, 
      purchaseOrder, 
      costCenter, 
      actualRecipients, 
      preferredMailDate, 
      colorMode, 
      dataCleansing, 
      ncoaUpdate, 
      firstClassPostage, 
      autoDeleteDataFile, 
      notes, 
      totalCost, 
      status 
    } = body;

    // Validate required fields
    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 });
    }

    if (!actualRecipients || actualRecipients <= 0) {
      return NextResponse.json({ error: "Number of recipients is required and must be greater than 0" }, { status: 400 });
    }

    if (!preferredMailDate) {
      return NextResponse.json({ error: "Preferred mail date is required" }, { status: 400 });
    }

    const order = await prisma.orders.create({
      data: {
        orderNumber: `O-${Date.now()}`,
        subject: subject || null,
        cost: totalCost || cost || 0,
        status: status || "pending",
        userId: user.id,
        practiceId: practiceId,
        customerNumber: customerNumber || null,
        purchaseOrder: purchaseOrder || null,
        costCenter: costCenter || null,
        actualRecipients: actualRecipients,
        preferredMailDate: new Date(preferredMailDate),
        colorMode: colorMode || "color",
        dataCleansing: dataCleansing || false,
        ncoaUpdate: ncoaUpdate || false,
        firstClassPostage: firstClassPostage || false,
        autoDeleteDataFile: autoDeleteDataFile !== undefined ? autoDeleteDataFile : true,
        notes: notes || null,
        totalCost: totalCost || cost || 0,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}