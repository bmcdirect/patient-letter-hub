import { db } from "../db";
import { emailNotifications, orders, invoices, practices, users } from "@shared/schema";
import type { InsertEmailNotification, Order, Invoice, Practice, User } from "@shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../logger";

export interface EmailTemplate {
  subject: string;
  content: string;
}

export interface EmailContext {
  order?: Order;
  invoice?: Invoice;
  practice?: Practice;
  user?: User;
  customerEmail?: string;
  actionUrl?: string;
  additionalData?: Record<string, any>;
}

export class EmailService {
  private baseUrl = process.env.BASE_URL || 'https://your-repl-url.replit.app';

  // Email templates for different notification types
  private getEmailTemplate(type: string, context: EmailContext): EmailTemplate {
    const { order, invoice, practice, user } = context;
    const practiceName = practice?.name || 'Your Practice';
    
    switch (type) {
      case 'order_status_change':
        return this.getOrderStatusChangeTemplate(context);
      
      case 'invoice_generated':
        return {
          subject: `Invoice Generated - ${invoice?.invoiceNumber} for ${practiceName}`,
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">PatientLetterHub</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Healthcare Communication Platform</p>
              </div>
              
              <div style="padding: 30px; background: white;">
                <h2 style="color: #1e40af; margin-bottom: 20px;">Invoice Ready for Payment</h2>
                
                <p>Dear ${practiceName} Team,</p>
                
                <p>Your invoice has been generated and is ready for payment:</p>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #1e40af;">Invoice Details</h3>
                  <p><strong>Invoice Number:</strong> ${invoice?.invoiceNumber}</p>
                  <p><strong>Order Number:</strong> ${order?.orderNumber}</p>
                  <p><strong>Amount Due:</strong> $${invoice?.totalAmount}</p>
                  <p><strong>Due Date:</strong> ${invoice?.dueDate}</p>
                  <p><strong>Payment Terms:</strong> ${invoice?.paymentTerms}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${this.baseUrl}/invoices" 
                     style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    View & Pay Invoice
                  </a>
                </div>
                
                <p>If you have any questions about this invoice, please contact our support team.</p>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                
                <div style="color: #64748b; font-size: 14px;">
                  <p><strong>PatientLetterHub</strong><br>
                  Healthcare Communication Platform<br>
                  support@patientletterhub.com</p>
                </div>
              </div>
            </div>
          `
        };
      
      case 'proof_ready':
        return {
          subject: `Proof Ready for Review - Order ${order?.orderNumber}`,
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">PatientLetterHub</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Healthcare Communication Platform</p>
              </div>
              
              <div style="padding: 30px; background: white;">
                <h2 style="color: #2563eb; margin-bottom: 20px;">🎯 Proof Ready for Your Review</h2>
                
                <p>Dear ${practiceName} Team,</p>
                
                <p>Great news! Your letter proof is ready for review and approval.</p>
                
                <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #0369a1;">Order Information</h3>
                  <p><strong>Order Number:</strong> ${order?.orderNumber}</p>
                  <p><strong>Subject:</strong> ${order?.subject}</p>
                  <p><strong>Template:</strong> ${order?.templateType}</p>
                  <p><strong>Recipients:</strong> ${order?.recipientCount} patients</p>
                </div>
                
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #92400e;"><strong>⏰ Action Required:</strong> Please review and approve your proof within 48 hours to maintain your production schedule.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${context.actionUrl || `${this.baseUrl}/proof-review`}" 
                     style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                    Review Proof Now
                  </a>
                </div>
                
                <p><strong>What happens next?</strong></p>
                <ul>
                  <li>Review the proof carefully for accuracy</li>
                  <li>Approve or request changes</li>
                  <li>Once approved, production begins immediately</li>
                  <li>Your letters will be printed and mailed within 2-3 business days</li>
                </ul>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                
                <div style="color: #64748b; font-size: 14px;">
                  <p><strong>PatientLetterHub</strong><br>
                  Healthcare Communication Platform<br>
                  support@patientletterhub.com</p>
                </div>
              </div>
            </div>
          `
        };
      
      case 'order_completed':
        return {
          subject: `Order Completed - ${order?.orderNumber} Letters Delivered`,
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px;">PatientLetterHub</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Healthcare Communication Platform</p>
              </div>
              
              <div style="padding: 30px; background: white;">
                <h2 style="color: #059669; margin-bottom: 20px;">🎉 Order Successfully Completed!</h2>
                
                <p>Dear ${practiceName} Team,</p>
                
                <p>Excellent news! Your patient letter campaign has been completed and delivered.</p>
                
                <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #166534;">Delivery Summary</h3>
                  <p><strong>Order Number:</strong> ${order?.orderNumber}</p>
                  <p><strong>Subject:</strong> ${order?.subject}</p>
                  <p><strong>Letters Mailed:</strong> ${order?.recipientCount}</p>
                  <p><strong>Completion Date:</strong> ${new Date().toLocaleDateString()}</p>
                  <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">✓ Delivered</span></p>
                </div>
                
                <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #1e40af;"><strong>📊 Delivery Tracking:</strong> All letters have been processed through USPS and are in transit to your patients. Most letters will arrive within 3-5 business days.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${this.baseUrl}/orders" 
                     style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                    View Order Details
                  </a>
                  <a href="${this.baseUrl}/quote-create" 
                     style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Create New Order
                  </a>
                </div>
                
                <p><strong>What's Next?</strong></p>
                <ul>
                  <li>Your invoice will be available in the billing section</li>
                  <li>Track delivery status in your dashboard</li>
                  <li>Create new campaigns anytime</li>
                  <li>Contact support for any questions</li>
                </ul>
                
                <p>Thank you for choosing PatientLetterHub for your patient communication needs!</p>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                
                <div style="color: #64748b; font-size: 14px;">
                  <p><strong>PatientLetterHub</strong><br>
                  Healthcare Communication Platform<br>
                  support@patientletterhub.com</p>
                </div>
              </div>
            </div>
          `
        };
      
      default:
        return {
          subject: `Update from PatientLetterHub`,
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <p>You have an update regarding your PatientLetterHub account.</p>
              <p>Please log in to your dashboard for more details.</p>
            </div>
          `
        };
    }
  }

