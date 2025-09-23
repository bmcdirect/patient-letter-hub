import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
  }

  async sendMagicLinkEmail(email: string, token: string) {
    const magicLink = `${this.baseUrl}/auth/verify?token=${token}`;
    
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@example.com",
        to: email,
        subject: "Your Magic Link",
        html: `
          <h1>Welcome!</h1>
          <p>Click the link below to sign in:</p>
          <a href="${magicLink}">Sign In</a>
        `,
      });

      if (error) {
        console.error("Error sending email:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to send magic link email:", error);
      throw error;
    }
  }

  async sendOrderConfirmationEmail(email: string, orderNumber: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@example.com",
        to: email,
        subject: `Order Confirmation - ${orderNumber}`,
        html: `
          <h1>Order Confirmed!</h1>
          <p>Your order ${orderNumber} has been confirmed.</p>
          <p>Thank you for your business!</p>
        `,
      });

      if (error) {
        console.error("Error sending email:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
      throw error;
    }
  }

  async sendCustomEmail(email: string, subject: string, content: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@example.com",
        to: email,
        subject: subject,
        html: content,
      });

      if (error) {
        console.error("Error sending custom email:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to send custom email:", error);
      throw error;
    }
  }

  async sendStatusUpdateEmail(email: string, orderNumber: string, oldStatus: string, newStatus: string, comments?: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@example.com",
        to: email,
        subject: `Order Status Update - ${orderNumber}`,
        html: `
          <h1>Order Status Update</h1>
          <p>Your order ${orderNumber} status has been updated:</p>
          <p><strong>Previous Status:</strong> ${oldStatus}</p>
          <p><strong>New Status:</strong> ${newStatus}</p>
          ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
          <p>Thank you for your business!</p>
        `,
      });

      if (error) {
        console.error("Error sending status update email:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to send status update email:", error);
      throw error;
    }
  }

  async sendProofResponseEmail(email: string, orderNumber: string, action: string, feedback?: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@example.com",
        to: email,
        subject: `Proof Response - Order ${orderNumber}`,
        html: `
          <h1>Proof Response Received</h1>
          <p>Thank you for your response to Order ${orderNumber}.</p>
          <p><strong>Action:</strong> ${action}</p>
          ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
          <p>Our team will review your response and proceed accordingly.</p>
          <p>Thank you for your business!</p>
        `,
      });

      if (error) {
        console.error("Error sending proof response email:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to send proof response email:", error);
      throw error;
    }
  }
}
