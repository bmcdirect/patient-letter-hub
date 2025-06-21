import express, { Express, Request, Response } from 'express';
import { createServer, Server } from 'http';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import puppeteer from 'puppeteer';
import { insertLetterJobSchema, insertAddressSchema, insertTemplateSchema } from '../shared/schema';
import { storage } from './storage';
import { isAuthenticated } from './replitAuth';
import { pool } from './db';

// Configure multer for file uploads
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow CSV files and common image formats
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Template seeding function
async function seedTemplates() {
  console.log("Checking for existing templates...");
  
  const existingTemplates = await storage.getTemplates();
  
  if (existingTemplates.length > 0) {
    console.log(`Found ${existingTemplates.length} existing templates`);
    console.log("Templates already exist, skipping seeding");
    return;
  }
  
  const defaultTemplates = [
    {
      name: "Practice Closure Notification",
      eventType: "practice_closure",
      discipline: "General",
      bodyHtml: `<p>Dear {{patient_name}},</p>
      
<p>We are writing to inform you that {{practice_name}} will be permanently closing on {{closure_date}}.</p>

<p>We want to ensure continuity of your medical care. Your medical records will be retained and available for transfer to your new healthcare provider.</p>

<p>To request your medical records:</p>
<ul>
<li>Call us at {{practice_phone}}</li>
<li>Visit our office at {{practice_address}}</li>
<li>Complete our medical records request form</li>
</ul>

<p>Thank you for allowing us to serve your healthcare needs.</p>

<p>Sincerely,<br>{{doctor_name}}<br>{{practice_name}}</p>`,
      isDefault: true
    },
    {
      name: "Doctor Retirement Notice",
      eventType: "doctor_retirement", 
      discipline: "General",
      bodyHtml: `<p>Dear {{patient_name}},</p>

<p>After many years of practicing medicine, I have decided to retire from active practice. My last day of seeing patients will be {{retirement_date}}.</p>

<p>It has been an honor and privilege to serve as your physician. I want to ensure a smooth transition of your care.</p>

<p>Your medical records will be transferred to:</p>
<p><strong>{{new_doctor_name}}</strong><br>
{{new_practice_name}}<br>
{{new_practice_address}}<br>
Phone: {{new_practice_phone}}</p>

<p>If you prefer to choose a different physician, please contact our office to arrange for your records to be transferred.</p>

<p>Thank you for your trust and confidence over the years.</p>

<p>Warmest regards,<br>{{doctor_name}}</p>`,
      isDefault: true
    },
    {
      name: "Practice Location Change",
      eventType: "practice_relocation",
      discipline: "General", 
      bodyHtml: `<p>Dear {{patient_name}},</p>

<p>We are excited to announce that {{practice_name}} is moving to a new location to better serve you!</p>

<p><strong>New Address:</strong><br>
{{new_address}}</p>

<p><strong>Effective Date:</strong> {{move_date}}</p>

<p>Our phone number will remain the same: {{practice_phone}}</p>

<p>The new facility will allow us to provide enhanced services and improved patient care. We look forward to seeing you at our new location.</p>

<p>If you have any questions about this transition, please don't hesitate to contact us.</p>

<p>Sincerely,<br>{{doctor_name}}<br>{{practice_name}}</p>`,
      isDefault: true
    }
  ];

  console.log("Seeding default templates...");
  for (const template of defaultTemplates) {
    try {
      await storage.createTemplate(template);
      console.log(`✓ Created template: ${template.name}`);
    } catch (error) {
      console.error(`✗ Failed to create template ${template.name}:`, error);
    }
  }
  
  console.log("Template seeding completed");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Get user's practices
      const practices = await storage.getUserPractices((user as any).id);
      
      res.json({ 
        user,
        practices: practices || []
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Practice routes
  app.post('/api/practices', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const practiceData = {
        ...req.body,
        ownerId: (req.user as any)?.id
      };

      const result = await storage.createPractice(practiceData);
      res.json(result);
    } catch (error) {
      console.error('Create practice error:', error);
      res.status(500).json({ message: 'Failed to create practice' });
    }
  });

  app.get('/api/practices', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const practices = await storage.getUserPractices((req.user as any).id);
      res.json(practices);
    } catch (error) {
      console.error('Get practices error:', error);
      res.status(500).json({ message: 'Failed to fetch practices' });
    }
  });

  // Template routes
  app.get('/api/templates', async (req: Request, res: Response) => {
    try {
      const { eventType, discipline } = req.query;
      const filters: any = {};
      
      if (eventType && typeof eventType === 'string') {
        filters.eventType = eventType;
      }
      if (discipline && typeof discipline === 'string') {
        filters.discipline = discipline;
      }

      const templates = await storage.getTemplates(filters);
      res.json(templates);
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  app.get('/api/templates/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid template ID' });
      }

      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      console.error('Get template error:', error);
      res.status(500).json({ message: 'Failed to fetch template' });
    }
  });

  app.post('/api/templates', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const templateSchema = insertTemplateSchema;
      const validatedData = templateSchema.parse(req.body);
      
      const template = await storage.createTemplate(validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error('Create template error:', error);
      res.status(500).json({ message: 'Failed to create template' });
    }
  });

  // Letter job routes
  app.post('/api/letter-jobs', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const jobData = {
        ...req.body,
        createdBy: (req.user as any)?.id,
        status: 'draft'
      };

      const job = await storage.createLetterJob(jobData);
      res.json(job);
    } catch (error) {
      console.error('Create letter job error:', error);
      res.status(500).json({ message: 'Failed to create letter job' });
    }
  });

  app.get('/api/letter-jobs/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }

      const job = await storage.getLetterJob(id);
      if (!job) {
        return res.status(404).json({ message: 'Letter job not found' });
      }

      res.json(job);
    } catch (error) {
      console.error('Get letter job error:', error);
      res.status(500).json({ message: 'Failed to fetch letter job' });
    }
  });

  app.get('/api/practices/:id/letter-jobs', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const practiceId = parseInt(req.params.id, 10);
      if (isNaN(practiceId)) {
        return res.status(400).json({ message: 'Invalid practice ID' });
      }

      const jobs = await storage.getPracticeLetterJobs(practiceId);
      res.json(jobs);
    } catch (error) {
      console.error('Get practice letter jobs error:', error);
      res.status(500).json({ message: 'Failed to fetch letter jobs' });
    }
  });

  // Dashboard stats
  app.get('/api/practices/:id/stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const practiceId = parseInt(req.params.id, 10);
      if (isNaN(practiceId)) {
        return res.status(400).json({ message: 'Invalid practice ID' });
      }

      const stats = await storage.getDashboardStats(practiceId);
      res.json(stats);
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  // Alerts
  app.get('/api/alerts', async (req: Request, res: Response) => {
    try {
      const { taxonomy } = req.query;
      const alerts = await storage.getActiveAlerts(
        taxonomy && typeof taxonomy === 'string' ? taxonomy : undefined
      );
      res.json(alerts);
    } catch (error) {
      console.error('Get alerts error:', error);
      res.status(500).json({ message: 'Failed to fetch alerts' });
    }
  });

  // File upload endpoints
  app.post('/api/upload/recipients', upload.single('recipients'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname;
      
      res.json({
        success: true,
        filePath: filePath,
        originalName: originalName,
        size: req.file.size
      });
    } catch (error) {
      console.error('Recipients upload error:', error);
      res.status(500).json({ message: 'File upload failed' });
    }
  });

  app.post('/api/upload/logo', upload.single('logo'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname;
      
      res.json({
        success: true,
        filePath: filePath,
        originalName: originalName,
        size: req.file.size
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ message: 'File upload failed' });
    }
  });

  app.post('/api/upload/signature', upload.single('signature'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname;
      
      res.json({
        success: true,
        filePath: filePath,
        originalName: originalName,
        size: req.file.size
      });
    } catch (error) {
      console.error('Signature upload error:', error);
      res.status(500).json({ message: 'File upload failed' });
    }
  });

  app.post('/api/upload/extra-pages', upload.single('extraPages'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname;
      
      res.json({
        success: true,
        filePath: filePath,
        originalName: originalName,
        size: req.file.size
      });
    } catch (error) {
      console.error('Extra pages upload error:', error);
      res.status(500).json({ message: 'File upload failed' });
    }
  });

  // Order submission route with file uploads
  app.post('/api/orders', upload.fields([
    { name: 'recipients', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'extraPages', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      console.log('=== ORDER SUBMISSION DEBUG ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Request files:', req.files);
      console.log('Content-Type:', req.headers['content-type']);
      
      const {
        templateType,
        subject,
        bodyHtml,
        totalRecipients,
        validRecipients,
        colorMode,
        eventType,
        eventData
      } = req.body;

      // Extract file paths from uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const logoPath = files?.logo?.[0]?.path;
      const signaturePath = files?.signature?.[0]?.path;
      const extraPagesPath = files?.extraPages?.[0]?.path;
      const recipientsPath = files?.recipients?.[0]?.path;

      console.log('Extracted file paths:', {
        logoPath,
        signaturePath,
        extraPagesPath,
        recipientsPath
      });

      // Insert into orders table with retry logic
      let result;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`Orders table insert attempt ${attempts}/${maxAttempts}`);
          
          const queryResult = await pool.query(`
            INSERT INTO orders (template_type, subject, body_html, total_recipients, valid_recipients, color_mode, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
          `, [
            templateType || 'custom',
            subject || 'Patient Notification',
            bodyHtml || '<p>Default letter content</p>',
            parseInt(totalRecipients) || 0,
            parseInt(validRecipients) || 0,
            colorMode || 'bw',
            'Pending'
          ]);
          
          result = queryResult.rows[0];
          break;
        } catch (dbError: any) {
          console.error(`Database attempt ${attempts} failed:`, dbError);
          if (attempts === maxAttempts) {
            throw dbError;
          }
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!result) {
        throw new Error('Failed to create order after all attempts');
      }

      const orderId = result.id;

      console.log('Order created successfully with ID:', orderId);
      
      res.json({
        success: true,
        message: 'Order submitted successfully',
        orderId: orderId,
        status: 'Pending',
        totalCost: 0,
        redirectUrl: `/?confirmation=${orderId}`
      });
    } catch (error: any) {
      console.error('Order submission error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        success: false,
        message: 'Failed to submit order' 
      });
    }
  });

  // Get recent orders endpoint
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT id as "jobId", subject, created_at as "createdAt", status
        FROM orders
        ORDER BY created_at DESC
        LIMIT 20
      `);

      res.json({
        success: true,
        orders: result.rows
      });
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: error.message
      });
    }
  });

  // Get order details endpoint
  app.get('/api/orders/:jobId', async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      
      if (isNaN(jobId)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }

      const job = await storage.getLetterJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Get practice details
      const practice = await storage.getPractice(job.practiceId);

      // Calculate costs (simplified for now)
      const totalRecipients = job.totalRecipients || 0;
      const validRecipients = job.validRecipients || 0;
      const baseCost = totalRecipients * 1.25; // $1.25 per letter
      const colorSurcharge = job.colorMode === 'color' ? totalRecipients * 0.50 : 0;
      const totalCost = baseCost + colorSurcharge;

      const orderDetails = {
        orderId: job.id,
        status: job.status,
        subject: job.subject,
        eventType: job.eventType,
        templateType: job.templateType,
        colorMode: job.colorMode,
        recipients: {
          total: totalRecipients,
          valid: validRecipients,
          invalid: totalRecipients - validRecipients
        },
        costs: {
          baseCost: baseCost.toFixed(2),
          colorSurcharge: colorSurcharge.toFixed(2),
          totalCost: totalCost.toFixed(2)
        },
        files: {
          recipientsFile: job.recipientsPath,
          logoFile: job.logoPath,
          signatureFile: job.signaturePath,
          extraPagesFile: job.extraPagesPath
        },
        practice: practice ? {
          name: practice.name,
          address: practice.address,
          phone: practice.phone
        } : null,
        createdAt: job.createdAt,
        scheduledDatetime: job.scheduledDatetime,
        mailedAt: job.mailedAt
      };

      res.json(orderDetails);
    } catch (error) {
      console.error('Get order details error:', error);
      res.status(500).json({ message: 'Failed to fetch order details' });
    }
  });

  // Static file routes for legacy HTML pages
  app.get('/order.html', (req: Request, res: Response) => {
    const filePath = path.join(process.cwd(), 'public', 'order.html');
    res.sendFile(filePath);
  });

  app.get('/login.html', (req: Request, res: Response) => {
    const filePath = path.join(process.cwd(), 'public', 'login.html');
    res.sendFile(filePath);
  });

  app.get('/submit_order.js', (req: Request, res: Response) => {
    const filePath = path.join(process.cwd(), 'public', 'submit_order.js');
    res.sendFile(filePath);
  });

  app.get('/sample/recipients.csv', (req: Request, res: Response) => {
    const csvContent = `First Name,Last Name,Address Line 1,Address Line 2,City,State,ZIP Code
