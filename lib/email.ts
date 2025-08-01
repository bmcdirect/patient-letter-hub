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
}
