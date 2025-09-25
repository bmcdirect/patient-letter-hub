import nodemailer from 'nodemailer';

// Create SMTP transporter for Microsoft 365 with alias support
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Primary account for authentication
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

export class EmailService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
  }

  async sendMagicLinkEmail(email: string, token: string) {
    const magicLink = `${this.baseUrl}/auth/verify?token=${token}`;
    
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@patientletterhub.com",
        to: email,
        subject: "Your Magic Link - Patient Letter Hub",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Welcome to Patient Letter Hub!</h1>
            <p>Click the link below to sign in to your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sign In</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours and can only be used once.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">If you did not request this login link, please ignore this email.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Magic link email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send magic link email:", error);
      throw error;
    }
  }

  async sendOrderConfirmationEmail(email: string, orderNumber: string) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@patientletterhub.com",
        to: email,
        subject: `Order Confirmation - ${orderNumber} | Patient Letter Hub`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Order Confirmed!</h1>
            <p>Your order <strong>${orderNumber}</strong> has been successfully confirmed and is now being processed.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Order Details</h3>
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Status:</strong> Confirmed</p>
              <p><strong>Confirmation Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <p>Our team will begin processing your order and you will receive updates as we progress through each stage.</p>
            <p>Thank you for choosing Patient Letter Hub for your healthcare communication needs!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">This is an automated confirmation email. Please do not reply to this message.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Order confirmation email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
      throw error;
    }
  }

  async sendCustomEmail(email: string, subject: string, content: string) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@patientletterhub.com",
        to: email,
        subject: `${subject} | Patient Letter Hub`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${content}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">This email was sent from Patient Letter Hub. Please do not reply to this message.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Custom email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send custom email:", error);
      throw error;
    }
  }

  async sendStatusUpdateEmail(email: string, orderNumber: string, oldStatus: string, newStatus: string, comments?: string) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@patientletterhub.com",
        to: email,
        subject: `Order Status Update - ${orderNumber} | Patient Letter Hub`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Order Status Update</h1>
            <p>Your order <strong>${orderNumber}</strong> status has been updated.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Status Change</h3>
              <p><strong>Previous Status:</strong> ${oldStatus}</p>
              <p><strong>New Status:</strong> <span style="color: #059669; font-weight: bold;">${newStatus}</span></p>
              ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
            </div>
            <p>You can track your order progress in your Patient Letter Hub dashboard.</p>
            <p>Thank you for choosing Patient Letter Hub!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">This is an automated status update. Please do not reply to this message.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Status update email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send status update email:", error);
      throw error;
    }
  }

  async sendProofResponseEmail(email: string, orderNumber: string, action: string, feedback?: string) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@patientletterhub.com",
        to: email,
        subject: `Proof Response - Order ${orderNumber} | Patient Letter Hub`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Proof Response Received</h1>
            <p>Thank you for your response to Order <strong>${orderNumber}</strong>.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Response Details</h3>
              <p><strong>Action:</strong> <span style="color: #059669; font-weight: bold;">${action}</span></p>
              ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
            </div>
            <p>Our team will review your response and proceed accordingly. You will receive updates as we continue processing your order.</p>
            <p>Thank you for choosing Patient Letter Hub!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">This is an automated confirmation email. Please do not reply to this message.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Proof response email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send proof response email:", error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, userName: string) {
    try {
      const mailOptions = {
        from: "customerservice@patientletterhub.com",
        to: email,
        subject: "Welcome to PatientLetterHub - Your HIPAA-Compliant Letter Solution!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to PatientLetterHub!</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your HIPAA-compliant patient letter solution</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 20px; background-color: #ffffff;">
              <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">Hi ${userName},</p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                Congratulations on completing your profile setup! You're now ready to start creating professional, 
                HIPAA-compliant patient letters that will streamline your practice's communication.
              </p>

              <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb;">
                <h3 style="color: #1e40af; margin-top: 0; font-size: 20px;">🚀 Getting Started is Easy</h3>
                <ul style="color: #4b5563; line-height: 1.8; margin: 15px 0;">
                  <li><strong>Create Your First Order:</strong> Navigate to the Orders section and click "New Order"</li>
                  <li><strong>Upload Patient Data:</strong> Use our secure CSV upload or enter patient information manually</li>
                  <li><strong>Choose Templates:</strong> Select from our library of HIPAA-compliant letter templates</li>
                  <li><strong>Review & Send:</strong> Preview your letters and send them securely to patients</li>
                </ul>
              </div>

              <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 20px;">📞 Need Help Getting Started?</h3>
                <p style="color: #4b5563; margin-bottom: 15px;">
                  We're here to help you succeed! Schedule a personalized demo to see PatientLetterHub in action:
                </p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="mailto:demos@patientletterhub.com" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Schedule Your Demo</a>
                </div>
              </div>

              <div style="background-color: #ecfdf5; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #065f46; margin-top: 0; font-size: 20px;">💬 Questions? We're Here!</h3>
                <p style="color: #4b5563; margin-bottom: 15px;">
                  Have questions about HIPAA compliance, templates, or how to customize your letters? 
                  Don't hesitate to reach out:
                </p>
                <div style="text-align: center;">
                  <p style="margin: 10px 0;"><strong>📧 Email:</strong> <a href="mailto:customerservice@patientletterhub.com" style="color: #2563eb;">customerservice@patientletterhub.com</a></p>
                  <p style="margin: 10px 0;"><strong>📞 Phone:</strong> <a href="tel:800-555-1212" style="color: #2563eb;">800-555-1212</a></p>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${this.baseUrl}/dashboard" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Access Your Dashboard</a>
              </div>

              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 30px;">
                Thank you for choosing PatientLetterHub. We're excited to help you streamline your patient communication 
                while maintaining the highest standards of HIPAA compliance.
              </p>

              <p style="font-size: 16px; color: #4b5563; margin-top: 20px;">
                Best regards,<br>
                <strong>The PatientLetterHub Team</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                PatientLetterHub - HIPAA-Compliant Patient Communication Solutions<br>
                <a href="${this.baseUrl}" style="color: #2563eb;">www.patientletterhub.com</a>
              </p>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Welcome email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      throw error;
    }
  }
}
