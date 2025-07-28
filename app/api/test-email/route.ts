import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/email";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { testType } = await req.json();

    switch (testType) {
      case 'order_status_change':
        // Test order status change email
        await emailService.sendEmail('order_status_change', 'test@example.com', {
          order: {
            id: 'test-order-1',
            orderNumber: 'O-2025-0001',
            status: 'in-progress',
            subject: 'Test Order',
            templateType: 'Standard Letter',
            cost: 150.00
          },
          practice: {
            name: 'Test Practice',
            email: 'test@example.com'
          },
          user: {
            name: 'Test User',
            email: 'test@example.com'
          }
        });
        break;

      case 'proof_ready':
        // Test proof ready email
        await emailService.sendEmail('proof_ready', 'test@example.com', {
          order: {
            id: 'test-order-1',
            orderNumber: 'O-2025-0001',
            subject: 'Test Order',
            templateType: 'Standard Letter',
            colorMode: 'Color'
          },
          practice: {
            name: 'Test Practice',
            email: 'test@example.com'
          },
          user: {
            name: 'Test User',
            email: 'test@example.com'
          },
          actionUrl: 'http://localhost:3000/orders/test-order-1/proof-review'
        });
        break;

      case 'custom':
        // Test custom email
        await emailService.sendEmail('custom', 'test@example.com', {
          subject: 'Test Custom Email',
          content: 'This is a test custom email from the admin dashboard.'
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid test type" }, { status: 400 });
    }

    // Get email stats to verify
    const stats = await emailService.getEmailStats();
    const recentEmails = await emailService.getAllEmailHistory(5);

    return NextResponse.json({
      success: true,
      message: `Test email of type '${testType}' sent successfully`,
      stats,
      recentEmails
    });

  } catch (error) {
    console.error('Test email failed:', error);
    return NextResponse.json({ error: "Test email failed" }, { status: 500 });
  }
} 