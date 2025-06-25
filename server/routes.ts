import express, { type Express } from 'express';
import { db, pool } from './db';
import { storage } from './storage';
import { requireAuth } from './middleware/auth';
import { quotes, orders, type InsertQuote, type InsertOrder } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// === AUTH ===
router.get('/api/auth/user', async (req, res) => {
  try {
    // Check if user exists in session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = req.session.user;
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email,
        is_admin: user.isAdmin || false
      } 
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST login endpoint for the login form
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // For development/testing, use consistent user ID that matches existing practice data
    const userId = email.includes('admin') ? '1' : '2';
    const testUser = {
      id: userId,
      email: email,
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: null,
      isAdmin: email.includes('admin'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store user in session
    req.session.user = testUser;
    req.session.userId = testUser.id;
    req.user = testUser;

    // Save session before responding
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ success: false, message: 'Session save failed' });
      }
      
      console.log('Login successful for user:', testUser.email, 'with ID:', testUser.id);
      res.json({ 
        success: true, 
        user: { 
          id: testUser.id, 
          email: testUser.email, 
          is_admin: testUser.isAdmin 
        } 
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

router.post('/api/auth/logout', async (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// === PRACTICE LOCATION DROPDOWN FOR QUOTES ===
router.get('/api/settings/practice/locations', async (req, res) => {
  try {
    // Check authentication via session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userId = req.session.user.id;

    // For development, return practice locations based on user ID
    if (userId === '2') {
      // Return the existing practice locations for user 2
      const locations = [
        {
          id: 'main-1',
          label: 'UMass Occupational Therapy (Main Location)',
          location_suffix: '1.0',
          is_default: true,
          contact_name: 'Dr. David Sweeney',
          address: '10 Arch Street, Shrewsbury, MA 01545'
        },
        {
          id: '2',
          label: 'UMass Occupational Therapy',
          location_suffix: '1.2',
          is_default: false,
          contact_name: 'Joe Sweeney',
          address: '10 Arch Street, SHREWSBURY, MA 01545-4801'
        },
        {
          id: '3',
          label: 'North Valley Clinic',
          location_suffix: '1.3',
          is_default: false,
          contact_name: 'Dr. Jane A Smith MD',
          address: '456 North Valley Road, Valley View, CA 90211'
        }
      ];
      
      return res.json({ success: true, locations });
    }

    // For other users, return empty locations
    res.json({ success: true, locations: [] });
  } catch (error) {
    console.error('Error getting practice locations:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// === PRACTICE SETTINGS ===
router.get('/api/settings/practice', async (req, res) => {
  try {
    // Check authentication via session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userId = req.session.user.id;

    // For development, return practice data for user ID 2
    if (userId === '2') {
      const practice = {
        id: 1,
        name: 'UMass Occupational Therapy',
        contact_prefix: 'Dr.',
        contact_first_name: 'David',
        contact_middle_initial: '',
        contact_last_name: 'Sweeney',
        contact_suffix: '',
        contact_title: 'Practice Director',
        phone: '(508) 555-0123',
        email: 'dsweeney@umass.edu',
        main_address: '10 Arch Street',
        main_city: 'Shrewsbury',
        main_state: 'MA',
        main_zip: '01545',
        mailing_address: '10 Arch Street',
        mailing_city: 'Shrewsbury',
        mailing_state: 'MA',
        mailing_zip: '01545',
        emr_id: 'UMASS-OT-001',
        operating_hours: 'Mon-Fri 8AM-5PM'
      };

      const locations = [
        {
          id: 2,
          label: 'UMass Occupational Therapy',
          location_suffix: '1.2',
          contact_name: 'Joe Sweeney',
          contact_title: 'Location Manager',
          phone: '(508) 555-0124',
          email: 'jsweeney@umass.edu',
          address: '10 Arch Street',
          city: 'SHREWSBURY',
          state: 'MA',
          zip_code: '01545-4801',
          is_default: false,
          active: true
        },
        {
          id: 3,
          label: 'North Valley Clinic',
          location_suffix: '1.3',
          contact_name: 'Dr. Jane A Smith MD',
          contact_title: 'Medical Director',
          phone: '(818) 555-0125',
          email: 'jsmith@northvalley.com',
          address: '456 North Valley Road',
          city: 'Valley View',
          state: 'CA',
          zip_code: '90211',
          is_default: false,
          active: true
        }
      ];

      return res.json({ 
        success: true, 
        practice: practice,
        locations: locations 
      });
    }

    // For other users, return empty data
    res.json({ 
      success: true, 
      practice: null,
      locations: [] 
    });
  } catch (error) {
    console.error('Error getting practice data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/api/settings/practice', async (req, res) => {
  try {
    // Check authentication via session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const practiceData = req.body;
    console.log('Practice data update:', practiceData);
    
    // For development, just return success
    res.json({ 
      success: true, 
      message: 'Practice information saved successfully' 
    });
  } catch (error) {
    console.error('Error saving practice data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// === QUOTES ENDPOINTS ===
router.get('/api/quotes', async (req, res) => {
  try {
    // Check authentication via session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userId = req.session.user.id;

    // Get quotes from database for this user
    const userQuotes = await db
      .select()
      .from(quotes)
      .where(eq(quotes.user_id, userId))
      .orderBy(desc(quotes.created_at));

    // Transform to match frontend format
    const formattedQuotes = userQuotes.map(quote => ({
      id: quote.quote_number,
      subject: quote.subject,
      practiceLocation: `Practice Location (${quote.location_id})`,
      templateType: quote.template_type,
      estimatedRecipients: quote.estimated_recipients,
      totalCost: parseFloat(quote.total_cost || '0'),
      status: quote.status,
      createdAt: quote.created_at?.toISOString(),
      convertedOrderId: quote.converted_order_id,
      colorMode: quote.color_mode,
      enclosures: quote.enclosures,
      dataCleansing: quote.data_cleansing,
      ncoaUpdate: quote.ncoa_update,
      firstClassPostage: quote.first_class_postage,
      notes: quote.notes,
      location_id: quote.location_id
    }));

    res.json({ success: true, quotes: formattedQuotes });
  } catch (error) {
    console.error('Error getting quotes:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/api/quotes/:id/convert', async (req, res) => {
  try {
    // Check authentication via session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const quoteNumber = req.params.id;
    const userId = req.session.user.id;
    
    console.log('Converting quote to order:', quoteNumber);

    // Find the quote in database
    const [quoteToConvert] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.quote_number, quoteNumber));

    if (!quoteToConvert) {
      return res.status(404).json({ 
        success: false, 
        message: 'Quote not found' 
      });
    }

    if (quoteToConvert.user_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to convert this quote' 
      });
    }

    if (quoteToConvert.status === 'Converted') {
      return res.status(400).json({ 
        success: false, 
        message: 'Quote has already been converted to an order' 
      });
    }

    // Create new order from quote
    const newOrderData: InsertOrder = {
      user_id: userId,
      quote_id: quoteToConvert.id,
      subject: quoteToConvert.subject,
      template_type: quoteToConvert.template_type,
      color_mode: quoteToConvert.color_mode,
      estimated_recipients: quoteToConvert.estimated_recipients,
      recipient_count: quoteToConvert.estimated_recipients,
      enclosures: quoteToConvert.enclosures,
      notes: quoteToConvert.notes,
      data_cleansing: quoteToConvert.data_cleansing,
      ncoa_update: quoteToConvert.ncoa_update,
      first_class_postage: quoteToConvert.first_class_postage,
      total_cost: quoteToConvert.total_cost,
      status: 'Pending Approval',
      production_start_date: new Date().toISOString().split('T')[0],
      production_end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    const [newOrder] = await db.insert(orders).values(newOrderData).returning();

    // Update quote status and link to order
    await db
      .update(quotes)
      .set({ 
        status: 'Converted', 
        converted_order_id: newOrder.id,
        updated_at: new Date()
      })
      .where(eq(quotes.id, quoteToConvert.id));
    
    console.log('Quote converted to order successfully:', {
      quoteId: quoteNumber,
      orderId: newOrder.id,
      subject: quoteToConvert.subject
    });
    
    res.json({ 
      success: true, 
      orderId: newOrder.id,
      message: 'Quote converted to order successfully'
    });
  } catch (error) {
    console.error('Error converting quote:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// === QUOTE CREATION ===
router.post('/api/quotes', async (req, res) => {
  try {
    // Check authentication via session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const {
      location_id,
      subject,
      templateType,
      colorMode,
      estimatedRecipients,
      enclosures,
      notes,
      dataCleansing,
      ncoaUpdate,
      firstClassPostage
    } = req.body;

    console.log('Quote submission - received data:', req.body);

    // Detailed field validation with specific error messages
    const missingFields = [];
    if (!subject) missingFields.push('subject');
    if (!templateType) missingFields.push('templateType');
    if (!colorMode) missingFields.push('colorMode');
    if (!estimatedRecipients || estimatedRecipients <= 0) missingFields.push('estimatedRecipients');
    if (!location_id) missingFields.push('location_id');

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields
      });
    }

    // Calculate total cost including additional services
    const base = colorMode === 'color' ? 0.65 : 0.50;
    const enclosureCount = parseInt(enclosures) || 0;
    const recipientCount = parseInt(estimatedRecipients) || 0;
    
    let totalCost = recipientCount * (base + (enclosureCount * 0.10));
    
    if (dataCleansing) totalCost += 25;
    if (ncoaUpdate) totalCost += 50;
    if (firstClassPostage) totalCost += recipientCount * 0.68;

    // Create a unique quote number
    const quoteNumber = `Q-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Insert quote into database
    const newQuoteData: InsertQuote = {
      quote_number: quoteNumber,
      user_id: req.session.user.id,
      location_id: location_id,
      subject: subject,
      template_type: templateType,
      color_mode: colorMode,
      estimated_recipients: recipientCount,
      enclosures: enclosureCount,
      notes: notes || '',
      data_cleansing: dataCleansing || false,
      ncoa_update: ncoaUpdate || false,
      first_class_postage: firstClassPostage || false,
      total_cost: totalCost.toFixed(2),
      status: 'Quote'
    };

    const [insertedQuote] = await db.insert(quotes).values(newQuoteData).returning();
    
    console.log('Quote created successfully in database:', {
      id: insertedQuote.id,
      quoteNumber,
      subject,
      templateType,
      colorMode,
      estimatedRecipients: recipientCount,
      enclosures: enclosureCount,
      dataCleansing,
      ncoaUpdate,
      firstClassPostage,
      totalCost: totalCost.toFixed(2),
      location_id
    });
    
    res.json({ 
      success: true, 
      quoteId: insertedQuote.id, 
      quoteNumber: quoteNumber,
      totalCost: totalCost.toFixed(2),
      message: `Quote ${quoteNumber} created successfully`
    });
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// === ORDER SUBMISSION ENDPOINT ===
router.post('/api/orders', async (req, res) => {
  try {
    // Check authentication via session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const userId = req.session.user.id;
    
    // Extract form data
    const { subject, colorMode, dataCleansing, ncoaUpdate, firstClassPostage } = req.body;
    
    // Validate required fields
    if (!subject) {
      return res.status(400).json({ success: false, message: 'Subject line is required' });
    }
    
    // Check for required files (req.files is an array when using upload.any())
    const files = req.files as Express.Multer.File[] || [];
    const letterDoc = files.find(f => f.fieldname === 'letterDocument');
    const recipientsFile = files.find(f => f.fieldname === 'recipients');
    
    if (!letterDoc) {
      return res.status(400).json({ success: false, message: 'Letter document is required' });
    }
    
    if (!recipientsFile) {
      return res.status(400).json({ success: false, message: 'Recipient list is required' });
    }

    // Generate order ID and create order
    const orderId = Math.floor(Math.random() * 10000) + 1000;
    
    // Calculate estimated costs (placeholder logic)
    const estimatedRecipients = 100; // Would parse CSV in real implementation
    const baseRate = colorMode === 'color' ? 0.65 : 0.50;
    let totalCost = estimatedRecipients * baseRate;
    
    if (dataCleansing === 'true') totalCost += 25;
    if (ncoaUpdate === 'true') totalCost += 50;
    if (firstClassPostage === 'true') totalCost += estimatedRecipients * 0.68;

    console.log('Order created:', {
      orderId,
      subject,
      colorMode,
      estimatedRecipients,
      totalCost: totalCost.toFixed(2),
      files: files.map(f => f.fieldname)
    });

    res.json({ 
      success: true, 
      orderId: orderId,
      message: 'Order submitted successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// === ORDER APPROVAL ENDPOINT ===
router.post('/api/orders/:id/approve', async (req, res) => {
  try {
    // Check authentication via session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const orderId = parseInt(req.params.id);
    const userId = req.session.user.id;

    if (isNaN(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    // Get order from database
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user owns this order
    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to approve this order' });
    }
    
    // Generate invoice number and update order
    const invoiceNumber = `INV-${Math.floor(Math.random() * 9000) + 1000}`;
    
    await db
      .update(orders)
      .set({ 
        status: 'In Process',
        invoice_number: invoiceNumber,
        updated_at: new Date()
      })
      .where(eq(orders.id, orderId));
    
    console.log('Order approved and updated in database:', {
      orderId,
      invoiceNumber,
      status: 'In Process',
      approvedAt: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Order approved and moved to production',
      invoiceNumber,
      redirectUrl: `/confirmation.html?jobId=${orderId}`
    });
  } catch (error) {
    console.error('Error approving order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// === ORDER PROOF ENDPOINT ===
router.get('/api/orders/:id/proof', async (req, res) => {
  try {
    // Check authentication via session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const orderId = req.params.id;
    
    // For now, redirect to existing PDF endpoint
    res.redirect(`/api/orders/${orderId}/pdf`);
  } catch (error) {
    console.error('Error generating proof:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// === ORDER DETAILS ENDPOINT ===
router.get('/api/orders/:id', async (req, res) => {
  try {
    // Check authentication via session
    if (!req.session?.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const orderId = req.params.id;
    
    // For development, return sample order data for valid IDs with approval workflow support
    const sampleOrders = {
      '15': {
        jobId: 15,
        subject: 'HIPAA Breach Notification',
        status: 'Fulfilled',
        createdAt: '2024-06-21T09:45:00Z',
        recipientCount: 75,
        cost: 95.25,
        practiceLocation: 'UMass Occupational Therapy (1.2)',
        colorMode: 'color',
        dataCleansing: false,
        ncoaUpdate: true,
        firstClassPostage: true
      },
      '188': {
        jobId: 188,
        subject: 'Practice Relocation Notice',
        status: 'Pending Approval',
        createdAt: new Date().toISOString(),
        recipientCount: 150,
        cost: 127.50,
        practiceLocation: 'UMass Occupational Therapy (1.0)',
        colorMode: 'bw',
        dataCleansing: true,
        ncoaUpdate: false,
        firstClassPostage: true
      },
      '9999': {
        jobId: 9999,
        subject: 'Provider Departure - Dr. Smith',
        status: 'Pending Approval',
        createdAt: new Date().toISOString(),
        recipientCount: 250,
        cost: 287.50,
        practiceLocation: 'North Valley Clinic (1.3)',
        colorMode: 'color',
        dataCleansing: true,
        ncoaUpdate: true,
        firstClassPostage: false
      }
    };

    const order = sampleOrders[orderId];
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    res.json({ 
      success: true, 
      order: order 
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// === ADMIN API ENDPOINTS ===

// Admin practices endpoint for filter dropdown
router.get('/admin/api/practices', async (req, res) => {
  try {
    if (!req.session?.user?.isAdmin) {
      return res.status(401).json({ success: false, message: 'Admin access required' });
    }

    const practices = [
      { name: 'UMass Occupational Therapy' },
      { name: 'North Valley Clinic' },
      { name: 'Springfield Medical Center' },
      { name: 'Regional Healthcare Partners' }
    ];

    res.json({ 
      success: true, 
      practices 
    });
  } catch (error) {
    console.error('Error getting practices:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin orders endpoint with full order data
router.get('/admin/api/orders', async (req, res) => {
  try {
    // Check authentication via session (admin only)
    if (!req.session?.user?.isAdmin) {
      return res.status(401).json({ success: false, message: 'Admin access required' });
    }

    // Get all orders from database for admin view
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.created_at));

    // Transform to match admin dashboard format
    const adminOrders = allOrders.map(order => ({
      id: order.id,
      subject: order.subject,
      status: order.status,
      created_at: order.created_at?.toISOString(),
      recipientCount: order.recipient_count || order.estimated_recipients,
      totalCost: parseFloat(order.total_cost || '0'),
      practiceName: 'Practice Name', // TODO: Join with practices table
      userEmail: 'user@example.com', // TODO: Join with users table
      invoiceNumber: order.invoice_number,
      files: {
        letterDocument: 'letter_document.pdf',
        recipients: 'recipients.csv'
      },
      statusHistory: [
        { status: order.status, timestamp: order.created_at?.toISOString() }
      ],
      adminNotes: order.notes || '',
      production_start_date: order.production_start_date,
      production_end_date: order.production_end_date,
      fulfilled_at: order.fulfilled_at
    }));

    res.json({ 
      success: true, 
      orders: adminOrders 
    });
  } catch (error) {
    console.error('Error getting admin orders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin order fulfillment endpoint
router.post('/admin/api/orders/:id/fulfill', async (req, res) => {
  try {
    if (!req.session?.user?.isAdmin) {
      return res.status(401).json({ success: false, message: 'Admin access required' });
    }

    const orderId = req.params.id;
    
    console.log('Admin marked order as fulfilled:', {
      orderId,
      fulfilledBy: req.session.user.email,
      fulfilledAt: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Order marked as fulfilled'
    });
  } catch (error) {
    console.error('Error fulfilling order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin order metadata update endpoint
router.put('/admin/api/orders/:id/metadata', async (req, res) => {
  try {
    if (!req.session?.user?.isAdmin) {
      return res.status(401).json({ success: false, message: 'Admin access required' });
    }

    const orderId = req.params.id;
    const { invoiceNumber, totalCost } = req.body;
    
    console.log('Admin updated order metadata:', {
      orderId,
      invoiceNumber,
      totalCost,
      updatedBy: req.session.user.email,
      updatedAt: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Order metadata updated'
    });
  } catch (error) {
    console.error('Error updating order metadata:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin notes endpoint
router.put('/admin/api/orders/:id/notes', async (req, res) => {
  try {
    if (!req.session?.user?.isAdmin) {
      return res.status(401).json({ success: false, message: 'Admin access required' });
    }

    const orderId = req.params.id;
    const { note } = req.body;
    
    console.log('Admin note saved:', {
      orderId,
      note,
      savedBy: req.session.user.email,
      savedAt: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Admin note saved'
    });
  } catch (error) {
    console.error('Error saving admin note:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Export a function to register routes
export function registerRoutes(app: Express) {
  app.use(router);
}