John,Doe,123 Main St,,Anytown,ST,12345
Jane,Smith,456 Oak Ave,Apt 2B,Springfield,ST,67890
Bob,Johnson,789 Pine Rd,,Hometown,ST,11111`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_recipients.csv"');
    res.send(csvContent);
  });

  // PDF generation route
  app.get('/api/orders/:jobId/pdf', async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      
      if (isNaN(jobId)) {
        return res.status(400).json({ message: 'Invalid job ID' });
      }

      // Add retry logic for database operations
      let job: any = null;
      let practice: any = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`PDF generation attempt ${attempt} for job ${jobId}`);
          job = await storage.getLetterJob(jobId);
          
          if (!job) {
            return res.status(404).json({ message: 'Job not found' });
          }

          // Get practice details for letterhead
          practice = await storage.getPractice(job.practiceId);
          break; // Success, exit retry loop
          
        } catch (dbError) {
          console.error(`Database attempt ${attempt} failed:`, dbError);
          if (attempt === 3) {
            throw dbError; // Last attempt failed, throw the error
          }
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Ensure job exists after retry loop
      if (!job) {
        return res.status(404).json({ message: 'Job not found after retries' });
      }

      console.log('Launching puppeteer for PDF generation...');
      const browser = await puppeteer.launch({ 
        headless: true,
        executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      });
      const page = await browser.newPage();

      // Create better fallback content for jobs with minimal data
      const fallbackContent = job.bodyHtml || `
        <p><strong>Job ID:</strong> ${jobId}</p>
        <p><strong>Status:</strong> ${job.status || 'Draft'}</p>
        <p><strong>Event Type:</strong> ${job.eventType || 'Custom'}</p>
        <p><strong>Total Recipients:</strong> ${job.totalRecipients || 0}</p>
        <p><strong>Created:</strong> ${job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Unknown'}</p>
        <p>This is a test PDF generation for PatientLetterHub.</p>
      `;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 2rem; 
                line-height: 1.6;
                color: #333;
              }
              .letterhead {
                border-bottom: 2px solid #007bff;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
              }
              .practice-name {
                font-size: 1.5rem;
                font-weight: bold;
                color: #007bff;
              }
              .practice-info {
                margin-top: 0.5rem;
                color: #666;
              }
              .logo { 
                max-width: 200px; 
                margin-bottom: 1rem;
              }
              .letter-content {
                margin: 2rem 0;
              }
              .signature { 
                margin-top: 2rem; 
                max-width: 150px; 
              }
              .footer {
                margin-top: 3rem;
                padding-top: 1rem;
                border-top: 1px solid #ddd;
                font-size: 0.9rem;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="letterhead">
              <div class="practice-name">${practice?.name || 'Healthcare Practice'}</div>
              <div class="practice-info">
                ${practice?.address || '123 Main St, Anytown, ST 12345'}<br>
                ${practice?.phone || '555-0123'}<br>
                NPI: ${practice?.npi || '1234567890'}
              </div>
            </div>
            
            <div class="letter-content">
              <h2>${job.subject || 'Patient Communication'}</h2>
              <div>${fallbackContent}</div>
            </div>
            
            <div class="footer">
              <p>Generated on ${new Date().toLocaleDateString()}</p>
              <p>Job ID: ${jobId} | Event Type: ${job.eventType || 'N/A'}</p>
              <p>PatientLetterHub - Healthcare Communication Platform</p>
            </div>
          </body>
        </html>
      `;

      console.log('Setting HTML content for PDF...');
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
      
      console.log('Generating PDF...');
      const pdfBuffer = await page.pdf({ 
        format: 'A4',
        margin: {
          top: '1in',
          bottom: '1in',
          left: '0.75in',
          right: '0.75in'
        }
      });

      console.log('Closing browser...');
      await browser.close();

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="letter-job-${jobId}.pdf"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache'
      });
      res.send(pdfBuffer);

    } catch (error) {
      console.error('PDF generation failed:', error);
      res.status(500).json({ message: 'PDF generation failed' });
    }
  });

  // Seed templates on startup (but don't block server startup if it fails)
  seedTemplates().catch(error => {
    console.error("Template seeding failed, but server will continue:", error);
  });

  const httpServer = createServer(app);
  return httpServer;
}
