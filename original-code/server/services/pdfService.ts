import puppeteer from 'puppeteer';
import type { Order } from '@shared/schema';

export async function generatePDF(order: Order): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Generate HTML content for the letter
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .practice-info {
            margin-bottom: 30px;
          }
          .letter-content {
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .signature-section {
            margin-top: 50px;
          }
          .footer {
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${order.subject}</h1>
        </div>
        
        <div class="practice-info">
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Recipients:</strong> ${order.recipientCount || order.estimatedRecipients}</p>
          <p><strong>Template Type:</strong> ${order.templateType}</p>
          <p><strong>Color Mode:</strong> ${order.colorMode}</p>
        </div>
        
        <div class="letter-content">
          <p>Dear Patient,</p>
          
          <p>This letter is to inform you about important updates regarding our practice.</p>
          
          ${order.notes ? `<p>${order.notes}</p>` : ''}
          
          <p>If you have any questions or concerns, please don't hesitate to contact our office.</p>
          
          <p>Thank you for your continued trust in our care.</p>
        </div>
        
        <div class="signature-section">
          <p>Sincerely,</p>
          <br><br>
          <p>Practice Management</p>
        </div>
        
        <div class="footer">
          Generated on ${new Date().toLocaleDateString()} | Order: ${order.orderNumber}
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      }
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
