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
        from: "customerservice@patientletterhub.com",
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


  async sendCustomEmail(email: string, subject: string, content: string) {
    try {
      const mailOptions = {
        from: "customerservice@patientletterhub.com",
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
        from: "customerservice@patientletterhub.com",
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
        from: "customerservice@patientletterhub.com",
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

  // ===== ORDER LIFECYCLE EMAIL METHODS =====

  async sendOrderConfirmationEmail(email: string, orderData: {
    orderNumber: string;
    practiceName: string;
    subject?: string;
    templateType?: string;
    cost?: number;
    estimatedRecipients?: number;
  }) {
    try {
      const mailOptions = {
        from: "customerservice@patientletterhub.com",
        to: email,
        subject: `Order Confirmation - ${orderData.orderNumber} | PatientLetterHub`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Order Confirmed!</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your patient letter order is being processed</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 20px; background-color: #ffffff;">
              <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">Thank you for your order!</p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                We've received your order and our team is already working on it. Here are the details:
              </p>

              <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb;">
                <h3 style="color: #1e40af; margin-top: 0; font-size: 20px;">📋 Order Details</h3>
                <div style="color: #4b5563; line-height: 1.8;">
                  <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                  <p><strong>Practice:</strong> ${orderData.practiceName}</p>
                  ${orderData.subject ? `<p><strong>Subject:</strong> ${orderData.subject}</p>` : ''}
                  ${orderData.templateType ? `<p><strong>Template:</strong> ${orderData.templateType}</p>` : ''}
                  ${orderData.cost ? `<p><strong>Estimated Cost:</strong> $${orderData.cost.toFixed(2)}</p>` : ''}
                  ${orderData.estimatedRecipients ? `<p><strong>Estimated Recipients:</strong> ${orderData.estimatedRecipients}</p>` : ''}
                  <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div style="background-color: #ecfdf5; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #065f46; margin-top: 0; font-size: 20px;">🚀 What Happens Next?</h3>
                <ul style="color: #4b5563; line-height: 1.8; margin: 15px 0;">
                  <li><strong>Review Phase:</strong> Our team will review your order and data</li>
                  <li><strong>Proof Creation:</strong> We'll create a proof for your approval</li>
                  <li><strong>Production:</strong> Once approved, we'll begin production</li>
                  <li><strong>Mailing:</strong> Your letters will be mailed to patients</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${this.baseUrl}/orders" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">View Order Status</a>
              </div>

              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 30px;">
                We'll keep you updated throughout the process. If you have any questions, please don't hesitate to contact us.
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
                <a href="${this.baseUrl}" style="color: #2563eb;">www.patientletterhub.com</a> | 
                <a href="mailto:customerservice@patientletterhub.com" style="color: #2563eb;">customerservice@patientletterhub.com</a>
              </p>
            </div>
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

  async sendOrderInProductionEmail(email: string, orderData: {
    orderNumber: string;
    practiceName: string;
    estimatedCompletionDate?: string;
  }) {
    try {
      const mailOptions = {
        from: "customerservice@patientletterhub.com",
        to: email,
        subject: `Order In Production - ${orderData.orderNumber} | PatientLetterHub`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Order In Production!</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your patient letters are being produced</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 20px; background-color: #ffffff;">
              <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">Great news!</p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                Your order <strong>${orderData.orderNumber}</strong> has been approved and is now in production. 
                Our team is working diligently to ensure your patient letters meet the highest quality standards.
              </p>

              <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #7c3aed;">
                <h3 style="color: #5b21b6; margin-top: 0; font-size: 20px;">🏭 Production Details</h3>
                <div style="color: #4b5563; line-height: 1.8;">
                  <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                  <p><strong>Practice:</strong> ${orderData.practiceName}</p>
                  <p><strong>Status:</strong> In Production</p>
                  <p><strong>Started:</strong> ${new Date().toLocaleDateString()}</p>
                  ${orderData.estimatedCompletionDate ? `<p><strong>Estimated Completion:</strong> ${orderData.estimatedCompletionDate}</p>` : ''}
                </div>
              </div>

              <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 20px;">⏱️ What We're Doing</h3>
                <ul style="color: #4b5563; line-height: 1.8; margin: 15px 0;">
                  <li>Printing your patient letters with high-quality materials</li>
                  <li>Applying proper postage and addressing</li>
                  <li>Ensuring HIPAA compliance throughout the process</li>
                  <li>Quality control checks before mailing</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${this.baseUrl}/orders" style="background-color: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Track Order Progress</a>
              </div>

              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 30px;">
                We'll notify you as soon as production is complete and your letters are ready for mailing.
              </p>

              <p style="font-size: 16px; color: #4b5563; margin-top: 20px;">
                Best regards,<br>
                <strong>The PatientLetterHub Production Team</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                PatientLetterHub - HIPAA-Compliant Patient Communication Solutions<br>
                <a href="${this.baseUrl}" style="color: #2563eb;">www.patientletterhub.com</a> | 
                <a href="mailto:customerservice@patientletterhub.com" style="color: #2563eb;">customerservice@patientletterhub.com</a>
              </p>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Order in production email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send order in production email:", error);
      throw error;
    }
  }

  async sendProofReadyEmail(email: string, orderData: {
    orderNumber: string;
    practiceName: string;
    proofId: string;
    orderId: string;
    revisionNumber?: number;
  }) {
    try {
      const proofLink = `${this.baseUrl}/orders/${orderData.orderId}/proof-review?proofId=${orderData.proofId}`;
      const revisionText = orderData.revisionNumber ? ` (Revision ${orderData.revisionNumber})` : '';
      
      const mailOptions = {
        from: "customerservice@patientletterhub.com",
        to: email,
        subject: `Proof Ready for Review${revisionText} - ${orderData.orderNumber} | PatientLetterHub`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Proof Ready for Review${revisionText}!</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Please review your patient letter proof</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 20px; background-color: #ffffff;">
              <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">Your proof is ready!</p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                We've created a proof for your order <strong>${orderData.orderNumber}</strong>. 
                Please review it carefully and let us know if you'd like any changes before we proceed to production.
              </p>

              <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
                <h3 style="color: #047857; margin-top: 0; font-size: 20px;">📄 Proof Details</h3>
                <div style="color: #4b5563; line-height: 1.8;">
                  <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                  <p><strong>Practice:</strong> ${orderData.practiceName}</p>
                  <p><strong>Proof ID:</strong> ${orderData.proofId}</p>
                  ${orderData.revisionNumber ? `<p><strong>Revision:</strong> ${orderData.revisionNumber}</p>` : ''}
                  <p><strong>Created:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div style="background-color: #ecfdf5; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #065f46; margin-top: 0; font-size: 20px;">🔍 Review Instructions</h3>
                <ul style="color: #4b5563; line-height: 1.8; margin: 15px 0;">
                  <li>Click the "Review Proof" button below to view your proof</li>
                  <li>Check all text, formatting, and patient information</li>
                  <li>Verify the letterhead and practice information</li>
                  <li>Approve if everything looks correct, or request changes</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${proofLink}" style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Review Proof</a>
              </div>

              <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 20px;">⚠️ Important</h3>
                <p style="color: #4b5563; margin-bottom: 15px;">
                  Please review your proof promptly. If we don't hear from you within 3 business days, 
                  we'll assume the proof is approved and proceed to production.
                </p>
                <p style="color: #4b5563; margin: 0;">
                  <strong>Questions?</strong> Reply to this email or call us at <a href="tel:800-555-1212" style="color: #2563eb;">800-555-1212</a>
                </p>
              </div>

              <p style="font-size: 16px; color: #4b5563; margin-top: 20px;">
                Best regards,<br>
                <strong>The PatientLetterHub Team</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                PatientLetterHub - HIPAA-Compliant Patient Communication Solutions<br>
                <a href="${this.baseUrl}" style="color: #2563eb;">www.patientletterhub.com</a> | 
                <a href="mailto:customerservice@patientletterhub.com" style="color: #2563eb;">customerservice@patientletterhub.com</a>
              </p>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Proof ready email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send proof ready email:", error);
      throw error;
    }
  }

  async sendProofApprovedEmail(email: string, orderData: {
    orderNumber: string;
    practiceName: string;
    revisionNumber?: number;
  }) {
    try {
      const revisionText = orderData.revisionNumber ? ` (Revision ${orderData.revisionNumber})` : '';
      
      const mailOptions = {
        from: "customerservice@patientletterhub.com",
        to: email,
        subject: `Proof Approved${revisionText} - ${orderData.orderNumber} | PatientLetterHub`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Proof Approved${revisionText}!</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Moving to production</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 20px; background-color: #ffffff;">
              <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">Thank you for your approval!</p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                We've received your approval for order <strong>${orderData.orderNumber}</strong>. 
                Our production team will now begin creating your patient letters.
              </p>

              <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #059669; margin-top: 0; font-size: 20px;">✅ Approval Details</h3>
                <div style="color: #4b5563; line-height: 1.8;">
                  <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                  <p><strong>Practice:</strong> ${orderData.practiceName}</p>
                  <p><strong>Status:</strong> Approved - Moving to Production</p>
                  ${orderData.revisionNumber ? `<p><strong>Revision Approved:</strong> ${orderData.revisionNumber}</p>` : ''}
                  <p><strong>Approved:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div style="background-color: #ecfdf5; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #065f46; margin-top: 0; font-size: 20px;">🚀 Next Steps</h3>
                <ul style="color: #4b5563; line-height: 1.8; margin: 15px 0;">
                  <li><strong>Production:</strong> We'll begin printing your patient letters</li>
                  <li><strong>Quality Control:</strong> Each letter will be checked for accuracy</li>
                  <li><strong>Mailing Preparation:</strong> Letters will be prepared for mailing</li>
                  <li><strong>Delivery:</strong> We'll notify you when letters are mailed</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${this.baseUrl}/orders" style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Track Order Progress</a>
              </div>

              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 30px;">
                We'll keep you updated throughout the production process. 
                If you have any questions or need to make changes, please contact us immediately.
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
                <a href="${this.baseUrl}" style="color: #2563eb;">www.patientletterhub.com</a> | 
                <a href="mailto:customerservice@patientletterhub.com" style="color: #2563eb;">customerservice@patientletterhub.com</a>
              </p>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Proof approved email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send proof approved email:", error);
      throw error;
    }
  }

  async sendOrderCompletedEmail(email: string, orderData: {
    orderNumber: string;
    practiceName: string;
    completionDate: string;
    trackingNumber?: string;
  }) {
    try {
      const mailOptions = {
        from: "customerservice@patientletterhub.com",
        to: email,
        subject: `Order Completed - ${orderData.orderNumber} | PatientLetterHub`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Order Completed!</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your patient letters are ready for mailing</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 20px; background-color: #ffffff;">
              <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">Congratulations!</p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                Your order <strong>${orderData.orderNumber}</strong> has been completed and is ready for mailing. 
                All patient letters have been printed, quality-checked, and prepared for delivery.
              </p>

              <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
                <h3 style="color: #047857; margin-top: 0; font-size: 20px;">📦 Completion Details</h3>
                <div style="color: #4b5563; line-height: 1.8;">
                  <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                  <p><strong>Practice:</strong> ${orderData.practiceName}</p>
                  <p><strong>Status:</strong> Completed - Ready for Mailing</p>
                  <p><strong>Completed:</strong> ${orderData.completionDate}</p>
                  ${orderData.trackingNumber ? `<p><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>` : ''}
                </div>
              </div>

              <div style="background-color: #ecfdf5; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #065f46; margin-top: 0; font-size: 20px;">📬 What's Next?</h3>
                <ul style="color: #4b5563; line-height: 1.8; margin: 15px 0;">
                  <li><strong>Mailing:</strong> Letters will be mailed to patients within 1-2 business days</li>
                  <li><strong>Delivery:</strong> Patients will receive letters via USPS</li>
                  <li><strong>Tracking:</strong> ${orderData.trackingNumber ? 'Use the tracking number above to monitor delivery' : 'We\'ll notify you when letters are mailed'}</li>
                  <li><strong>Follow-up:</strong> You can track delivery status in your dashboard</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${this.baseUrl}/orders" style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">View Order Details</a>
              </div>

              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 30px;">
                Thank you for choosing PatientLetterHub for your patient communication needs. 
                We're committed to helping you maintain strong relationships with your patients.
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
                <a href="${this.baseUrl}" style="color: #2563eb;">www.patientletterhub.com</a> | 
                <a href="mailto:customerservice@patientletterhub.com" style="color: #2563eb;">customerservice@patientletterhub.com</a>
              </p>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Order completed email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send order completed email:", error);
      throw error;
    }
  }

  async sendOrderMailedEmail(email: string, orderData: {
    orderNumber: string;
    practiceName: string;
    mailingDate: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
  }) {
    try {
      const mailOptions = {
        from: "customerservice@patientletterhub.com",
        to: email,
        subject: `Order Mailed - ${orderData.orderNumber} | PatientLetterHub`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Order Mailed!</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your patient letters are on their way</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 20px; background-color: #ffffff;">
              <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">Great news!</p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                Your order <strong>${orderData.orderNumber}</strong> has been mailed! 
                Your patient letters are now on their way to reach your patients.
              </p>

              <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
                <h3 style="color: #0284c7; margin-top: 0; font-size: 20px;">📮 Mailing Details</h3>
                <div style="color: #4b5563; line-height: 1.8;">
                  <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                  <p><strong>Practice:</strong> ${orderData.practiceName}</p>
                  <p><strong>Status:</strong> Mailed</p>
                  <p><strong>Mailing Date:</strong> ${orderData.mailingDate}</p>
                  ${orderData.trackingNumber ? `<p><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>` : ''}
                  ${orderData.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>` : ''}
                </div>
              </div>

              <div style="background-color: #ecfdf5; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #065f46; margin-top: 0; font-size: 20px;">📬 Delivery Information</h3>
                <ul style="color: #4b5563; line-height: 1.8; margin: 15px 0;">
                  <li><strong>Service:</strong> USPS First-Class Mail</li>
                  <li><strong>Delivery Time:</strong> 1-3 business days</li>
                  <li><strong>Tracking:</strong> ${orderData.trackingNumber ? 'Available via tracking number above' : 'Standard delivery confirmation'}</li>
                  <li><strong>Updates:</strong> We'll notify you when delivery is confirmed</li>
                </ul>
              </div>

              ${orderData.trackingNumber ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://tools.usps.com/go/TrackConfirmAction?tRef=fullpage&tLc=2&text28777=&tLabels=${orderData.trackingNumber}" style="background-color: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Track Delivery</a>
              </div>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${this.baseUrl}/orders" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">View Order Details</a>
              </div>

              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 30px;">
                We'll continue to monitor the delivery status and notify you once all letters have been delivered to your patients.
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
                <a href="${this.baseUrl}" style="color: #2563eb;">www.patientletterhub.com</a> | 
                <a href="mailto:customerservice@patientletterhub.com" style="color: #2563eb;">customerservice@patientletterhub.com</a>
              </p>
            </div>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Order mailed email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send order mailed email:", error);
      throw error;
    }
  }

  async sendOrderThankYouEmail(email: string, orderData: {
    orderNumber: string;
    practiceName: string;
    completionDate: string;
  }) {
    try {
      const mailOptions = {
        from: "customerservice@patientletterhub.com",
        to: email,
        subject: `Thank You - ${orderData.orderNumber} | PatientLetterHub`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Thank You!</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">We appreciate your business</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 20px; background-color: #ffffff;">
              <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">Dear ${orderData.practiceName} Team,</p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                Thank you for choosing PatientLetterHub for your patient communication needs. 
                We're pleased to have successfully completed your order <strong>${orderData.orderNumber}</strong>.
              </p>

              <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #8b5cf6;">
                <h3 style="color: #7c3aed; margin-top: 0; font-size: 20px;">🎉 Order Summary</h3>
                <div style="color: #4b5563; line-height: 1.8;">
                  <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                  <p><strong>Practice:</strong> ${orderData.practiceName}</p>
                  <p><strong>Status:</strong> Completed</p>
                  <p><strong>Completion Date:</strong> ${orderData.completionDate}</p>
                </div>
              </div>

              <div style="background-color: #ecfdf5; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #065f46; margin-top: 0; font-size: 20px;">💬 We Value Your Feedback</h3>
                <p style="color: #4b5563; margin-bottom: 15px;">
                  Your satisfaction is our priority. We'd love to hear about your experience with our service:
                </p>
                <ul style="color: #4b5563; line-height: 1.8; margin: 15px 0;">
                  <li>How was the quality of your patient letters?</li>
                  <li>Did we meet your timeline expectations?</li>
                  <li>Was our communication clear and helpful?</li>
                  <li>Any suggestions for improvement?</li>
                </ul>
              </div>

              <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 20px;">🚀 Ready for Your Next Order?</h3>
                <p style="color: #4b5563; margin-bottom: 15px;">
                  We're here to help with all your patient communication needs:
                </p>
                <ul style="color: #4b5563; line-height: 1.8; margin: 15px 0;">
                  <li>Follow-up appointment reminders</li>
                  <li>Treatment plan communications</li>
                  <li>Insurance updates and notifications</li>
                  <li>Custom patient letters and forms</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${this.baseUrl}/orders/new" style="background-color: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Create New Order</a>
              </div>

              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-top: 30px;">
                Thank you again for trusting us with your patient communication needs. 
                We look forward to serving you again soon!
              </p>

              <p style="font-size: 16px; color: #4b5563; margin-top: 20px;">
                Best regards,<br>
                <strong>The PatientLetterHub Team</strong><br>
                <a href="mailto:customerservice@patientletterhub.com" style="color: #2563eb;">customerservice@patientletterhub.com</a> | 
                <a href="tel:800-555-1212" style="color: #2563eb;">800-555-1212</a>
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
      console.log("Order thank you email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Failed to send order thank you email:", error);
      throw error;
    }
  }
}
