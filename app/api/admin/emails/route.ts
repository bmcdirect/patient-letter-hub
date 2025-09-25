import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { EmailService } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    // SECURITY FIX: Add authentication check
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user from our database to check their role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // SECURITY FIX: Only admins can access this endpoint
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
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
    const { emailType, recipientEmail, subject, content, orderId, practiceId, userId, email, userName, orderNumber, practiceName, templateType, cost, estimatedRecipients } = await req.json();

          // Handle order lifecycle email types
          if (emailType === "order_confirmation") {
            console.log("📧 Order confirmation email request received:", { orderNumber, practiceName });
            
            if (!orderNumber || !practiceName) {
              console.error("❌ Missing required fields for order confirmation email:", { orderNumber, practiceName });
              return NextResponse.json({ error: "Missing orderNumber or practiceName for order confirmation email" }, { status: 400 });
            }

            try {
              console.log("📧 Attempting to send order confirmation email...");
              const emailService = new EmailService();
              await emailService.sendOrderConfirmationEmail(email, {
                orderNumber,
                practiceName,
                subject,
                templateType,
                cost,
                estimatedRecipients
              });
              console.log("✅ Order confirmation email sent successfully to:", email);

              // Create database record for order confirmation email
              const emailRecord = await prisma.emailNotifications.create({
                data: {
                  userId: user.id,
                  recipientEmail: email,
                  emailType: 'order_confirmation',
                  subject: `Order Confirmation - ${orderNumber} | PatientLetterHub`,
                  content: `Order confirmation email sent for ${orderNumber}`,
                  status: 'sent',
                  metadata: JSON.stringify({
                    sentBy: 'system',
                    sentAt: new Date().toISOString(),
                    orderNumber: orderNumber,
                    practiceName: practiceName
                  })
                }
              });

              return NextResponse.json({ 
                success: true, 
                email: emailRecord,
                message: "Order confirmation email sent successfully"
              });

            } catch (emailError: any) {
              console.error('❌ Failed to send order confirmation email:', {
                error: emailError,
                message: emailError.message,
                stack: emailError.stack,
                email: email,
                orderNumber: orderNumber
              });
              return NextResponse.json({ 
                success: false, 
                error: "Failed to send order confirmation email",
                message: emailError.message || "Order confirmation email delivery failed",
                details: emailError.toString()
              }, { status: 500 });
            }
          }

          // Handle welcome email type
          if (emailType === "welcome") {
      console.log("🎉 Welcome email request received:", { email, userName });
      
      if (!email || !userName) {
        console.error("❌ Missing required fields for welcome email:", { email, userName });
        return NextResponse.json({ error: "Missing email or userName for welcome email" }, { status: 400 });
      }

      try {
        console.log("📧 Attempting to send welcome email...");
        const emailService = new EmailService();
        await emailService.sendWelcomeEmail(email, userName);
        console.log("✅ Welcome email sent successfully to:", email);

        // Find the user who is receiving the welcome email
        const user = await prisma.user.findUnique({
          where: { email: email }
        });

        if (!user) {
          console.error('❌ User not found for welcome email:', email);
          return NextResponse.json({ 
            success: false, 
            error: "User not found for welcome email",
            message: "Cannot create email notification record"
          }, { status: 404 });
        }

        // Create database record for welcome email
        const emailRecord = await prisma.emailNotifications.create({
          data: {
            userId: user.id,
            recipientEmail: email,
            emailType: 'welcome',
            subject: 'Welcome to PatientLetterHub - Your HIPAA-Compliant Letter Solution!',
            content: `Welcome email sent to ${userName} (${email})`,
            status: 'sent',
            metadata: JSON.stringify({
              sentBy: 'system',
              sentAt: new Date().toISOString(),
              userName: userName
            })
          }
        });

        return NextResponse.json({ 
          success: true, 
          email: emailRecord,
          message: "Welcome email sent successfully"
        });

      } catch (emailError: any) {
        console.error('❌ Failed to send welcome email:', {
          error: emailError,
          message: emailError.message,
          stack: emailError.stack,
          email: email,
          userName: userName
        });
        return NextResponse.json({ 
          success: false, 
          error: "Failed to send welcome email",
          message: emailError.message || "Welcome email delivery failed",
          details: emailError.toString()
        }, { status: 500 });
      }
    }

    // Handle other email types
    if (!emailType || !recipientEmail || !subject || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create database record first
    const emailRecord = await prisma.emailNotifications.create({
      data: {
        orderId: orderId || null,
        userId: userId || 'admin',
        practiceId: practiceId || null,
        recipientEmail,
        emailType,
        subject,
        content,
        status: 'pending', // Start as pending
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

    // Actually send the email using EmailService
    try {
      const emailService = new EmailService();
      await emailService.sendCustomEmail(recipientEmail, subject, content);

      // Update database record to reflect successful delivery
      const updatedEmail = await prisma.emailNotifications.update({
        where: { id: emailRecord.id },
        data: {
          status: 'sent',
          metadata: JSON.stringify({
            sentBy: 'admin',
            sentAt: new Date().toISOString(),
            resendId: 'success' // Could store actual Resend ID if needed
          })
        }
      });

      return NextResponse.json({ 
        success: true, 
        email: updatedEmail,
        message: "Email sent successfully"
      });

    } catch (emailError: any) {
      console.error('Failed to send email:', emailError);

      // Update database record to reflect failure
      const failedEmail = await prisma.emailNotifications.update({
        where: { id: emailRecord.id },
        data: {
          status: 'failed',
          errorMessage: emailError.message || 'Unknown error',
          metadata: JSON.stringify({
            sentBy: 'admin',
            attemptedAt: new Date().toISOString(),
            error: emailError.message
          })
        }
      });

      return NextResponse.json({ 
        success: false, 
        email: failedEmail,
        error: "Failed to send email",
        message: emailError.message || "Email delivery failed"
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to create email:', error);
    return NextResponse.json({ error: "Failed to create email" }, { status: 500 });
  }
} 