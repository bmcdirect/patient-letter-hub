import express from 'express';
import { loginUser, getAllPractices, requireAuth, type SimpleAuthRequest } from './auth';
import { storage } from './storage';
import { type InsertPracticeLocation, type InsertQuote, type InsertOrder, quotes } from '@shared/schema';
import { upload } from './upload';
import { db } from './db';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  (req as any).log.info({ path: req.path }, 'Health check');
  res.json({ status: 'ok', tenant: req.tenantId ?? 'n/a' });
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    console.log('🔐 Login attempt for:', email);
    
    const user = await loginUser(email, password);
    
    // Store user data in session
    req.session.userId = user.id;
    req.session.userData = user;
    
    // Force session save for production
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
    
    console.log('✅ Login successful for:', email, 'Practice:', user.practiceName);
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        practiceName: user.practiceName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Get current user
router.get('/user', requireAuth, (req: SimpleAuthRequest, res) => {
  console.log('👤 User request - session data:', req.session?.userData);
  res.json(req.user);
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// ---------- Locations ----------
router.get('/practices/:practiceId/locations', requireAuth, async (req: SimpleAuthRequest, res) => {
  try {
    const practiceId = Number(req.params.practiceId);
    const locations = await storage.getPracticeLocations(practiceId, req.tenantId!);
    res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Failed to get locations' });
  }
});

router.post('/practices/:practiceId/locations', requireAuth, async (req: SimpleAuthRequest, res) => {
  try {
    const practiceId = Number(req.params.practiceId);
    const payload = req.body;
    
    // Map frontend field names to backend field names
    const locationData: InsertPracticeLocation = {
      tenantId: req.tenantId!,
      practiceId,
      label: payload.label,
      contactName: payload.contactName,
      phone: payload.phone,
      email: payload.email,
      addressLine1: payload.addressLine1,
      city: payload.city,
      state: payload.state,
      zipCode: payload.zipCode,
      isDefault: payload.isPrimary || false
    };
    
    const location = await storage.createPracticeLocation(locationData);
    res.status(201).json(location);
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ message: 'Failed to create location' });
  }
});

// Get all practices (for login dropdown)
router.get('/practices', async (req, res) => {
  try {
    const practices = await getAllPractices();
    res.json(practices);
  } catch (error) {
    console.error('Get practices error:', error);
    res.status(500).json({ message: 'Failed to get practices' });
  }
});

// ---------- Quotes ----------
router.get('/quotes', requireAuth, async (req: SimpleAuthRequest, res) => {
  try {
    const items = await db
      .select()
      .from(quotes)
      .where(eq(quotes.tenantId, req.tenantId!))
      .orderBy(desc(quotes.createdAt));      // newest first, no limit
    res.json(items);
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ message: 'Failed to get quotes' });
  }
});

router.post('/quotes', requireAuth, async (req: SimpleAuthRequest, res) => {
  try {
    const quoteData: InsertQuote = {
      tenantId: req.tenantId!,
      practiceId: req.body.practiceId ? Number(req.body.practiceId) : req.tenantId!, // Use tenantId as practiceId if not provided
      userId: req.user!.id,
      quoteNumber: `Q-${Date.now()}`, // Generate quote number
      subject: req.body.subject,
      estimatedRecipients: req.body.estimatedRecipients ? Number(req.body.estimatedRecipients) : undefined,
      colorMode: req.body.colorMode,
      dataCleansing: req.body.dataCleansing === true || req.body.dataCleansing === 'true',
      ncoaUpdate: req.body.ncoaUpdate === true || req.body.ncoaUpdate === 'true',
      firstClassPostage: req.body.firstClassPostage === true || req.body.firstClassPostage === 'true',
      notes: req.body.notes,
      purchaseOrder: req.body.purchaseOrder,
      costCenter: req.body.costCenter,
      total: req.body.total || req.body.totalCost,
      status: req.body.status || 'pending',
    };

    const quote = await storage.createQuote(quoteData);
    
    console.log(`Quote ${quote.id} created successfully for tenant ${req.tenantId}`);
    
    res.status(201).json(quote);
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({ message: 'Failed to create quote' });
  }
});

// ---------- Orders ----------
router.get('/orders', requireAuth, async (req: SimpleAuthRequest, res) => {
  try {
    const orders = await storage.getOrders(req.user!.id.toString(), req.tenantId!);
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to get orders' });
  }
});

// Middleware to conditionally apply multer based on content type
const conditionalMulter = (req: any, res: any, next: any) => {
  const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
  
  if (isMultipart) {
    // Apply multer for multipart requests - using upload directly
    upload(req, res, next);
  } else {
    // Skip multer for JSON requests
    next();
  }
};

router.post(
  '/orders',
  requireAuth,
  conditionalMulter,
  async (req: SimpleAuthRequest, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];

      const orderData: InsertOrder = {
        tenantId: req.tenantId!,
        orderNumber: `O-${Date.now()}`, // Generate order number
        userId: req.user!.id,
        practiceId: req.body.practiceId ? Number(req.body.practiceId) : req.tenantId!, // Use tenantId as practiceId if not provided
        quoteId: req.body.quoteId ? Number(req.body.quoteId) : undefined,
        quoteNumber: req.body.quoteNumber,
        subject: req.body.subject,
        templateType: req.body.templateType,
        colorMode: req.body.colorMode,
        estimatedRecipients: req.body.estimatedRecipients ? Number(req.body.estimatedRecipients) : undefined,
        recipientCount: req.body.recipientCount ? Number(req.body.recipientCount) : undefined,
        enclosures: req.body.enclosures ? Number(req.body.enclosures) : 0,
        notes: req.body.notes,
        purchaseOrder: req.body.purchaseOrder,
        costCenter: req.body.costCenter,
        dataCleansing: req.body.dataCleansing === 'true',
        ncoaUpdate: req.body.ncoaUpdate === 'true',
        firstClassPostage: req.body.firstClassPostage === 'true',
        totalCost: req.body.totalCost,
        status: req.body.status || 'draft',
        invoiceNumber: req.body.invoiceNumber,
        preferredMailDate: req.body.preferredMailDate,
        productionStartDate: req.body.productionStartDate,
        productionEndDate: req.body.productionEndDate,
      };

      const order = await storage.createOrder(orderData);
      
      // Log uploaded files
      console.log(`files uploaded: ${req.files?.length || 0}`);
      if (files && files.length > 0) {
        console.log(`Order ${order.id} created with ${files.length} files uploaded`);
      }

      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  },
);

export default router;