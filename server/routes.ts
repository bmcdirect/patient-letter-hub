import { Request, Response } from 'express';
import { Express } from 'express';
import { db } from './db';
import { users, practices, quotes, orders } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { requireAuth, requireAdmin } from './middleware/auth';

export function registerRoutes(app: Express) {
  console.log('Registering API routes...');

  // === AUTHENTICATION ENDPOINTS ===
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      // Query database for user
      const result = await db.execute(`SELECT id, email, password_hash, is_admin FROM users WHERE email = '${email}'`);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const dbUser = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, dbUser.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Store user in session
      req.session.user = {
        id: String(dbUser.id),
        email: dbUser.email,
        is_admin: dbUser.is_admin
      };

      console.log(`User ${email} logged in with ID ${dbUser.id}`);

      res.json({
        success: true,
        user: {
          id: String(dbUser.id),
          email: dbUser.email,
          is_admin: dbUser.is_admin
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, firstName, lastName, password } = req.body;
      
      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'All fields are required: email, firstName, lastName, password' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 6 characters long' 
        });
      }

      // Check if user already exists
      const existingUser = await db.execute(`SELECT id FROM users WHERE email = '${email}'`);
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const result = await db.execute(
        `INSERT INTO users (email, first_name, last_name, password_hash, is_admin) 
         VALUES ('${email}', '${firstName}', '${lastName}', '${hashedPassword}', false) 
         RETURNING id, email, is_admin`
      );

      if (result.rows.length === 0) {
        return res.status(500).json({ success: false, message: 'Failed to create user' });
      }

      const newUser = result.rows[0];

      // Store user in session
      req.session.user = {
        id: String(newUser.id),
        email: newUser.email,
        is_admin: false
      };

      console.log(`New user registered: ${email} with ID ${newUser.id}`);

      res.json({
        success: true,
        user: {
          id: String(newUser.id),
          email: newUser.email,
          is_admin: false
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.get('/api/auth/user', (req: Request, res: Response) => {
    if (req.session?.user) {
      res.json({ success: true, user: req.session.user });
    } else {
      res.status(401).json({ success: false, message: 'Not authenticated' });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ success: false, message: 'Logout failed' });
      }
      res.clearCookie('sessionId');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  // === QUOTES ENDPOINTS ===
  app.get('/api/quotes', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      let userQuotes;
      let retries = 3;
      
      while (retries > 0) {
        try {
          userQuotes = await db.execute(
            `SELECT q.*, p.name as practice_name 
             FROM quotes q 
             LEFT JOIN practices p ON q.practice_id = p.id 
             WHERE q.user_id = '${userId}' 
             ORDER BY q.created_at DESC`
          );
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!userQuotes) {
        userQuotes = { rows: [] };
      }

      const formattedQuotes = userQuotes.rows.map((quote: any) => ({
        id: quote.id,
        quoteNumber: quote.quote_number,
        subject: quote.subject,
        practice_name: quote.practice_name || 'Unassigned',
        estimated_recipients: quote.estimated_recipients,
        totalEstimate: parseFloat(quote.total_cost),
        created_at: quote.created_at,
        status: quote.status,
        converted_order_id: quote.converted_order_id
      }));

      res.json({
        success: true,
        quotes: formattedQuotes
      });
    } catch (error) {
      console.error('Error fetching quotes:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/quotes', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const userId = req.session.user.id;
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

      // Validate required fields
      if (!location_id || !subject || !estimatedRecipients) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: location_id, subject, estimatedRecipients'
        });
      }

      // Calculate cost
      const recipients = parseInt(estimatedRecipients);
      const baseRate = colorMode === 'color' ? 0.65 : 0.50;
      let totalCost = recipients * baseRate;
      
      if (dataCleansing) totalCost += 25;
      if (ncoaUpdate) totalCost += 50;
      if (firstClassPostage) totalCost += recipients * 0.68;

      // Generate quote number
      const quoteCount = await db.execute('SELECT COUNT(*) as count FROM quotes');
      const quoteNumber = `Q-${(parseInt(quoteCount.rows[0].count) + 1001).toString()}`;

      // Insert quote
      const result = await db.execute(
        `INSERT INTO quotes (user_id, quote_number, practice_id, location_id, subject, template_type, color_mode, estimated_recipients, enclosures, notes, data_cleansing, ncoa_update, first_class_postage, total_cost, status) 
         VALUES ('${userId}', '${quoteNumber}', '${location_id}', '${location_id}', '${subject}', '${templateType}', '${colorMode}', ${recipients}, ${enclosures || 0}, '${notes || ''}', ${dataCleansing || false}, ${ncoaUpdate || false}, ${firstClassPostage || false}, ${totalCost.toFixed(2)}, 'Quote') 
         RETURNING id`
      );

      if (result.rows.length === 0) {
        return res.status(500).json({ success: false, message: 'Failed to create quote' });
      }

      const quoteId = result.rows[0].id;
      console.log(`Quote created successfully: ${quoteNumber} for user ${userId}`);

      res.json({
        success: true,
        message: 'Quote created successfully',
        quoteId: quoteNumber,
        quote: {
          id: quoteId,
          quote_number: quoteNumber,
          subject: subject,
          total_cost: totalCost.toFixed(2)
        }
      });
    } catch (error) {
      console.error('Error creating quote:', error);
      res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
    }
  });

  app.get('/api/quotes/:id', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      const quoteId = req.params.id;
      
      console.log(`Fetching quote ${quoteId} for user ${userId}`);

      // Find quote by quote_number (Q-XXXX) or by ID
      let result;
      if (quoteId.startsWith('Q-')) {
        result = await db.execute(
          `SELECT q.*, COALESCE(p.name, 'Default Practice') as practice_name 
           FROM quotes q 
           LEFT JOIN practices_new p ON CAST(q.practice_location_id AS text) = CAST(p.id AS text)
           WHERE q.quote_number = '${quoteId}' AND CAST(q.user_id AS text) = '${userId}'`
        );
      } else {
        result = await db.execute(
          `SELECT q.*, COALESCE(p.name, 'Default Practice') as practice_name 
           FROM quotes q 
           LEFT JOIN practices_new p ON CAST(q.practice_location_id AS text) = CAST(p.id AS text)
           WHERE q.id = ${quoteId} AND CAST(q.user_id AS text) = '${userId}'`
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      const quote = result.rows[0] as any;
      res.json({
        success: true,
        quote: {
          id: quote.id,
          quoteNumber: quote.quote_number,
          subject: quote.subject,
          practiceLocation: quote.practice_name,
          templateType: quote.template_type,
          colorMode: quote.color_mode,
          estimatedRecipients: quote.estimated_recipients,
          enclosures: quote.enclosures,
          notes: quote.notes,
          dataCleansing: quote.data_cleansing,
          ncoaUpdate: quote.ncoa_update,
          firstClassPostage: quote.first_class_postage,
          totalCost: parseFloat(quote.total_cost),
          status: quote.status,
          createdAt: quote.created_at
        }
      });
    } catch (error) {
      console.error('Error fetching quote:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.put('/api/quotes/:id', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      let quoteId = req.params.id;
      
      // Handle Q-XXXX format
      if (quoteId.startsWith('Q-')) {
        quoteId = quoteId.substring(2);
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

      // Check if quote exists and belongs to user
      const existingQuote = await db.execute(
        `SELECT id, status FROM quotes WHERE id = ${quoteId} AND user_id = '${userId}'`
      );

      if (existingQuote.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      if (existingQuote.rows[0].status === 'Converted') {
        return res.status(400).json({ success: false, message: 'Cannot edit converted quotes' });
      }

      // Calculate new cost
      const recipients = parseInt(estimatedRecipients);
      const baseRate = colorMode === 'color' ? 0.65 : 0.50;
      let totalCost = recipients * baseRate;
      
      if (dataCleansing) totalCost += 25;
      if (ncoaUpdate) totalCost += 50;
      if (firstClassPostage) totalCost += recipients * 0.68;

      // Update quote
      await db.execute(
        `UPDATE quotes SET 
         location_id = '${location_id}',
         subject = '${subject}',
         template_type = '${templateType}',
         color_mode = '${colorMode}',
         estimated_recipients = ${recipients},
         enclosures = ${enclosures || 0},
         notes = '${notes || ''}',
         data_cleansing = ${dataCleansing || false},
         ncoa_update = ${ncoaUpdate || false},
         first_class_postage = ${firstClassPostage || false},
         total_cost = ${totalCost.toFixed(2)},
         updated_at = NOW()
         WHERE id = ${quoteId} AND user_id = '${userId}'`
      );

      console.log(`Quote ${quoteId} updated successfully`);

      res.json({
        success: true,
        message: 'Quote updated successfully'
      });
    } catch (error) {
      console.error('Error updating quote:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.delete('/api/quotes/:id', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      let quoteId = req.params.id;
      
      // Handle Q-XXXX format
      if (quoteId.startsWith('Q-')) {
        quoteId = quoteId.substring(2);
      }

      // Check if quote exists and belongs to user
      const existingQuote = await db.execute(
        `SELECT id, status FROM quotes WHERE id = ${quoteId} AND user_id = '${userId}'`
      );

      if (existingQuote.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      if (existingQuote.rows[0].status === 'Converted') {
        return res.status(400).json({ success: false, message: 'Cannot delete converted quotes' });
      }

      // Delete quote
      await db.execute(`DELETE FROM quotes WHERE id = ${quoteId} AND user_id = '${userId}'`);

      console.log(`Quote ${quoteId} deleted successfully`);

      res.json({
        success: true,
        message: 'Quote deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting quote:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/quotes/:id/convert', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      const quoteId = req.params.id;
      
      console.log(`Converting quote ${quoteId} for user ${userId}`);

      // Find quote by quote_number (Q-XXXX) or by ID  
      const quoteResult = await db.execute(
        `SELECT * FROM quotes WHERE quote_number = '${quoteId}' AND CAST(user_id AS text) = '${userId}' AND status = 'Quote'`
      );

      if (quoteResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      const quote = quoteResult.rows[0];
      const quoteNumber = quote.quote_number;

      if (quote.status === 'Converted') {
        return res.status(400).json({ success: false, message: 'Quote already converted' });
      }

      // Generate order number
      const orderCount = await db.execute('SELECT COUNT(*) as count FROM orders');
      const orderNumber = `O-${(parseInt(orderCount.rows[0].count) + 1001).toString()}`;

      // Create order from quote
      const newOrder = await db.execute(
        `INSERT INTO orders (user_id, order_number, practice_id, subject, template_type, color_mode, estimated_recipients, recipient_count, enclosures, notes, data_cleansing, ncoa_update, first_class_postage, total_cost, status, production_start_date, production_end_date) 
         VALUES ('${userId}', '${orderNumber}', ${quote.practice_id || 'NULL'}, '${quote.subject}', '${quote.template_type}', '${quote.color_mode}', ${quote.estimated_recipients}, ${quote.estimated_recipients}, ${quote.enclosures}, '${quote.notes || ''}', ${quote.data_cleansing}, ${quote.ncoa_update}, ${quote.first_class_postage}, ${quote.total_cost}, 'Pending Approval', '${new Date().toISOString().split('T')[0]}', '${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}') 
         RETURNING id`
      );

      await db.execute(
        `UPDATE quotes SET 
         status = 'Converted',
         converted_order_id = '${orderNumber}',
         updated_at = NOW()
         WHERE quote_number = '${quote.quote_number}'`
      );

      console.log(`Quote ${quoteNumber} converted to order ${orderNumber}`);

      res.json({
        success: true,
        message: 'Quote converted to order successfully',
        orderId: orderNumber,
        order: newOrder.rows[0]
      });
    } catch (error) {
      console.error('Error converting quote to order:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });

  // === ORDERS ENDPOINTS ===
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      console.log('GET /api/orders - Fetching orders');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.session.user.id;

      // Use a retry mechanism for database queries
      let userOrders;
      let retries = 3;
      while (retries > 0) {
        try {
          userOrders = await db.execute(
            `SELECT o.*, p.name as practice_name 
             FROM orders o 
             LEFT JOIN practices p ON o.practice_id = p.id 
             WHERE o.user_id = '${userId}' 
             ORDER BY o.created_at DESC`
          );
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          console.log(`Database query failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!userOrders) {
        userOrders = { rows: [] };
      }

      console.log(`Found ${userOrders.rows.length} orders for user ${userId}`);

      const formattedOrders = userOrders.rows.map((order: any) => ({
        jobId: order.id,
        orderId: order.order_number,
        subject: order.subject,
        practiceName: order.practice_name || 'Unassigned',
        status: order.status,
        recipients: order.recipient_count || order.estimated_recipients,
        totalCost: parseFloat(order.total_cost || '0'),
        createdAt: order.created_at,
        fulfilledAt: order.fulfilled_at
      }));

      res.json({
        success: true,
        orders: formattedOrders
      });

    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      console.log('POST /api/orders - Creating new order');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const userId = req.session.user.id;
      console.log('Creating order for user:', userId);

      // Extract form data - handle both JSON and FormData
      let orderData;
      if (req.headers['content-type']?.includes('application/json')) {
        orderData = req.body;
      } else {
        // Handle FormData from the order form
        orderData = {
          practiceLocation: req.body.practiceLocation || '5', // Default to main practice
          subject: req.body.subject || 'New Letter Order',
          letterDocument: req.body.letterDocument,
          recipientList: req.body.recipientList,
          letterColor: req.body.letterColor || 'black',
          enclosures: parseInt(req.body.enclosures) || 0,
          dataCleansing: req.body.dataCleansing === 'on',
          ncoaUpdate: req.body.ncoaUpdate === 'on',
          firstClassPostage: req.body.firstClassPostage === 'on'
        };
      }

      console.log('Order data:', orderData);

      // Generate order number
      const orderCount = await db.execute('SELECT COUNT(*) as count FROM orders');
      const orderNumber = `O-${(parseInt(orderCount.rows[0].count) + 1001).toString()}`;

      // Calculate estimated cost
      const estimatedRecipients = 100; // Default estimate
      const baseRate = orderData.letterColor === 'color' ? 0.65 : 0.50;
      let totalCost = estimatedRecipients * baseRate;
      
      if (orderData.dataCleansing) totalCost += 25;
      if (orderData.ncoaUpdate) totalCost += 50;
      if (orderData.firstClassPostage) totalCost += estimatedRecipients * 0.68;

      // Insert order into database with retry logic
      let result;
      let retries = 3;
      while (retries > 0) {
        try {
          result = await db.execute(
            `INSERT INTO orders (user_id, order_number, practice_id, subject, template_type, color_mode, estimated_recipients, recipient_count, enclosures, data_cleansing, ncoa_update, first_class_postage, total_cost, status, production_start_date, production_end_date) 
             VALUES ('${userId}', '${orderNumber}', '${orderData.practiceLocation}', '${orderData.subject}', 'custom', '${orderData.letterColor}', ${estimatedRecipients}, ${estimatedRecipients}, ${orderData.enclosures}, ${orderData.dataCleansing}, ${orderData.ncoaUpdate}, ${orderData.firstClassPostage}, ${totalCost.toFixed(2)}, 'Pending', '${new Date().toISOString().split('T')[0]}', '${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}') 
             RETURNING id`
          );
          break;
        } catch (error) {
          retries--;
          console.log(`Database insertion failed, retrying... (${retries} attempts left)`, error);
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (result.rows.length === 0) {
        return res.status(500).json({ success: false, message: 'Failed to create order' });
      }

      const orderId = result.rows[0].id;
      console.log(`Order created successfully with ID: ${orderId}, Order Number: ${orderNumber}`);

      res.json({
        success: true,
        message: 'Order created successfully',
        orderId: orderNumber,
        jobId: orderId,
        order: {
          id: orderId,
          order_number: orderNumber,
          subject: orderData.subject,
          status: 'Pending',
          total_cost: totalCost.toFixed(2)
        }
      });

    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
    }
  });

  app.get('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      let orderId = req.params.id;
      
      // Handle O-XXXX format
      if (orderId.startsWith('O-')) {
        orderId = orderId.substring(2);
      }

      const result = await db.execute(
        `SELECT o.*, p.name as practice_name 
         FROM orders o 
         LEFT JOIN practices p ON o.practice_id = p.id 
         WHERE o.id = ${orderId} AND o.user_id = '${userId}'`
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const order = result.rows[0];
      res.json({
        success: true,
        jobId: order.id,
        orderId: order.order_number,
        subject: order.subject,
        status: order.status,
        createdAt: order.created_at,
        practice: order.practice_name,
        recipients: order.recipient_count || order.estimated_recipients,
        totalCost: parseFloat(order.total_cost || '0')
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // === PRACTICE SETTINGS ENDPOINTS ===
  app.get('/api/settings/practice', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      
      const result = await db.execute(
        `SELECT * FROM practices WHERE owner_id = '${userId}' ORDER BY id LIMIT 1`
      );

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          practice: null
        });
      }

      const practice = result.rows[0];
      res.json({
        success: true,
        practice: {
          id: practice.id,
          name: practice.name,
          contact_prefix: practice.default_sender_name ? practice.default_sender_name.split(' ')[0] : '',
          contact_first_name: practice.default_sender_name ? practice.default_sender_name.split(' ')[1] || '' : '',
          contact_last_name: practice.default_sender_name ? practice.default_sender_name.split(' ').slice(2).join(' ') : '',
          phone: practice.phone,
          email: practice.email,
          main_address: practice.address,
          main_city: practice.city,
          main_state: practice.state,
          main_zip: practice.zip_code
        }
      });
    } catch (error) {
      console.error('Error fetching practice:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/settings/practice', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      const practiceData = req.body;

      // Check if practice exists
      const existing = await db.execute(
        `SELECT id FROM practices WHERE owner_id = '${userId}' LIMIT 1`
      );

      if (existing.rows.length > 0) {
        // Update existing practice
        await db.execute(
          `UPDATE practices SET 
           name = '${practiceData.name}',
           default_sender_name = '${practiceData.contact_first_name} ${practiceData.contact_last_name}',
           phone = '${practiceData.phone}',
           email = '${practiceData.email}',
           address = '${practiceData.main_address}',
           city = '${practiceData.main_city}',
           state = '${practiceData.main_state}',
           zip_code = '${practiceData.main_zip}'
           WHERE owner_id = '${userId}'`
        );
      } else {
        // Create new practice with required taxonomy field
        await db.execute(
          `INSERT INTO practices (user_id, name, taxonomy, npi, address, phone, email, contact_name, contact_phone, created_at, updated_at) 
           VALUES ('${userId}', '${practiceData.name}', '207Q00000X', '', '${practiceData.mainAddress || ''}', '${practiceData.phone}', '${practiceData.email}', '${practiceData.contactPrefix || ''} ${practiceData.contactFirstName || ''} ${practiceData.contactLastName || ''}', '', NOW(), NOW())`
        );
      }

      res.json({
        success: true,
        message: 'Practice information saved successfully'
      });
    } catch (error) {
      console.error('Error saving practice:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.get('/api/settings/practice/locations', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      
      const result = await db.execute(
        `SELECT * FROM practices WHERE owner_id = '${userId}' ORDER BY id`
      );

      // Format locations data to match expected structure
      const locations = result.rows.map((practice: any, index: number) => ({
        id: practice.id,
        practice_id: practice.id,
        location_number: index === 0 ? 0 : practice.id,
        name: practice.name,
        contact_prefix: practice.default_sender_name ? practice.default_sender_name.split(' ')[0] : '',
        contact_first_name: practice.default_sender_name ? practice.default_sender_name.split(' ')[1] || '' : '',
        contact_middle_initial: '',
        contact_last_name: practice.default_sender_name ? practice.default_sender_name.split(' ').slice(2).join(' ') : '',
        contact_suffix: '',
        phone: practice.phone || '',
        email: practice.email || '',
        address_line1: practice.address || '',
        address_line2: '',
        city: practice.city || '',
        state: practice.state || '',
        zip_code: practice.zip_code || '',
        is_default: index === 0,
        active: true
      }));

      res.json({
        success: true,
        locations: locations
      });

    } catch (error) {
      console.error('Error fetching practice locations:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/settings/practice/locations', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      console.log('Adding practice location for user:', userId, 'Data:', req.body);

      const locationData = req.body;

      // Get user's main practice ID first
      const practiceResult = await db.execute(
        `SELECT id FROM practices WHERE owner_id = '${userId}' LIMIT 1`
      );
      
      if (practiceResult.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'No practice found. Please create a practice first.' });
      }
      
      const practiceId = practiceResult.rows[0].id;
      
      // Insert into practice_locations table
      const result = await db.execute(
        `INSERT INTO practice_locations (practice_id, label, contact_name, phone, email, address, city, state, zip_code, is_default, active) 
         VALUES (${practiceId}, '${locationData.name}', '${locationData.contactPrefix || ''} ${locationData.contactFirstName || ''} ${locationData.contactLastName || ''}', '${locationData.phone}', '', '${locationData.address}', '${locationData.city}', '${locationData.state}', '${locationData.zipCode}', ${locationData.isDefault || false}, ${locationData.active !== false}) 
         RETURNING id`
      );

      if (result.rows.length === 0) {
        return res.status(500).json({ success: false, message: 'Failed to create location' });
      }

      res.json({
        success: true,
        message: 'Location added successfully',
        locationId: result.rows[0].id
      });

    } catch (error) {
      console.error('Error adding practice location:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  console.log('All API routes registered successfully');
}