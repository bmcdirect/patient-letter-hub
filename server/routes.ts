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
import bcrypt from 'bcryptjs';

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

// Authentication middleware
const requireLogin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  next();
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  await seedTemplates();

  // User Registration endpoint
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, is_admin',
        [email.toLowerCase(), passwordHash]
      );

      const user = result.rows[0];

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          is_admin: user.is_admin
        }
      });

    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration'
      });
    }
  });

  // User Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user by email
      const result = await pool.query(
        'SELECT id, email, password_hash, is_admin FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const user = result.rows[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Store user in session
      req.session.user = {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin
      };

      res.json({
        success: true,
        user: {
          email: user.email,
          is_admin: user.is_admin
        }
      });

    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  });

  // User Logout endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({
          success: false,
          message: 'Server error during logout'
        });
      }
      res.json({ success: true });
    });
  });

  // Quote management endpoints
  app.post('/api/quotes', requireLogin, async (req: Request, res: Response) => {
    try {
      const { subject, templateType, colorMode, estimatedRecipients, enclosures, practice_id, notes } = req.body;

      if (!subject || !templateType || !colorMode || !estimatedRecipients) {
        return res.status(400).json({
          success: false,
          message: 'Subject, template type, color mode, and estimated recipients are required'
        });
      }

      const result = await pool.query(`
        INSERT INTO quotes (user_id, subject, template_type, color_mode, estimated_recipients, enclosures, practice_id, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at
      `, [
        req.user.id,
        subject,
        templateType,
        colorMode,
        parseInt(estimatedRecipients),
        parseInt(enclosures) || 0,
        practice_id || null,
        notes || null
      ]);

      const quote = result.rows[0];
      const quoteNumber = `Q-${1000 + quote.id}`;

      // Calculate cost
      const baseRate = colorMode === 'color' ? 0.65 : 0.50;
      const enclosureRate = 0.10;
      const costPerRecipient = baseRate + ((parseInt(enclosures) || 0) * enclosureRate);
      const totalEstimate = costPerRecipient * parseInt(estimatedRecipients);

      res.json({
        success: true,
        message: 'Quote generated successfully',
        quoteId: quote.id,
        quoteNumber: quoteNumber,
        totalEstimate: totalEstimate
      });

    } catch (error: any) {
      console.error('Quote creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate quote'
      });
    }
  });

  app.get('/api/quotes', requireLogin, async (req: Request, res: Response) => {
    try {
      let query = `
        SELECT q.id, q.subject, q.template_type, q.color_mode, q.estimated_recipients, 
               q.enclosures, q.notes, q.created_at, q.converted_order_id, p.name as practice_name
        FROM quotes q
        LEFT JOIN practices p ON q.practice_id = p.id
      `;
      let params = [];

      // Filter quotes by user unless admin
      if (!req.user.is_admin) {
        query += ` WHERE q.user_id = $1`;
        params.push(req.user.id);
      }

      query += ` ORDER BY q.created_at DESC`;

      const result = await pool.query(query, params);

      const quotes = result.rows.map(quote => {
        const baseRate = quote.color_mode === 'color' ? 0.65 : 0.50;
        const enclosureRate = 0.10;
        const costPerRecipient = baseRate + ((quote.enclosures || 0) * enclosureRate);
        const totalEstimate = costPerRecipient * quote.estimated_recipients;

        return {
          ...quote,
          quoteNumber: `Q-${1000 + quote.id}`,
          totalEstimate: totalEstimate
        };
      });

      res.json({
        success: true,
        quotes: quotes
      });

    } catch (error: any) {
      console.error('Failed to fetch quotes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quotes'
      });
    }
  });

  app.get('/api/quotes/:id/pdf', requireLogin, async (req: Request, res: Response) => {
    try {
      const quoteId = parseInt(req.params.id, 10);
      
      if (isNaN(quoteId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quote ID"
        });
      }

      let query = `
        SELECT q.id, q.subject, q.template_type, q.color_mode, q.estimated_recipients, 
               q.enclosures, q.notes, q.created_at, p.name as practice_name,
               u.email as user_email
        FROM quotes q
        LEFT JOIN practices p ON q.practice_id = p.id
        LEFT JOIN users u ON q.user_id = u.id
        WHERE q.id = $1
      `;
      let params = [quoteId];

      // Add user filter for non-admin users
      if (!req.user.is_admin) {
        query += ` AND q.user_id = $2`;
        params.push(req.user.id);
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Quote not found or access denied"
        });
      }

      const quote = result.rows[0];
      const quoteNumber = `Q-${1000 + quote.id}`;
      
      // Calculate costs
      const baseRate = quote.color_mode === 'color' ? 0.65 : 0.50;
      const enclosureRate = 0.10;
      const costPerRecipient = baseRate + ((quote.enclosures || 0) * enclosureRate);
      const totalEstimate = costPerRecipient * quote.estimated_recipients;
      
      // Generate quote HTML
      const quoteHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Quote ${quoteNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
            .company-name { color: #007bff; font-size: 28px; font-weight: bold; margin: 0; }
            .quote-title { color: #666; font-size: 24px; margin: 10px 0 0 0; }
            .quote-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-section { flex: 1; margin-right: 20px; }
            .info-section:last-child { margin-right: 0; }
            .info-section h3 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; padding: 3px 0; }
            .info-label { font-weight: 600; }
            .info-value { text-align: right; }
            .cost-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .cost-section h3 { margin-top: 0; color: #333; }
            .cost-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0; }
            .cost-total { border-top: 2px solid #007bff; padding-top: 10px; margin-top: 15px; font-weight: bold; font-size: 18px; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
            .notes-section { margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="company-name">PatientLetterHub</h1>
            <h2 class="quote-title">Quote ${quoteNumber}</h2>
          </div>
          
          <div class="quote-info">
            <div class="info-section">
              <h3>Quote Information</h3>
              <div class="info-row">
                <span class="info-label">Quote Number:</span>
                <span class="info-value">${quoteNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${new Date(quote.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Subject:</span>
                <span class="info-value">${quote.subject}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Template Type:</span>
                <span class="info-value">${quote.template_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </div>
            </div>
            
            <div class="info-section">
              <h3>Customer Information</h3>
              <div class="info-row">
                <span class="info-label">Practice:</span>
                <span class="info-value">${quote.practice_name || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${quote.user_email}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Estimated Recipients:</span>
                <span class="info-value">${quote.estimated_recipients}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Color Mode:</span>
                <span class="info-value">${quote.color_mode === 'color' ? 'Color' : 'Black & White'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Enclosures:</span>
                <span class="info-value">${quote.enclosures || 0}</span>
              </div>
            </div>
          </div>
          
          ${quote.notes ? `
          <div class="notes-section">
            <h3>Additional Notes</h3>
            <p>${quote.notes}</p>
          </div>
          ` : ''}
          
          <div class="cost-section">
            <h3>Cost Estimate</h3>
            <div class="cost-row">
              <span>Base rate (${quote.color_mode === 'color' ? 'Color' : 'Black & White'}):</span>
              <span>$${baseRate.toFixed(2)} per letter</span>
            </div>
            <div class="cost-row">
              <span>Enclosures (${quote.enclosures || 0}):</span>
              <span>$${((quote.enclosures || 0) * enclosureRate).toFixed(2)} per letter</span>
            </div>
            <div class="cost-row">
              <span>Cost per recipient:</span>
              <span>$${costPerRecipient.toFixed(2)}</span>
            </div>
            <div class="cost-row">
              <span>Estimated recipients:</span>
              <span>${quote.estimated_recipients}</span>
            </div>
            <div class="cost-row cost-total">
              <span>Total Estimated Cost:</span>
              <span>$${totalEstimate.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>This is a cost estimate only. Final pricing may vary based on actual requirements.</p>
            <p>Quote valid for 30 days from date of issue.</p>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </body>
        </html>
      `;

      // Generate PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(quoteHtml, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      
      await browser.close();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Quote-${quoteNumber}.pdf"`);
      res.send(pdf);

    } catch (error: any) {
      console.error('Quote PDF generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate quote PDF'
      });
    }
  });

  // Convert quote to order endpoint
  app.post('/api/quotes/:id/convert', requireLogin, async (req: Request, res: Response) => {
    try {
      const quoteId = parseInt(req.params.id, 10);
      
      if (isNaN(quoteId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid quote ID"
        });
      }

      // Get quote details with access control
      let quoteQuery = `
        SELECT q.id, q.subject, q.template_type, q.color_mode, q.estimated_recipients, 
               q.enclosures, q.practice_id, q.user_id, q.converted_order_id
        FROM quotes q
        WHERE q.id = $1
      `;
      let quoteParams = [quoteId];

      // Add user filter for non-admin users
      if (!req.user.is_admin) {
        quoteQuery += ` AND q.user_id = $2`;
        quoteParams.push(req.user.id);
      }

      const quoteResult = await pool.query(quoteQuery, quoteParams);

      if (quoteResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Quote not found or access denied"
        });
      }

      const quote = quoteResult.rows[0];

      // Check if quote has already been converted
      if (quote.converted_order_id) {
        return res.status(400).json({
          success: false,
          message: "Quote has already been converted to an order",
          existingOrderId: quote.converted_order_id
        });
      }

      const quoteNumber = `Q-${1000 + quote.id}`;
      
      // Create new order from quote
      const orderResult = await pool.query(`
        INSERT INTO orders (
          template_type, subject, body_html, total_recipients, valid_recipients, 
          color_mode, status, production_start_date, production_end_date, 
          user_id, practice_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', $8, $9)
        RETURNING id
      `, [
        quote.template_type,
        `Quote Conversion - ${quoteNumber}: ${quote.subject}`,
        '<p>This order was converted from a quote. Please review and update content as needed.</p>',
        quote.estimated_recipients,
        quote.estimated_recipients,
        quote.color_mode,
        'Pending',
        quote.user_id,
        quote.practice_id
      ]);

      const newOrderId = orderResult.rows[0].id;

      // Update quote to mark as converted
      await pool.query(`
        UPDATE quotes 
        SET converted_order_id = $1 
        WHERE id = $2
      `, [newOrderId, quoteId]);

      res.json({
        success: true,
        message: 'Quote converted to order successfully',
        orderId: newOrderId,
        quoteNumber: quoteNumber,
        redirectUrl: `/?confirmation=${newOrderId}`
      });

    } catch (error: any) {
      console.error('Quote conversion error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to convert quote to order'
      });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', (req: Request, res: Response) => {
    if (req.session?.user) {
      res.json({
        success: true,
        user: {
          email: req.session.user.email,
          is_admin: req.session.user.is_admin
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
  });

  // Practice management endpoints
  app.post('/api/practices', requireLogin, async (req: Request, res: Response) => {
    try {
      const { name, email, phone, address, city, state, zipCode, npi, taxonomy } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Practice name is required'
        });
      }

      const result = await pool.query(`
        INSERT INTO practices (name, email, phone, address, city, state, zip_code, npi, taxonomy, owner_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, name, email, phone, address, city, state, zip_code, npi, taxonomy, created_at
      `, [name, email || null, phone || null, address || null, city || null, state || null, zipCode || null, npi || null, taxonomy || null, req.user.id]);

      const practice = result.rows[0];

      res.status(201).json({
        success: true,
        message: 'Practice created successfully',
        practice: practice
      });

    } catch (error: any) {
      console.error('Practice creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create practice'
      });
    }
  });

  app.get('/api/practices', requireLogin, async (req: Request, res: Response) => {
    try {
      let query = `
        SELECT id, name, email, phone, address, city, state, zip_code, npi, taxonomy, created_at 
        FROM practices 
      `;
      let params = [];

      // Filter practices by user unless admin
      if (!req.user.is_admin) {
        query += ` WHERE owner_id = $1`;
        params.push(req.user.id);
      }

      query += ` ORDER BY o.created_at DESC`;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        practices: result.rows
      });

    } catch (error: any) {
      console.error('Failed to fetch practices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch practices'
      });
    }
  });

  app.get('/api/practices/:id', requireLogin, async (req: Request, res: Response) => {
    try {
      const practiceId = parseInt(req.params.id, 10);

      if (isNaN(practiceId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid practice ID'
        });
      }

      const result = await pool.query(`
        SELECT id, name, contact_email, phone, address_line1, address_line2, city, state, zip, created_at
        FROM practices
        WHERE id = $1
      `, [practiceId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Practice not found'
        });
      }

      res.json({
        success: true,
        practice: result.rows[0]
      });

    } catch (error: any) {
      console.error('Failed to fetch practice:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch practice details'
      });
    }
  });

  app.put('/api/orders/:id/practice', requireLogin, async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      const { practice_id } = req.body;

      if (isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order ID'
        });
      }

      if (practice_id !== null && (isNaN(parseInt(practice_id)) || parseInt(practice_id) <= 0)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid practice ID'
        });
      }

      // Check if order exists and user has access
      let orderQuery = `
        SELECT id FROM orders WHERE id = $1
      `;
      let orderParams = [orderId];

      if (!req.user.is_admin) {
        orderQuery += ` AND user_id = $2`;
        orderParams.push(req.user.id);
      }

      const orderResult = await pool.query(orderQuery, orderParams);

      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found or access denied'
        });
      }

      // If practice_id is provided, verify it exists
      if (practice_id !== null) {
        const practiceResult = await pool.query('SELECT id FROM practices WHERE id = $1', [practice_id]);
        if (practiceResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Practice not found'
          });
        }
      }

      // Update the order
      await pool.query(`
        UPDATE orders 
        SET practice_id = $1 
        WHERE id = $2
      `, [practice_id, orderId]);

      res.json({
        success: true,
        message: 'Practice assignment updated successfully'
      });

    } catch (error: any) {
      console.error('Failed to assign practice to order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign practice to order'
      });
    }
  });

  // Auth routes (legacy Replit auth)
  app.get('/api/auth/user-legacy', isAuthenticated, async (req: Request, res: Response) => {
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
            INSERT INTO orders (template_type, subject, body_html, total_recipients, valid_recipients, color_mode, status, production_start_date, production_end_date, user_id, practice_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', $8, $9)
            RETURNING id
          `, [
            templateType || 'custom',
            subject || 'Patient Notification',
            bodyHtml || '<p>Default letter content</p>',
            parseInt(totalRecipients) || 0,
            parseInt(validRecipients) || 0,
            colorMode || 'bw',
            'Pending',
            req.user.id,
            req.body.practice_id || null
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
  app.get('/api/orders', requireLogin, async (req: Request, res: Response) => {
    try {
      let query = `
        SELECT o.id as "jobId", o.subject, o.created_at as "createdAt", o.status,
               o.production_start_date as "productionStartDate", o.production_end_date as "productionEndDate",
               p.name as "practiceName"
        FROM orders o
        LEFT JOIN practices p ON o.practice_id = p.id
      `;
      let params = [];

      // Filter orders by user unless admin
      if (!req.user.is_admin) {
        query += ` WHERE o.user_id = $1`;
        params.push(req.user.id);
      }

      query += ` ORDER BY o.created_at DESC LIMIT 20`;

      const result = await pool.query(query, params);

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

  // Invoice PDF generation endpoint
  app.get('/api/orders/:jobId/invoice-pdf', requireLogin, async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID"
        });
      }

      let query = `
        SELECT id AS "jobId", subject, status, created_at AS "createdAt",
               valid_recipients AS "validRecipients", color_mode AS "colorMode",
               production_start_date AS "productionStartDate", production_end_date AS "productionEndDate"
        FROM orders
        WHERE id = $1
      `;
      let params = [jobId];

      // Add user filter for non-admin users
      if (!req.user.is_admin) {
        query += ` AND user_id = $2`;
        params.push(req.user.id);
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found or access denied"
        });
      }

      const order = result.rows[0];
      
      // Calculate costs
      const validRecipients = parseInt(order.validRecipients) || 0;
      const rate = order.colorMode === 'color' ? 0.65 : 0.50;
      const estimatedCost = validRecipients * rate;
      
      // Generate invoice HTML
      const invoiceHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice ${order.jobId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
            .company-name { color: #007bff; font-size: 28px; font-weight: bold; margin: 0; }
            .invoice-title { color: #666; font-size: 24px; margin: 10px 0 0 0; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-section { flex: 1; }
            .info-section h3 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; padding: 3px 0; }
            .info-label { font-weight: 600; }
            .info-value { text-align: right; }
            .status { padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; }
            .status.Pending { background: #fff3cd; color: #856404; }
            .status.Submitted { background: #d4edda; color: #155724; }
            .status.Fulfilled { background: #cce7ff; color: #004085; }
            .cost-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .cost-section h3 { margin-top: 0; color: #333; }
            .cost-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0; }
            .cost-total { border-top: 2px solid #007bff; padding-top: 10px; margin-top: 15px; font-weight: bold; font-size: 18px; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="company-name">PatientLetterHub</h1>
            <h2 class="invoice-title">Invoice #${order.jobId}</h2>
          </div>
          
          <div class="invoice-info">
            <div class="info-section">
              <h3>Order Information</h3>
              <div class="info-row">
                <span class="info-label">Order ID:</span>
                <span class="info-value">${order.jobId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Subject:</span>
                <span class="info-value">${order.subject || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Created Date:</span>
                <span class="info-value">${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value"><span class="status ${order.status}">${order.status}</span></span>
              </div>
            </div>
            
            <div class="info-section">
              <h3>Customer Information</h3>
              <div class="info-row">
                <span class="info-label">Practice Name:</span>
                <span class="info-value">N/A</span>
              </div>
              <div class="info-row">
                <span class="info-label">Customer Email:</span>
                <span class="info-value">${req.user.email}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Valid Recipients:</span>
                <span class="info-value">${validRecipients}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Color Mode:</span>
                <span class="info-value">${order.colorMode === 'color' ? 'Color' : 'Black & White'}</span>
              </div>
            </div>
          </div>
          
          <div class="cost-section">
            <h3>Cost Breakdown</h3>
            <div class="cost-row">
              <span>Letters (${validRecipients} recipients):</span>
              <span>$${estimatedCost.toFixed(2)}</span>
            </div>
            <div class="cost-row">
              <span>Cost per Letter:</span>
              <span>$${rate.toFixed(2)}</span>
            </div>
            <div class="cost-row">
              <span>Postage:</span>
              <span style="color: #666; font-style: italic;">Calculated at time of mailing</span>
            </div>
            <div class="cost-row cost-total">
              <span>Estimated Total Cost:</span>
              <span>$${estimatedCost.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an estimated cost breakdown. Final costs may vary based on postage and processing fees.</p>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </body>
        </html>
      `;

      // Generate PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      
      await browser.close();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.jobId}.pdf"`);
      res.send(pdf);

    } catch (error: any) {
      console.error('Invoice PDF generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate invoice PDF'
      });
    }
  });

  // Duplicate order endpoint
  app.post('/api/orders/:jobId/duplicate', requireLogin, async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID"
        });
      }

      // Get original order details
      let query = `
        SELECT template_type, subject, body_html, total_recipients, valid_recipients, color_mode, practice_id
        FROM orders
        WHERE id = $1
      `;
      let params = [jobId];

      // Add user filter for non-admin users
      if (!req.user.is_admin) {
        query += ` AND user_id = $2`;
        params.push(req.user.id);
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found or access denied"
        });
      }

      const originalOrder = result.rows[0];

      // Create duplicate order
      const duplicateResult = await pool.query(`
        INSERT INTO orders (template_type, subject, body_html, total_recipients, valid_recipients, color_mode, status, production_start_date, production_end_date, user_id, practice_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', $8, $9)
        RETURNING id
      `, [
        originalOrder.template_type,
        `Copy of ${originalOrder.subject}`,
        originalOrder.body_html,
        originalOrder.total_recipients || 0,
        originalOrder.valid_recipients || 0,
        originalOrder.color_mode || 'bw',
        'Pending',
        req.user.id,
        originalOrder.practice_id || null
      ]);

      const newOrderId = duplicateResult.rows[0].id;

      res.json({
        success: true,
        message: 'Order duplicated successfully',
        orderId: newOrderId,
        redirectUrl: `/?confirmation=${newOrderId}`
      });

    } catch (error: any) {
      console.error('Order duplication error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to duplicate order'
      });
    }
  });

  // Get individual order details endpoint
  app.get('/api/orders/:jobId', requireLogin, async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID"
        });
      }

      let query = `
        SELECT id AS "jobId", subject, status, created_at AS "createdAt",
               valid_recipients AS "validRecipients", color_mode AS "colorMode",
               production_start_date AS "productionStartDate", production_end_date AS "productionEndDate"
        FROM orders
        WHERE id = $1
      `;
      let params = [jobId];

      // Add user filter for non-admin users
      if (!req.user.is_admin) {
        query += ` AND user_id = $2`;
        params.push(req.user.id);
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      res.json({
        success: true,
        order: result.rows[0]
      });

    } catch (error: any) {
      console.error('Failed to fetch order details:', error);
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  });

  // Submit order for fulfillment endpoint
  app.post('/api/orders/:jobId/submit', requireLogin, async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID"
        });
      }

      // Update order status to submitted
      const result = await pool.query(
        `UPDATE orders SET status = 'Submitted' WHERE id = $1 RETURNING id`,
        [jobId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      res.json({
        success: true,
        message: "Order submitted for fulfillment",
        orderId: jobId,
        status: "Submitted"
      });

    } catch (error: any) {
      console.error('Failed to submit order:', error);
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  });

  // Update order status endpoint
  app.post('/api/orders/:jobId/status', requireAdmin, async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      const { status } = req.body;
      
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID"
        });
      }

      if (!status || !['Pending', 'Submitted', 'Fulfilled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be one of: Pending, Submitted, Fulfilled"
        });
      }

      // Update order status
      const result = await pool.query(
        `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id`,
        [status, jobId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      res.json({
        success: true,
        message: "Order status updated successfully",
        orderId: jobId,
        status: status
      });

    } catch (error: any) {
      console.error('Failed to update order status:', error);
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  });

  // Admin statistics endpoint
  app.get('/admin/api/stats', requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get order counts by status
      const statusCounts = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM orders 
        GROUP BY status
      `);

      // Get total recipients and calculate estimated costs
      const totals = await pool.query(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(valid_recipients), 0) as total_recipients,
          COALESCE(SUM(
            CASE 
              WHEN color_mode = 'color' THEN valid_recipients * 0.65
              ELSE valid_recipients * 0.50
            END
          ), 0) as estimated_cost
        FROM orders
      `);

      // Process status counts
      const statusMap = {
        Pending: 0,
        Submitted: 0,
        Fulfilled: 0
      };

      statusCounts.rows.forEach(row => {
        if (statusMap.hasOwnProperty(row.status)) {
          statusMap[row.status] = parseInt(row.count);
        }
      });

      const totalRow = totals.rows[0];

      res.json({
        success: true,
        stats: {
          totalOrders: parseInt(totalRow.total_orders),
          totalRecipients: parseInt(totalRow.total_recipients),
          pending: statusMap.Pending,
          submitted: statusMap.Submitted,
          fulfilled: statusMap.Fulfilled,
          estimatedCost: parseFloat(totalRow.estimated_cost)
        }
      });

    } catch (error: any) {
      console.error('Failed to fetch admin stats:', error);
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  });

  // Practice settings endpoints
  app.get('/api/settings/practice', requireLogin, async (req: Request, res: Response) => {
    try {
      // Get practice information
      const practiceResult = await pool.query(`
        SELECT * FROM practices_new WHERE user_id = $1
      `, [req.user.id]);

      let practice = null;
      let locations = [];

      if (practiceResult.rows.length > 0) {
        practice = practiceResult.rows[0];

        // Get practice locations
        const locationsResult = await pool.query(`
          SELECT * FROM practice_locations 
          WHERE practice_id = $1 
          ORDER BY is_default DESC, created_at ASC
        `, [practice.id]);

        locations = locationsResult.rows;
      }

      res.json({
        success: true,
        practice: practice,
        locations: locations
      });

    } catch (error: any) {
      console.error('Failed to fetch practice settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch practice settings'
      });
    }
  });

  app.post('/api/settings/practice', requireLogin, async (req: Request, res: Response) => {
    try {
      const {
        name, contact_prefix, contact_first_name, contact_middle_initial, 
        contact_last_name, contact_suffix, contact_title, phone, email,
        main_address, main_city, main_state, main_zip,
        mailing_address, mailing_city, mailing_state, mailing_zip,
        billing_address, billing_city, billing_state, billing_zip,
        emr_id, operating_hours
      } = req.body;

      if (!name || !contact_first_name || !contact_last_name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Practice name, contact first name, last name, and email are required'
        });
      }

      // Check if practice exists
      const existingResult = await pool.query(`
        SELECT id FROM practices_new WHERE user_id = $1
      `, [req.user.id]);

      let practiceId;

      if (existingResult.rows.length > 0) {
        // Update existing practice
        practiceId = existingResult.rows[0].id;
        await pool.query(`
          UPDATE practices_new SET 
            name = $1, contact_prefix = $2, contact_first_name = $3, contact_middle_initial = $4,
            contact_last_name = $5, contact_suffix = $6, contact_title = $7, phone = $8, email = $9,
            main_address = $10, main_city = $11, main_state = $12, main_zip = $13,
            mailing_address = $14, mailing_city = $15, mailing_state = $16, mailing_zip = $17,
            billing_address = $18, billing_city = $19, billing_state = $20, billing_zip = $21,
            emr_id = $22, operating_hours = $23
          WHERE id = $24
        `, [
          name, contact_prefix, contact_first_name, contact_middle_initial,
          contact_last_name, contact_suffix, contact_title, phone, email,
          main_address, main_city, main_state, main_zip,
          mailing_address, mailing_city, mailing_state, mailing_zip,
          billing_address, billing_city, billing_state, billing_zip,
          emr_id, operating_hours, practiceId
        ]);
      } else {
        // Create new practice
        const result = await pool.query(`
          INSERT INTO practices_new (
            user_id, name, contact_prefix, contact_first_name, contact_middle_initial,
            contact_last_name, contact_suffix, contact_title, phone, email,
            main_address, main_city, main_state, main_zip,
            mailing_address, mailing_city, mailing_state, mailing_zip,
            billing_address, billing_city, billing_state, billing_zip,
            emr_id, operating_hours
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          RETURNING id
        `, [
          req.user.id, name, contact_prefix, contact_first_name, contact_middle_initial,
          contact_last_name, contact_suffix, contact_title, phone, email,
          main_address, main_city, main_state, main_zip,
          mailing_address, mailing_city, mailing_state, mailing_zip,
          billing_address, billing_city, billing_state, billing_zip,
          emr_id, operating_hours
        ]);
        practiceId = result.rows[0].id;
      }

      res.json({
        success: true,
        message: 'Practice information saved successfully',
        practice_id: practiceId
      });

    } catch (error: any) {
      console.error('Failed to save practice:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save practice information'
      });
    }
  });

  app.post('/api/settings/practice/locations', requireLogin, async (req: Request, res: Response) => {
    try {
      const {
        label, contact_name, contact_title, phone, email,
        address, city, state, zip_code, notes, is_default, active
      } = req.body;

      if (!label || !contact_name || !address) {
        return res.status(400).json({
          success: false,
          message: 'Location label, contact name, and address are required'
        });
      }

      // Get user's practice
      const practiceResult = await pool.query(`
        SELECT id FROM practices_new WHERE user_id = $1
      `, [req.user.id]);

      if (practiceResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please create your practice information first'
        });
      }

      const practiceId = practiceResult.rows[0].id;

      // If setting as default, remove default from other locations
      if (is_default) {
        await pool.query(`
          UPDATE practice_locations SET is_default = false WHERE practice_id = $1
        `, [practiceId]);
      }

      // Generate location suffix
      const countResult = await pool.query(`
        SELECT COUNT(*) as count FROM practice_locations WHERE practice_id = $1
      `, [practiceId]);
      
      const locationSuffix = `${practiceId}.${parseInt(countResult.rows[0].count) + 1}`;

      const result = await pool.query(`
        INSERT INTO practice_locations (
          practice_id, label, contact_name, contact_title, phone, email,
          address, city, state, zip_code, location_suffix, notes, is_default, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `, [
        practiceId, label, contact_name, contact_title, phone, email,
        address, city, state, zip_code, locationSuffix, notes, is_default, active
      ]);

      res.status(201).json({
        success: true,
        message: 'Location created successfully',
        location_id: result.rows[0].id
      });

    } catch (error: any) {
      console.error('Failed to create location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create location'
      });
    }
  });

  app.put('/api/settings/practice/locations/:id', requireLogin, async (req: Request, res: Response) => {
    try {
      const locationId = parseInt(req.params.id, 10);
      const {
        label, contact_name, contact_title, phone, email,
        address, city, state, zip_code, notes, is_default, active
      } = req.body;

      if (isNaN(locationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location ID'
        });
      }

      // Verify location belongs to user's practice
      const verifyResult = await pool.query(`
        SELECT pl.practice_id FROM practice_locations pl
        JOIN practices_new pn ON pl.practice_id = pn.id
        WHERE pl.id = $1 AND pn.user_id = $2
      `, [locationId, req.user.id]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Location not found or access denied'
        });
      }

      const practiceId = verifyResult.rows[0].practice_id;

      // If setting as default, remove default from other locations
      if (is_default) {
        await pool.query(`
          UPDATE practice_locations SET is_default = false 
          WHERE practice_id = $1 AND id != $2
        `, [practiceId, locationId]);
      }

      // Update location
      await pool.query(`
        UPDATE practice_locations SET 
          label = $1, contact_name = $2, contact_title = $3, phone = $4, email = $5,
          address = $6, city = $7, state = $8, zip_code = $9, notes = $10,
          is_default = $11, active = $12
        WHERE id = $13
      `, [
        label, contact_name, contact_title, phone, email,
        address, city, state, zip_code, notes, is_default, active, locationId
      ]);

      res.json({
        success: true,
        message: 'Location updated successfully'
      });

    } catch (error: any) {
      console.error('Failed to update location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update location'
      });
    }
  });

  app.delete('/api/settings/practice/locations/:id', requireLogin, async (req: Request, res: Response) => {
    try {
      const locationId = parseInt(req.params.id, 10);

      if (isNaN(locationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location ID'
        });
      }

      // Verify location belongs to user's practice and check if it's the only location
      const verifyResult = await pool.query(`
        SELECT pl.practice_id, pl.is_default,
               (SELECT COUNT(*) FROM practice_locations WHERE practice_id = pl.practice_id) as total_locations
        FROM practice_locations pl
        JOIN practices_new pn ON pl.practice_id = pn.id
        WHERE pl.id = $1 AND pn.user_id = $2
      `, [locationId, req.user.id]);

      if (verifyResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Location not found or access denied'
        });
      }

      const { practice_id, is_default, total_locations } = verifyResult.rows[0];

      if (parseInt(total_locations) === 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only location. Please add another location first.'
        });
      }

      // Delete the location
      await pool.query(`DELETE FROM practice_locations WHERE id = $1`, [locationId]);

      // If this was the default location, set another location as default
      if (is_default) {
        await pool.query(`
          UPDATE practice_locations SET is_default = true 
          WHERE practice_id = $1 AND id = (
            SELECT id FROM practice_locations 
            WHERE practice_id = $1 AND active = true 
            ORDER BY created_at ASC LIMIT 1
          )
        `, [practice_id]);
      }

      res.json({
        success: true,
        message: 'Location deleted successfully'
      });

    } catch (error: any) {
      console.error('Failed to delete location:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete location'
      });
    }
  });

  // Get active locations for dropdowns (used in quote forms)
  app.get('/api/settings/practice/locations', requireLogin, async (req: Request, res: Response) => {
    try {
      // Get practice and locations
      const practiceResult = await pool.query(`
        SELECT * FROM practices_new WHERE user_id = $1
      `, [req.user.id]);

      let allLocations = [];

      if (practiceResult.rows.length > 0) {
        const practice = practiceResult.rows[0];
        
        // Add main location if practice has main address
        if (practice.main_address) {
          const contactName = [
            practice.contact_prefix,
            practice.contact_first_name,
            practice.contact_middle_initial,
            practice.contact_last_name,
            practice.contact_suffix
          ].filter(Boolean).join(' ') || practice.contact_name || 'Main Contact';

          const mainLocation = {
            id: 'main',
            practice_id: practice.id,
            label: 'Main Location',
            contact_name: contactName,
            contact_title: practice.contact_title,
            phone: practice.phone,
            email: practice.email,
            address: practice.main_address,
            city: practice.main_city,
            state: practice.main_state,
            zip_code: practice.main_zip,
            location_suffix: `${practice.id}.0`,
            is_default: true,
            active: true
          };
          
          allLocations.push(mainLocation);
        }

        // Get additional locations
        const locationsResult = await pool.query(`
          SELECT pl.* FROM practice_locations pl
          WHERE pl.practice_id = $1 AND pl.active = true
          ORDER BY pl.is_default DESC, pl.label ASC
        `, [practice.id]);

        allLocations.push(...locationsResult.rows);
      }

      res.json({
        success: true,
        locations: allLocations
      });

    } catch (error: any) {
      console.error('Failed to fetch locations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch locations'
      });
    }
  });

  // Admin calendar endpoint
  app.get('/admin/api/calendar', requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT 
          production_end_date,
          COUNT(*) as order_count,
          COALESCE(SUM(valid_recipients), 0) as total_recipients,
          COALESCE(SUM(
            CASE 
              WHEN color_mode = 'color' THEN valid_recipients * 0.65
              ELSE valid_recipients * 0.50
            END
          ), 0) as total_cost,
          ARRAY_AGG(
            JSON_BUILD_OBJECT(
              'id', id,
              'subject', subject,
              'status', status,
              'recipients', valid_recipients,
              'cost', CASE 
                WHEN color_mode = 'color' THEN valid_recipients * 0.65
                ELSE valid_recipients * 0.50
              END
            )
          ) as orders
        FROM orders 
        GROUP BY production_end_date
        ORDER BY production_end_date
      `);

      const calendarData = {};
      
      result.rows.forEach(row => {
        const date = row.production_end_date.toISOString().split('T')[0];
        calendarData[date] = {
          orderCount: parseInt(row.order_count),
          totalRecipients: parseInt(row.total_recipients),
          totalCost: parseFloat(row.total_cost),
          orders: row.orders
        };
      });

      res.json({
        success: true,
        calendar: calendarData
      });

    } catch (error: any) {
      console.error('Failed to fetch calendar data:', error);
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  });

  // CSV export endpoint for production schedule
  app.get('/admin/api/export/schedule', requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT 
          id as "Order ID",
          subject as "Subject",
          status as "Status",
          created_at as "Created Date",
          production_end_date as "Production End Date",
          valid_recipients as "Total Recipients",
          CASE 
            WHEN color_mode = 'color' THEN valid_recipients * 0.65
            ELSE valid_recipients * 0.50
          END as "Estimated Cost"
        FROM orders
        ORDER BY production_end_date, id
      `);

      // Generate CSV content
      const headers = ['Order ID', 'Subject', 'Status', 'Created Date', 'Production End Date', 'Total Recipients', 'Estimated Cost'];
      const csvContent = [
        headers.join(','),
        ...result.rows.map(row => [
          row['Order ID'],
          `"${(row['Subject'] || '').replace(/"/g, '""')}"`,
          row['Status'],
          new Date(row['Created Date']).toLocaleDateString(),
          new Date(row['Production End Date']).toLocaleDateString(),
          row['Total Recipients'] || 0,
          `$${parseFloat(row['Estimated Cost']).toFixed(2)}`
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="production_schedule.csv"');
      res.send(csvContent);

    } catch (error: any) {
      console.error('Failed to export schedule:', error);
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  });

  // Get legacy order details endpoint (for letter_jobs compatibility)
  app.get('/api/letter-jobs/:jobId', async (req: Request, res: Response) => {
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
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`PDF generation attempt ${attempt} for job ${jobId}`);
          const result = await pool.query(
            `SELECT subject, body_html, color_mode FROM orders WHERE id = $1`,
            [jobId]
          );
          
          if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
          }

          job = result.rows[0];
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
        return res.status(404).json({ message: 'Order not found after retries' });
      }

      console.log('Launching puppeteer for PDF generation...');
      const browser = await puppeteer.launch({ 
        headless: true,
        executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      });
      const page = await browser.newPage();

      // Build HTML content from job data or basic fallback
      const html = job.body_html || `<h1>${job.subject}</h1><p>No content provided.</p>`;

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
              <div class="practice-name">Healthcare Practice</div>
              <div class="practice-info">
                123 Main St, Anytown, ST 12345<br>
                555-0123<br>
                NPI: 1234567890
              </div>
            </div>
            
            <div class="letter-content">
              <div>${html}</div>
            </div>
            
            <div class="footer">
              <p>Generated on ${new Date().toLocaleDateString()}</p>
              <p>Order ID: ${jobId} | Color Mode: ${job.color_mode || 'N/A'}</p>
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
        'Content-Disposition': `inline; filename="order-${jobId}.pdf"`,
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
