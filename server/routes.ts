import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertPracticeSchema,
  insertTemplateSchema,
  insertLetterJobSchema,
  insertAddressSchema,
} from "@shared/schema";
import { z } from "zod";

// Configure Multer for file uploads
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    cb(null, `${timestamp}-${basename}${extension}`);
  }
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Validate file types
    const allowedTypes = {
      logo: /\.(jpg|jpeg|png|gif)$/i,
      signature: /\.(jpg|jpeg|png|gif)$/i,
      extraPages: /\.pdf$/i,
      recipients: /\.csv$/i
    };
    
    const fieldType = file.fieldname as keyof typeof allowedTypes;
    const allowedExtensions = allowedTypes[fieldType];
    
    if (allowedExtensions && allowedExtensions.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${fieldType}. Expected: ${allowedExtensions}`));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Priority static file routes - these must come before any other middleware
  app.get('/order.html', (req: Request, res: Response) => {
    const filePath = path.resolve(process.cwd(), 'client/src/order.html');
    console.log(`Serving order.html from: ${filePath}`);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error serving order.html:', err);
        res.status(404).send('File not found');
      }
    });
  });
  
  app.get('/login.html', (req: Request, res: Response) => {
    const filePath = path.resolve(process.cwd(), 'client/src/login.html');
    console.log(`Serving login.html from: ${filePath}`);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error serving login.html:', err);
        res.status(404).send('File not found');
      }
    });
  });
  
  app.get('/submit_order.js', (req: Request, res: Response) => {
    const filePath = path.resolve(process.cwd(), 'client/src/submit_order.js');
    console.log(`Serving submit_order.js from: ${filePath}`);
    res.type('application/javascript');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error serving submit_order.js:', err);
        res.status(404).send('File not found');
      }
    });
  });
  
  app.get('/sample/recipients.csv', (req: Request, res: Response) => {
    const filePath = path.resolve(process.cwd(), 'client/src/sample/recipients.csv');
    console.log(`Serving recipients.csv from: ${filePath}`);
    res.type('text/csv');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error serving recipients.csv:', err);
        res.status(404).send('File not found');
      }
    });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let user;
      
      try {
        user = await storage.getUser(userId);
      } catch (dbError) {
        console.error("Database error fetching user, using session data:", dbError);
        // Fallback to session data if database is unavailable
        user = {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          profileImageUrl: null,
          creditBalance: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        };
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Practice routes
  app.post('/api/practices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const practiceData = insertPracticeSchema.parse({ ...req.body, ownerId: userId });
      const practice = await storage.createPractice(practiceData);
      res.json(practice);
    } catch (error) {
      console.error("Error creating practice:", error);
      res.status(400).json({ message: "Invalid practice data" });
    }
  });

  app.get('/api/practices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const practices = await storage.getUserPractices(userId);
      res.json(practices);
    } catch (error) {
      console.error("Error fetching practices:", error);
      res.status(500).json({ message: "Failed to fetch practices" });
    }
  });

  app.get('/api/practices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const practiceId = parseInt(req.params.id);
      const practice = await storage.getPractice(practiceId);
      if (!practice) {
        return res.status(404).json({ message: "Practice not found" });
      }
      res.json(practice);
    } catch (error) {
      console.error("Error fetching practice:", error);
      res.status(500).json({ message: "Failed to fetch practice" });
    }
  });

  // Template routes
  app.get('/api/templates', async (req, res) => {
    try {
      const { eventType, discipline } = req.query;
      const templates = await storage.getTemplates({
        eventType: eventType as string,
        discipline: discipline as string,
      });
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get('/api/templates/:id', async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  // Letter job routes
  app.post('/api/letter-jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const jobData = insertLetterJobSchema.parse({ ...req.body, createdBy: userId });
      const job = await storage.createLetterJob(jobData);
      res.json(job);
    } catch (error) {
      console.error("Error creating letter job:", error);
      res.status(400).json({ message: "Invalid letter job data" });
    }
  });

  app.get('/api/letter-jobs/:id', isAuthenticated, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getLetterJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Letter job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching letter job:", error);
      res.status(500).json({ message: "Failed to fetch letter job" });
    }
  });

  app.get('/api/practices/:practiceId/letter-jobs', isAuthenticated, async (req, res) => {
    try {
      const practiceId = parseInt(req.params.practiceId);
      const jobs = await storage.getPracticeLetterJobs(practiceId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching practice letter jobs:", error);
      res.status(500).json({ message: "Failed to fetch letter jobs" });
    }
  });

  // Address upload and validation
  app.post('/api/letter-jobs/:jobId/addresses', isAuthenticated, async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const addressesData = z.array(insertAddressSchema).parse(
        req.body.addresses.map((addr: any) => ({ ...addr, letterJobId: jobId }))
      );
      
      const addresses = await storage.createAddresses(addressesData);
      
      // Simulate address validation (in real app, this would call USPS/Smarty Streets)
      for (const address of addresses) {
        const isValid = Math.random() > 0.1; // 90% validation rate
        await storage.updateAddressValidation(address.id, isValid, isValid ? 'Y' : 'N');
      }
      
      res.json({ addresses, validCount: addresses.filter(() => Math.random() > 0.1).length });
    } catch (error) {
      console.error("Error uploading addresses:", error);
      res.status(400).json({ message: "Invalid address data" });
    }
  });

  // Cost calculation
  app.post('/api/letter-jobs/:jobId/calculate-cost', isAuthenticated, async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const { certified = false, pages = 1 } = req.body;
      
      const addresses = await storage.getJobAddresses(jobId);
      const validAddresses = addresses.filter(addr => addr.isValid);
      
      const baseCost = 0.68; // Base postage + printing
      const certifiedCost = certified ? 4.10 : 0;
      const pageCost = (pages - 1) * 0.05;
      
      const costPerLetter = baseCost + certifiedCost + pageCost;
      const totalCost = validAddresses.length * costPerLetter;
      const creditsNeeded = Math.ceil(totalCost);
      
      res.json({
        validRecipients: validAddresses.length,
        totalRecipients: addresses.length,
        costPerLetter,
        totalCost,
        creditsNeeded,
        breakdown: {
          postage: baseCost,
          certified: certifiedCost,
          extraPages: pageCost,
        }
      });
    } catch (error) {
      console.error("Error calculating cost:", error);
      res.status(500).json({ message: "Failed to calculate cost" });
    }
  });

  // Dashboard stats
  app.get('/api/practices/:practiceId/dashboard-stats', isAuthenticated, async (req, res) => {
    try {
      const practiceId = parseInt(req.params.practiceId);
      const stats = await storage.getDashboardStats(practiceId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Compliance alerts
  app.get('/api/alerts', async (req, res) => {
    try {
      const { taxonomy } = req.query;
      const alerts = await storage.getActiveAlerts(taxonomy as string);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // File upload order processing
  app.post('/api/orders', isAuthenticated, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'extraPages', maxCount: 1 },
    { name: 'recipients', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const { template, letterBody, colorMode } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Extract file paths
      const logoPath = files.logo?.[0]?.path;
      const signaturePath = files.signature?.[0]?.path;
      const extraPagesPath = files.extraPages?.[0]?.path;
      const recipientsPath = files.recipients?.[0]?.path;
      
      // Create letter job entry
      const letterJob = await storage.createLetterJob({
        practiceId: 1, // Default practice ID for now
        createdBy: req.user.id,
        templateType: 'custom',
        status: 'draft',
        bodyHtml: letterBody,
        logoPath,
        signaturePath,
        extraPagesPath,
        recipientsPath,
        colorMode,
        eventData: { template }
      });
      
      res.json({ job_id: letterJob.id });
    } catch (error) {
      console.error("Error processing order:", error);
      res.status(500).json({ message: "Failed to process order" });
    }
  });

  // Seed data for templates (this would normally be in a migration)
  const seedTemplates = async () => {
    try {
      console.log("Checking for existing templates...");
      const existingTemplates = await storage.getTemplates();
      console.log(`Found ${existingTemplates.length} existing templates`);
      
      if (existingTemplates.length === 0) {
        console.log("Seeding default templates...");
        const defaultTemplates = [
          {
            name: "Practice Relocation",
            disciplineList: ["Medical", "Dental"],
            eventType: "relocation",
            bodyHtml: `<p>Dear {{FirstName}},</p>
              <p>We are writing to inform you that {{PracticeName}} will be relocating to a new facility.</p>
              <p>Our new address will be:</p>
              <p><strong>{{NewAddress}}</strong></p>
              <p><strong>Phone: {{NewPhone}}</strong></p>
              <p>This change will be effective on {{EffectiveDate}}. All appointments scheduled after this date will take place at our new location.</p>
              <p>We look forward to continuing to provide you with excellent healthcare at our new facility.</p>
              <p>Sincerely,<br>{{DoctorName}}<br>{{PracticeName}}</p>`,
            language: "en",
            requiredFields: ["NewAddress", "NewPhone", "EffectiveDate"],
            isActive: true,
          },
          {
            name: "Practice Closure",
            disciplineList: ["Medical", "Dental", "Chiropractic"],
            eventType: "closure",
            bodyHtml: `<p>Dear {{FirstName}},</p>
              <p>We regret to inform you that {{PracticeName}} will be permanently closing on {{ClosureDate}}.</p>
              <p>Your medical records will be maintained for the legally required period. If you would like copies of your records or would like them transferred to another provider, please contact us at {{Phone}} by {{RecordDeadline}}.</p>
              <p>We want to thank you for allowing us to provide your healthcare over the years.</p>
              <p>Sincerely,<br>{{DoctorName}}<br>{{PracticeName}}</p>`,
            language: "en",
            requiredFields: ["ClosureDate", "RecordDeadline"],
            isActive: true,
          },
          {
            name: "HIPAA Breach Notification",
            disciplineList: ["Medical", "Dental", "Chiropractic", "Physical Therapy"],
            eventType: "hipaa_breach",
            bodyHtml: `<p>Dear {{FirstName}},</p>
              <p>We are writing to notify you of a breach of your protected health information that occurred at {{PracticeName}}.</p>
              <p><strong>What Happened:</strong> {{BreachDescription}}</p>
              <p><strong>Information Involved:</strong> {{InformationInvolved}}</p>
              <p><strong>What We Are Doing:</strong> {{ResponseActions}}</p>
              <p><strong>What You Can Do:</strong> {{RecommendedActions}}</p>
              <p>If you have any questions, please contact us at {{Phone}}.</p>
              <p>Sincerely,<br>{{DoctorName}}<br>{{PracticeName}}</p>`,
            language: "en",
            requiredFields: ["BreachDescription", "InformationInvolved", "ResponseActions", "RecommendedActions"],
            isActive: true,
          }
        ];

        for (const template of defaultTemplates) {
          try {
            await storage.createTemplate(template);
            console.log(`Created template: ${template.name}`);
          } catch (templateError) {
            console.error(`Error creating template ${template.name}:`, templateError);
          }
        }
        console.log("Template seeding completed");
      } else {
        console.log("Templates already exist, skipping seeding");
      }
    } catch (error) {
      console.error("Error during template seeding process:", error);
      // Don't throw - allow the server to start even if template seeding fails
    }
  };

  // Seed templates on startup (but don't block server startup if it fails)
  seedTemplates().catch(error => {
    console.error("Template seeding failed, but server will continue:", error);
  });

  const httpServer = createServer(app);
  return httpServer;
}
