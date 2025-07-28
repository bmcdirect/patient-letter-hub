import { Resend } from 'resend';
import { storage } from '../storage';
import { logger } from '../../logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export class RealEmailService {
  private isEnabled = !!process.env.RESEND_API_KEY;

  async sendProofReadyEmail(orderId: number): Promise<void> {
    try {
      const order = await storage.getOrderAdmin(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const tenant = await storage.getTenantSettings(order.tenantId);
      const approvalLink = `${process.env.BASE_URL || 'http://localhost:5000'}/orders/${order.id}/approve`;

      const emailData = {
        from: 'PatientLetterHub <notifications@patientletterhub.com>',
        to: [order.contactEmail],
        subject: `Proof Ready for Review - Order ${order.orderNumber}`,
        html: this.generateProofReadyTemplate(order, tenant, approvalLink),
      };

      if (this.isEnabled) {
        const result = await resend.emails.send(emailData);
        logger.info({ result }, 'Proof ready email sent');
      } else {
        logger.info({ emailData }, 'Proof ready email (disabled, logging)');
      }

      // Log email notification in database
      await this.logEmailNotification(order.userId, order.tenantId, 'proof_ready', emailData);
    } catch (error) {
      console.error('Error sending proof ready email:', error);
      throw error;
    }
  }

  async sendOrderStatusEmail(orderId: number, newStatus: string): Promise<void> {
    try {
      const order = await storage.getOrderAdmin(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const tenant = await storage.getTenantSettings(order.tenantId);
      const orderLink = `${process.env.BASE_URL || 'http://localhost:5000'}/orders/${order.id}`;

      const emailData = {
        from: 'PatientLetterHub <notifications@patientletterhub.com>',
        to: [order.contactEmail],
        subject: `Order Status Update - ${order.orderNumber}`,
        html: this.generateStatusUpdateTemplate(order, tenant, newStatus, orderLink),
      };

      if (this.isEnabled) {
        const result = await resend.emails.send(emailData);
        logger.info({ result }, 'Status update email sent');
      } else {
        logger.info({ emailData }, 'Status update email (disabled, logging)');
      }

      await this.logEmailNotification(order.userId, order.tenantId, 'status_update', emailData);
    } catch (error) {
      console.error('Error sending status update email:', error);
      throw error;
    }
  }

  async sendAdminNotificationEmail(orderId: number, type: 'customer_feedback' | 'new_order'): Promise<void> {
    try {
      const order = await storage.getOrderAdmin(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const tenant = await storage.getTenantSettings(order.tenantId);
      const adminEmails = await this.getAdminEmails(order.tenantId);
      
      if (adminEmails.length === 0) {
        logger.warn({ tenantId: order.tenantId }, 'No admin emails configured for tenant');
        return;
      }

      const orderLink = `${process.env.BASE_URL || 'http://localhost:5000'}/admin/dashboard`;

      let subject = '';
      let template = '';
      
      if (type === 'customer_feedback') {
        subject = `Customer Feedback Received - Order ${order.orderNumber}`;
        template = this.generateCustomerFeedbackTemplate(order, tenant, orderLink);
      } else if (type === 'new_order') {
        subject = `New Order Received - ${order.orderNumber}`;
        template = this.generateNewOrderTemplate(order, tenant, orderLink);
      }

      const emailData = {
        from: 'PatientLetterHub <admin@patientletterhub.com>',
        to: adminEmails,
        subject,
        html: template,
      };

      if (this.isEnabled) {
        const result = await resend.emails.send(emailData);
        logger.info({ result }, 'Admin notification email sent');
      } else {
        logger.info({ emailData }, 'Admin notification email (disabled, logging)');
      }

      await this.logEmailNotification('admin', order.tenantId, type, emailData);
    } catch (error) {
      console.error('Error sending admin notification email:', error);
      throw error;
    }
  }

  async sendInvoiceEmail(invoiceId: number): Promise<void> {
    try {
      // Implementation would fetch invoice details and send PDF
      logger.info({ invoiceId }, 'Invoice email would be sent');
    } catch (error) {
      console.error('Error sending invoice email:', error);
      throw error;
    }
  }

  private async getAdminEmails(tenantId: number): Promise<string[]> {
    // Get tenant admin emails - for now return a test email
    const tenant = await storage.getTenantSettings(tenantId);
    const adminEmails = ['admin@patientletterhub.com']; // Default admin email
    
    if (tenant?.email) {
      adminEmails.push(tenant.email);
    }
    
    return adminEmails;
  }

  private async logEmailNotification(userId: string, tenantId: number, type: string, emailData: any): Promise<void> {
    // Implementation would log to email_notifications table
    logger.info({ type, userId, tenantId }, 'Email notification logged');
  }

  private generateProofReadyTemplate(order: any, tenant: any, approvalLink: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Proof Ready for Review</h2>
        <p>Hello,</p>
        <p>Your proof for order <strong>${order.orderNumber}</strong> is ready for review.</p>
        
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Subject:</strong> ${order.subject}</p>
          <p><strong>Recipients:</strong> ${order.recipientCount} people</p>
        </div>
        
        <p>Please review your proof and either approve it or request changes:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${approvalLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Proof
          </a>
        </div>
        
        <p>If you have any questions, please contact us.</p>
        
        <p>Best regards,<br>
        PatientLetterHub Team</p>
      </div>
    `;
  }

  private generateStatusUpdateTemplate(order: any, tenant: any, status: string, orderLink: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Order Status Update</h2>
        <p>Hello,</p>
        <p>Your order <strong>${order.orderNumber}</strong> status has been updated to: <strong>${status}</strong></p>
        
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Subject:</strong> ${order.subject}</p>
          <p><strong>Status:</strong> ${status}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${orderLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Order Details
          </a>
        </div>
        
        <p>Best regards,<br>
        PatientLetterHub Team</p>
      </div>
    `;
  }

  private generateCustomerFeedbackTemplate(order: any, tenant: any, adminLink: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Customer Feedback Received</h2>
        <p>A customer has provided feedback on order <strong>${order.orderNumber}</strong></p>
        
        <div style="background: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Customer:</strong> ${order.contactEmail}</p>
          <p><strong>Subject:</strong> ${order.subject}</p>
        </div>
        
        <p>Please review the customer feedback in the admin dashboard and take appropriate action.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${adminLink}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View in Admin Dashboard
          </a>
        </div>
        
        <p>PatientLetterHub Operations Team</p>
      </div>
    `;
  }

  private generateNewOrderTemplate(order: any, tenant: any, adminLink: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">New Order Received</h2>
        <p>A new order has been submitted and requires processing.</p>
        
        <div style="background: #f0fdf4; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #16a34a;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Customer:</strong> ${order.contactEmail}</p>
          <p><strong>Subject:</strong> ${order.subject}</p>
          <p><strong>Recipients:</strong> ${order.recipientCount} people</p>
          <p><strong>Total Cost:</strong> $${order.totalCost}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${adminLink}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Process Order
          </a>
        </div>
        
        <p>PatientLetterHub Operations Team</p>
      </div>
    `;
  }
}

export const realEmailService = new RealEmailService();