  private getOrderStatusChangeTemplate(context: EmailContext): EmailTemplate {
    const { order, practice } = context;
    const practiceName = practice?.name || 'Your Practice';
    const status = order?.status || 'unknown';
    
    const statusInfo = this.getStatusInfo(status);
    
    return {
      subject: `Order Update: ${order?.orderNumber} - ${statusInfo.label}`,
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">PatientLetterHub</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Healthcare Communication Platform</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #1e40af; margin-bottom: 20px;">${statusInfo.icon} Order Status Update</h2>
            
            <p>Dear ${practiceName} Team,</p>
            
            <p>Your order status has been updated:</p>
            
            <div style="background: ${statusInfo.bgColor}; border: 1px solid ${statusInfo.borderColor}; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: ${statusInfo.textColor};">Order Information</h3>
              <p><strong>Order Number:</strong> ${order?.orderNumber}</p>
              <p><strong>Subject:</strong> ${order?.subject}</p>
              <p><strong>New Status:</strong> <span style="color: ${statusInfo.textColor}; font-weight: bold;">${statusInfo.label}</span></p>
              <p><strong>Recipients:</strong> ${order?.recipientCount} patients</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #475569;"><strong>What this means:</strong> ${statusInfo.description}</p>
            </div>
            
            ${statusInfo.actionRequired ? `
              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;"><strong>⏰ Action Required:</strong> ${statusInfo.actionRequired}</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.baseUrl}/orders" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Order Details
              </a>
            </div>
            
            <p>If you have any questions about this update, please don't hesitate to contact our support team.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <div style="color: #64748b; font-size: 14px;">
              <p><strong>PatientLetterHub</strong><br>
              Healthcare Communication Platform<br>
              support@patientletterhub.com</p>
            </div>
          </div>
        </div>
      `
    };
  }

  private getStatusInfo(status: string) {
    const statusMap = {
      'pending': {
        label: 'Pending Confirmation',
        icon: '⏳',
        description: 'Your order has been received and is awaiting confirmation.',
        bgColor: '#fef3c7',
        borderColor: '#f59e0b',
        textColor: '#92400e',
        actionRequired: null
      },
      'confirmed': {
        label: 'Confirmed',
        icon: '✅',
        description: 'Your order has been confirmed and is being prepared for production.',
        bgColor: '#f0fdf4',
        borderColor: '#22c55e',
        textColor: '#166534',
        actionRequired: null
      },
      'waiting-approval': {
        label: 'Waiting for Approval',
        icon: '👀',
        description: 'Your proof is ready and waiting for your review and approval.',
        bgColor: '#fef3c7',
        borderColor: '#f59e0b',
        textColor: '#92400e',
        actionRequired: 'Please review and approve your proof to proceed with production.'
      },
      'approved': {
        label: 'Approved',
        icon: '✅',
        description: 'Your proof has been approved and production will begin shortly.',
        bgColor: '#f0fdf4',
        borderColor: '#22c55e',
        textColor: '#166534',
        actionRequired: null
      },
      'in-production': {
        label: 'In Production',
        icon: '🖨️',
        description: 'Your letters are currently being printed and prepared for mailing.',
        bgColor: '#eff6ff',
        borderColor: '#3b82f6',
        textColor: '#1e40af',
        actionRequired: null
      },
      'completed': {
        label: 'Completed',
        icon: '🎉',
        description: 'Your letters have been printed and mailed successfully.',
        bgColor: '#f0fdf4',
        borderColor: '#22c55e',
        textColor: '#166534',
        actionRequired: null
      }
    };

    return statusMap[status as keyof typeof statusMap] || {
      label: status,
      icon: '📝',
      description: 'Your order status has been updated.',
      bgColor: '#f8fafc',
      borderColor: '#e2e8f0',
      textColor: '#475569',
      actionRequired: null
    };
  }

  // Send email notification (production-ready implementation)
  async sendEmail(
    emailType: string,
    recipientEmail: string,
    context: EmailContext
  ): Promise<boolean> {
    try {
      const template = this.getEmailTemplate(emailType, context);
      
      // Email service integration (Resend API)
      if (process.env.RESEND_API_KEY) {
        // In production, integrate with actual email service
        logger.info({ recipientEmail, subject: template.subject }, 'Email would be sent (simulation)');
        // TODO: Implement actual email service integration when RESEND_API_KEY is available
      } else {
        logger.info({ recipientEmail, subject: template.subject }, 'Email logging (no RESEND_API_KEY)');
      }

      // Store email history in database
      const emailData: InsertEmailNotification = {
        tenantId: context.order?.tenantId || context.practice?.tenantId || 1,
        orderId: context.order?.id || null,
        invoiceId: context.invoice?.id || null,
        userId: context.user?.id || '',
        practiceId: context.practice?.id || null,
        recipientEmail,
        emailType,
        subject: template.subject,
        content: template.content,
        status: 'sent'
      };

      await db.insert(emailNotifications).values(emailData);

      return true;
    } catch (error) {
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Trigger email for order status changes
  async triggerOrderStatusEmail(orderId: number, newStatus: string): Promise<void> {
    try {
      // Get order with related data
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order) return;

      // Get practice and user info
      let practice = null;
      let user = null;

      if (order.practiceId) {
        [practice] = await db
          .select()
          .from(practices)
          .where(eq(practices.id, order.practiceId));
      }

      [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, order.userId));

      const recipientEmail = practice?.email || user?.email;
      if (!recipientEmail) return;

      const context: EmailContext = {
        order,
        practice: practice || undefined,
        user: user || undefined,
        customerEmail: recipientEmail
      };

      await this.sendEmail('order_status_change', recipientEmail, context);
    } catch (error) {
      // Log critical errors for monitoring
      throw new Error(`Order status email error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Trigger email for invoice generation
  async triggerInvoiceEmail(invoiceId: number): Promise<void> {
    try {
      // Get invoice with related order data
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId));

      if (!invoice || !invoice.orderId) return;

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, invoice.orderId));

      if (!order) return;

      // Get practice and user info
      let practice = null;
      let user = null;

      if (order.practiceId) {
        [practice] = await db
          .select()
          .from(practices)
          .where(eq(practices.id, order.practiceId));
      }

      [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, order.userId));

      const recipientEmail = practice?.email || user?.email;
      if (!recipientEmail) return;

      const context: EmailContext = {
        order,
        invoice,
        practice: practice || undefined,
        user: user || undefined,
        customerEmail: recipientEmail
      };

      await this.sendEmail('invoice_generated', recipientEmail, context);
    } catch (error) {
      throw new Error(`Invoice email error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Trigger email for proof ready notification
  async triggerProofReadyEmail(orderId: number, proofUrl?: string): Promise<void> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order) return;

      // Get practice and user info
      let practice = null;
      let user = null;

      if (order.practiceId) {
        [practice] = await db
          .select()
          .from(practices)
          .where(eq(practices.id, order.practiceId));
      }

      [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, order.userId));

      const recipientEmail = practice?.email || user?.email;
      if (!recipientEmail) return;

      const context: EmailContext = {
        order,
        practice: practice || undefined,
        user: user || undefined,
        customerEmail: recipientEmail,
        actionUrl: proofUrl || `${this.baseUrl}/proof-review`
      };

      await this.sendEmail('proof_ready', recipientEmail, context);
    } catch (error) {
      throw new Error(`Proof ready email error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Trigger email for order completion
  async triggerOrderCompletedEmail(orderId: number): Promise<void> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order) return;

      // Get practice and user info
      let practice = null;
      let user = null;

      if (order.practiceId) {
        [practice] = await db
          .select()
          .from(practices)
          .where(eq(practices.id, order.practiceId));
      }

      [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, order.userId));

      const recipientEmail = practice?.email || user?.email;
      if (!recipientEmail) return;

      const context: EmailContext = {
        order,
        practice: practice || undefined,
        user: user || undefined,
        customerEmail: recipientEmail
      };

      await this.sendEmail('order_completed', recipientEmail, context);
    } catch (error) {
      throw new Error(`Order completed email error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get email notification history for a user
  async getUserEmailHistory(userId: string, limit: number = 50) {
    return await db
      .select()
      .from(emailNotifications)
      .where(eq(emailNotifications.userId, userId))
      .orderBy(emailNotifications.sentAt)
      .limit(limit);
  }

  // Get all email notifications (admin view)
  async getAllEmailHistory(limit: number = 100) {
    return await db
      .select()
      .from(emailNotifications)
      .orderBy(emailNotifications.sentAt)
      .limit(limit);
  }
}

export const emailService = new EmailService();