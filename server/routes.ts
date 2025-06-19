import express, { Express, Request, Response } from 'express';
import { createServer, Server } from 'http';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { insertLetterJobSchema, insertAddressSchema, insertTemplateSchema } from '../shared/schema';
import { storage } from './storage';
import { isAuthenticated } from './replitAuth';

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
      cb(new Error('Invalid file type'), false);
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
      const practices = await storage.getUserPractices(user.id);
      
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
        ownerId: req.user?.id
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
      const practices = await storage.getUserPractices(req.user!.id);
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
        createdBy: req.user?.id,
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

  // Order submission route
  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const {
        templateType,
        subject,
        bodyHtml,
        totalRecipients,
        validRecipients,
        logoPath,
        signaturePath,
        extraPagesPath,
        recipientsPath,
        colorMode,
        eventType,
        eventData
      } = req.body;

      // For now, we'll use practice ID 1 and a default user
      // In production, this would come from authentication
      const practiceId = 1;
      const createdBy = 'dev-user-1750356001255';

      const letterJobData = {
        practiceId,
        createdBy,
        templateType: templateType || 'custom',
        status: 'draft',
        eventType: eventType || 'custom',
        subject: subject || 'Patient Notification',
        bodyHtml: bodyHtml || '<p>Default letter content</p>',
        totalRecipients: parseInt(totalRecipients) || 0,
        validRecipients: parseInt(validRecipients) || 0,
        logoPath,
        signaturePath,
        extraPagesPath,
        recipientsPath,
        colorMode: colorMode || 'bw',
        eventData: eventData ? JSON.stringify(eventData) : '{}',
        scheduledDatetime: null,
        mailedAt: null
      };

      const job = await storage.createLetterJob(letterJobData);
      
      res.json({
        success: true,
        jobId: job.id,
        message: 'Order submitted successfully'
      });
    } catch (error) {
      console.error('Order submission error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to submit order' 
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
      const baseCost = job.totalRecipients * 1.25; // $1.25 per letter
      const colorSurcharge = job.colorMode === 'color' ? job.totalRecipients * 0.50 : 0;
      const totalCost = baseCost + colorSurcharge;

      const orderDetails = {
        orderId: job.id,
        status: job.status,
        subject: job.subject,
        eventType: job.eventType,
        templateType: job.templateType,
        colorMode: job.colorMode,
        recipients: {
          total: job.totalRecipients,
          valid: job.validRecipients,
          invalid: job.totalRecipients - job.validRecipients
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

  // Seed templates on startup (but don't block server startup if it fails)
  seedTemplates().catch(error => {
    console.error("Template seeding failed, but server will continue:", error);
  });

  const httpServer = createServer(app);
  return httpServer;
}