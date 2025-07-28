import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
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
    const { emailType, recipientEmail, subject, content, orderId, practiceId, userId } = await req.json();

    if (!emailType || !recipientEmail || !subject || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const email = await prisma.emailNotifications.create({
      data: {
        orderId: orderId || null,
        userId: userId || 'admin',
        practiceId: practiceId || null,
        recipientEmail,
        emailType,
        subject,
        content,
        status: 'sent',
        metadata: JSON.stringify({
          sentBy: 'admin',
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