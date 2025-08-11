import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

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

    // Only allow admins to access this endpoint
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status');
    const emailType = searchParams.get('emailType');

    const where: any = {};
    if (status) where.status = status;
    if (emailType) where.emailType = emailType;

    const emails = await prisma.emailNotifications.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            subject: true,
            status: true
          }
        },
        practice: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(emails);
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    return NextResponse.json({ error: "Failed to fetch emails" }, { status: 500 });
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

    // Only allow admins to access this endpoint
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { emailType, recipientEmail, subject, content, orderId, practiceId } = await req.json();

    if (!emailType || !recipientEmail || !subject || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const email = await prisma.emailNotifications.create({
      data: {
        orderId: orderId || null,
        userId: user.id, // Use the authenticated admin user's ID
        practiceId: practiceId || null,
        recipientEmail,
        emailType,
        subject,
        content,
        status: 'sent',
        metadata: JSON.stringify({
          sentBy: user.id,
          sentAt: new Date().toISOString()
        })
      },
      include: {
        order: true,
        practice: true,
        user: true
      }
    });

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('Failed to create email:', error);
    return NextResponse.json({ error: "Failed to create email" }, { status: 500 });
  }
} 