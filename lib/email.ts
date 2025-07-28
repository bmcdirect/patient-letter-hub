import { prisma } from "@/lib/db";

export interface EmailTemplate {
  subject: string;
  content: string;
}

export interface EmailContext {
  order?: any;
  practice?: any;
  user?: any;
  invoice?: any;
  customerEmail?: string;
  actionUrl?: string;
  [key: string]: any;
}

export class EmailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }

  // Get email template based on type and context
  private getEmailTemplate(emailType: string, context: EmailContext): EmailTemplate {
    const { order, practice, user, invoice, actionUrl } = context;

    switch (emailType) {
      case 'order_status_change':
        return {
          subject: `Order ${order?.orderNumber} Status Update`,
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Order Status Update</h2>
              <p>Dear ${practice?.name || user?.name || 'Valued Customer'},</p>
              <p>Your order <strong>${order?.orderNumber}</strong> has been updated to status: <strong>${order?.status}</strong></p>
              <p><strong>Order Details:</strong></p>
              <ul>
                <li>Subject: ${order?.subject}</li>
                <li>Template: ${order?.templateType}</li>
                <li>Cost: $${order?.cost?.toFixed(2) || '0.00'}</li>
              </ul>
              <p>You can track your order progress in your dashboard.</p>
              <p>Best regards,<br>PatientLetterHub Team</p>
            </div>
          `
        };

      case 'proof_ready':
        return {
          subject: `Proof Ready for Review - Order ${order?.orderNumber}`,
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Design Proof Ready for Review</h2>
              <p>Dear ${practice?.name || user?.name || 'Valued Customer'},</p>
              <p>Your design proof for order <strong>${order?.orderNumber}</strong> is ready for review.</p>
              <p><strong>Order Details:</strong></p>
              <ul>
                <li>Subject: ${order?.subject}</li>
                <li>Template: ${order?.templateType}</li>
                <li>Color Mode: ${order?.colorMode}</li>
              </ul>
              <p><a href="${actionUrl || `${this.baseUrl}/orders/${order?.id}/proof-review`}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Review Proof</a></p>
              <p>Please review the proof and let us know if any changes are needed.</p>
              <p>Best regards,<br>PatientLetterHub Design Team</p>
            </div>
          `
        };

      case 'invoice_generated':
        return {
          subject: `Invoice Generated - Order ${order?.orderNumber}`,
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Invoice Generated</h2>
              <p>Dear ${practice?.name || user?.name || 'Valued Customer'},</p>
              <p>An invoice has been generated for your completed order <strong>${order?.orderNumber}</strong>.</p>
              <p><strong>Invoice Details:</strong></p>
              <ul>
                <li>Invoice Number: ${invoice?.invoiceNumber}</li>
                <li>Amount: $${invoice?.totalAmount}</li>
                <li>Due Date: ${invoice?.dueDate}</li>
              </ul>
              <p>Please review and process payment at your earliest convenience.</p>
              <p>Best regards,<br>PatientLetterHub Billing Team</p>
            </div>
          `
        };

      case 'order_completed':
        return {
          subject: `Order Completed - ${order?.orderNumber}`,
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Order Completed</h2>
              <p>Dear ${practice?.name || user?.name || 'Valued Customer'},</p>
              <p>Your order <strong>${order?.orderNumber}</strong> has been completed successfully!</p>
              <p><strong>Order Details:</strong></p>
              <ul>
                <li>Subject: ${order?.subject}</li>
                <li>Template: ${order?.templateType}</li>
                <li>Total Cost: $${order?.cost?.toFixed(2) || '0.00'}</li>
              </ul>
              <p>Your materials will be shipped to your practice address. You will receive tracking information once shipped.</p>
              <p>Thank you for choosing PatientLetterHub!</p>
              <p>Best regards,<br>PatientLetterHub Team</p>
            </div>
          `
        };

      case 'custom':
        return {
          subject: context.subject || 'Message from PatientLetterHub',
          content: context.content || 'No content provided'
        };

      default:
        return {
          subject: 'Message from PatientLetterHub',
          content: 'Thank you for your business.'
        };
    }
  }

  // Store email in database (simulates sending)
  async sendEmail(
    emailType: string,
    recipientEmail: string,
    context: EmailContext
  ): Promise<boolean> {
    try {
      const template = this.getEmailTemplate(emailType, context);
      
      // Store email in database instead of sending
      await prisma.emailNotifications.create({
        data: {
          orderId: context.order?.id || null,
          userId: context.user?.id || context.order?.userId || 'system',
          practiceId: context.practice?.id || context.order?.practiceId || null,
          recipientEmail,
          emailType,
          subject: template.subject,
          content: template.content,
          status: 'sent', // In development, we mark as sent
          metadata: JSON.stringify({
            context,
            simulated: true,
            sentAt: new Date().toISOString()
          })
        }
      });

      console.log(`📧 Email stored in database: ${emailType} to ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('Email storage failed:', error);
      
      // Store failed email attempt
      try {
        await prisma.emailNotifications.create({
          data: {
            orderId: context.order?.id || null,
            userId: context.user?.id || context.order?.userId || 'system',
            practiceId: context.practice?.id || context.order?.practiceId || null,
            recipientEmail,
            emailType,
            subject: 'Email Failed',
            content: 'Email delivery failed',
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            metadata: JSON.stringify({ context, error: true })
          }
        });
      } catch (dbError) {
        console.error('Failed to store email error:', dbError);
      }
      
      return false;
    }
  }

  // Trigger email for order status changes
  async triggerOrderStatusEmail(orderId: string, newStatus: string): Promise<void> {
    try {
      const order = await prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          practice: true,
          user: true
        }
      });

      if (!order) return;

      const recipientEmail = order.practice?.email || order.user?.email;
      if (!recipientEmail) return;

      const context: EmailContext = {
        order,
        practice: order.practice,
        user: order.user,
        customerEmail: recipientEmail
      };

      await this.sendEmail('order_status_change', recipientEmail, context);
    } catch (error) {
      console.error('Order status email error:', error);
    }
  }

  // Trigger email for proof ready notification
  async triggerProofReadyEmail(orderId: string, proofUrl?: string): Promise<void> {
    try {
      const order = await prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          practice: true,
          user: true
        }
      });

      if (!order) return;

      const recipientEmail = order.practice?.email || order.user?.email;
      if (!recipientEmail) return;

      const context: EmailContext = {
        order,
        practice: order.practice,
        user: order.user,
        customerEmail: recipientEmail,
        actionUrl: proofUrl || `${this.baseUrl}/orders/${orderId}/proof-review`
      };

      await this.sendEmail('proof_ready', recipientEmail, context);
    } catch (error) {
      console.error('Proof ready email error:', error);
    }
  }

  // Trigger email for invoice generation
  async triggerInvoiceEmail(invoiceId: string): Promise<void> {
    try {
      const invoice = await prisma.invoices.findUnique({
        where: { id: invoiceId },
        include: {
          order: {
            include: {
              practice: true,
              user: true
            }
          }
        }
      });

      if (!invoice || !invoice.order) return;

      const recipientEmail = invoice.order.practice?.email || invoice.order.user?.email;
      if (!recipientEmail) return;

      const context: EmailContext = {
        order: invoice.order,
        invoice,
        practice: invoice.order.practice,
        user: invoice.order.user,
        customerEmail: recipientEmail
      };

      await this.sendEmail('invoice_generated', recipientEmail, context);
    } catch (error) {
      console.error('Invoice email error:', error);
    }
  }

  // Trigger email for order completion
  async triggerOrderCompletedEmail(orderId: string): Promise<void> {
    try {
      const order = await prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          practice: true,
          user: true
        }
      });

      if (!order) return;

      const recipientEmail = order.practice?.email || order.user?.email;
      if (!recipientEmail) return;

      const context: EmailContext = {
        order,
        practice: order.practice,
        user: order.user,
        customerEmail: recipientEmail
      };

      await this.sendEmail('order_completed', recipientEmail, context);
    } catch (error) {
      console.error('Order completed email error:', error);
    }
  }

  // Get email history for a user
  async getUserEmailHistory(userId: string, limit: number = 50) {
    return await prisma.emailNotifications.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        order: true,
        practice: true
      }
    });
  }

  // Get all email notifications (admin view)
  async getAllEmailHistory(limit: number = 100) {
    return await prisma.emailNotifications.findMany({
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        order: true,
        practice: true,
        user: true
      }
    });
  }

  // Get email statistics
  async getEmailStats() {
    const [total, sent, failed, pending] = await Promise.all([
      prisma.emailNotifications.count(),
      prisma.emailNotifications.count({ where: { status: 'sent' } }),
      prisma.emailNotifications.count({ where: { status: 'failed' } }),
      prisma.emailNotifications.count({ where: { status: 'pending' } })
    ]);

    return {
      total,
      sent,
      failed,
      pending,
      successRate: total > 0 ? ((sent / total) * 100).toFixed(1) : '0'
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
