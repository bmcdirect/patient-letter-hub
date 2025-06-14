import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertPracticeSchema,
  insertTemplateSchema,
  insertLetterJobSchema,
  insertAddressSchema,
} from "@shared/schema";
import { z } from "zod";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Practice routes
  app.post('/api/practices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  // Stripe payment routes
  if (stripe) {
    app.post("/api/create-payment-intent", isAuthenticated, async (req: any, res) => {
      try {
        const { amount, credits } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
          metadata: {
            credits: credits.toString(),
            userId: req.user.claims.sub,
          },
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        res.status(500).json({ message: "Error creating payment intent: " + error.message });
      }
    });

    app.post("/api/confirm-payment", isAuthenticated, async (req: any, res) => {
      try {
        const { paymentIntentId, credits } = req.body;
        const userId = req.user.claims.sub;
        
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
          // Create payment record
          const payment = await storage.createPayment({
            userId,
            amount: (paymentIntent.amount / 100).toString(),
            stripeChargeId: paymentIntent.id,
            paymentType: 'credit_purchase',
            status: 'completed',
          });

          // Create credit bundle
          await storage.createCreditBundle({
            userId,
            credits,
            paymentId: payment.id,
          });

          // Update user's credit balance
          const user = await storage.getUser(userId);
          const newBalance = (user?.creditBalance || 0) + credits;
          await storage.updateUserCredits(userId, newBalance);

          res.json({ success: true, newBalance });
        } else {
          res.status(400).json({ message: "Payment not successful" });
        }
      } catch (error: any) {
        res.status(500).json({ message: "Error confirming payment: " + error.message });
      }
    });
  }

  // Seed data for templates (this would normally be in a migration)
  const seedTemplates = async () => {
    try {
      const existingTemplates = await storage.getTemplates();
      if (existingTemplates.length === 0) {
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
          await storage.createTemplate(template);
        }
      }
    } catch (error) {
      console.error("Error seeding templates:", error);
    }
  };

  // Seed templates on startup
  await seedTemplates();

  const httpServer = createServer(app);
  return httpServer;
}
