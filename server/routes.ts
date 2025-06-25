import express, { type Express } from 'express';
import { db, pool } from './db';
import { storage } from './storage';
import { requireAuth } from './middleware/auth';

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

    // For development, return sample quotes plus any dynamically created ones for user ID 2
    if (userId === '2') {
      const baseQuotes = [
        {
          id: 'Q-4350',
          subject: 'Practice Relocation Notice',
          practiceLocation: 'UMass Occupational Therapy (1.0)',
          templateType: 'practice_relocation',
          estimatedRecipients: 150,
          totalCost: 127.50,
          status: req.session.convertedQuotes && req.session.convertedQuotes.includes('Q-4350') ? 'Converted' : 'Quote',
          createdAt: '2024-06-23T10:30:00Z',
          convertedOrderId: req.session.convertedQuotes && req.session.convertedQuotes.includes('Q-4350') ? 188 : null
        },
        {
          id: 'Q-7964',
          subject: 'Provider Departure - Dr. Smith',
          practiceLocation: 'North Valley Clinic (1.3)',
          templateType: 'provider_departure',
          estimatedRecipients: 250,
          totalCost: 287.50,
          status: req.session.convertedQuotes && req.session.convertedQuotes.includes('Q-7964') ? 'Converted' : 'Quote',
          createdAt: '2024-06-22T14:15:00Z',
          convertedOrderId: req.session.convertedQuotes && req.session.convertedQuotes.includes('Q-7964') ? 9999 : null
        },
        {
          id: 'Q-2452',
          subject: 'HIPAA Breach Notification',
          practiceLocation: 'UMass Occupational Therapy (1.2)',
          templateType: 'hipaa_breach',
          estimatedRecipients: 75,
          totalCost: 95.25,
          status: 'Converted',
          createdAt: '2024-06-21T09:45:00Z',
          convertedOrderId: 15
        }
      ];

      // Add any dynamically created quotes from session
      const dynamicQuotes = req.session.createdQuotes || [];
      const allQuotes = [...baseQuotes, ...dynamicQuotes];

      return res.json({ success: true, quotes: allQuotes });
    }

    // For other users, return empty quotes
    res.json({ success: true, quotes: [] });
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

    const quoteId = req.params.id;
    console.log('Converting quote to order:', quoteId);

    // Track converted quotes in session
    if (!req.session.convertedQuotes) {
      req.session.convertedQuotes = [];
    }
    
    if (req.session.convertedQuotes.includes(quoteId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quote has already been converted to an order' 
      });
    }

    // Map specific quotes to order IDs that exist in our sample data
    const quoteToOrderMap = {
      'Q-4350': 188,  // Practice Relocation Notice
      'Q-7964': 9999, // Provider Departure - Dr. Smith  
      'Q-2452': 15    // HIPAA Breach Notification (already converted)
    };
    
    const orderId = quoteToOrderMap[quoteId] || 188; // Default to 188 if not found
    
    // Mark quote as converted
    req.session.convertedQuotes.push(quoteId);
    
    res.json({ 
      success: true, 
      orderId: orderId,
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

    if (!subject || !templateType || !colorMode || !estimatedRecipients) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Calculate total cost including additional services
    const base = colorMode === 'color' ? 0.65 : 0.50;
    let totalCost = estimatedRecipients * (base + (enclosures * 0.10));
    
    if (dataCleansing) totalCost += 25;
    if (ncoaUpdate) totalCost += 50;
    if (firstClassPostage) totalCost += estimatedRecipients * 0.68;

    // Create a simple quote response
    const quoteNumber = `Q-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Store the quote in session for persistence
    if (!req.session.createdQuotes) {
      req.session.createdQuotes = [];
    }
    
    const newQuote = {
      id: quoteNumber,
      subject: subject,
      practiceLocation: `Practice Location (${location_id})`,
      templateType: templateType,
      estimatedRecipients: estimatedRecipients,
      totalCost: parseFloat(totalCost.toFixed(2)),
      status: 'Quote',
      createdAt: new Date().toISOString(),
      convertedOrderId: null
    };
    
    req.session.createdQuotes.push(newQuote);
    
    console.log('Quote created:', {
      quoteNumber,
      subject,
      templateType,
      colorMode,
      estimatedRecipients,
      enclosures,
      dataCleansing,
      ncoaUpdate,
      firstClassPostage,
      totalCost: totalCost.toFixed(2)
    });
    
    res.json({ 
      success: true, 
      quoteId: Date.now(), 
      quoteNumber: quoteNumber,
      totalCost: totalCost.toFixed(2)
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

    const orderId = req.params.id;
    
    // Generate invoice number and set approval details
    const invoiceNumber = `INV-${Math.floor(Math.random() * 9000) + 1000}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // NET 30
    
    console.log('Order approved:', {
      orderId,
      invoiceNumber,
      status: 'In Process',
      approvedAt: new Date().toISOString(),
      dueDate: dueDate.toISOString()
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

    // Return comprehensive order data for admin dashboard
    const adminOrders = [
      {
        id: 15,
        subject: 'HIPAA Breach Notification',
        status: 'Fulfilled',
        created_at: '2024-06-21T09:45:00Z',
        recipientCount: 75,
        totalCost: 95.25,
        practiceName: 'UMass Occupational Therapy',
        userEmail: 'practice@umass.edu',
        invoiceNumber: 'INV-1521',
        files: {
          letterDocument: 'hipaa_breach_letter.pdf',
          recipients: 'recipients_list.csv',
          letterhead: 'umass_letterhead.pdf'
        },
        statusHistory: [
          { status: 'Quote', timestamp: '2024-06-20T10:00:00Z' },
          { status: 'Converted', timestamp: '2024-06-21T09:00:00Z' },
          { status: 'In Process', timestamp: '2024-06-21T09:45:00Z' },
          { status: 'Fulfilled', timestamp: '2024-06-22T14:30:00Z' }
        ],
        adminNotes: 'Priority order - completed ahead of schedule'
      },
      {
        id: 188,
        subject: 'Practice Relocation Notice',
        status: 'Pending Approval',
        created_at: new Date().toISOString(),
        recipientCount: 150,
        totalCost: 127.50,
        practiceName: 'UMass Occupational Therapy',
        userEmail: 'practice@umass.edu',
        invoiceNumber: null,
        files: {
          letterDocument: 'relocation_notice.docx',
          recipients: 'patient_addresses.csv',
          logo: 'practice_logo.png',
          signature: 'doctor_signature.png'
        },
        statusHistory: [
          { status: 'Quote', timestamp: new Date(Date.now() - 86400000).toISOString() },
          { status: 'Converted', timestamp: new Date().toISOString() }
        ],
        adminNotes: ''
      },
      {
        id: 9999,
        subject: 'Provider Departure - Dr. Smith',
        status: 'In Process',
        created_at: new Date().toISOString(),
        recipientCount: 250,
        totalCost: 287.50,
        practiceName: 'North Valley Clinic',
        userEmail: 'admin@northvalley.com',
        invoiceNumber: 'INV-2231',
        files: {
          letterDocument: 'departure_notice.pdf',
          recipients: 'all_patients.csv',
          letterhead: 'clinic_letterhead.pdf',
          enclosures: 'provider_directory.pdf'
        },
        statusHistory: [
          { status: 'Quote', timestamp: new Date(Date.now() - 172800000).toISOString() },
          { status: 'Converted', timestamp: new Date(Date.now() - 86400000).toISOString() },
          { status: 'In Process', timestamp: new Date().toISOString() }
        ],
        adminNotes: 'Large batch - requires special handling'
      }
    ];

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

