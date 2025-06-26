import express, { type Express, type Request, type Response } from 'express';
import { db } from './db';
import { quotes, orders, practices, type InsertQuote, type InsertOrder } from '../shared/schema';
import { eq, desc, and } from 'drizzle-orm';

// Export a function to register routes
export function registerRoutes(app: Express) {
  console.log('Registering API routes...');
  
  // === AUTH ENDPOINTS ===
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }
      const user = req.session.user;
      res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email,
          is_admin: false // Default to false for type safety
        } 
      });
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      const userId = email.includes('admin') ? '1' : '2';
      const testUser = {
        id: userId,
        email: email,
        firstName: 'Test',
        lastName: 'User'
      };

      req.session.user = testUser;
      req.session.userId = userId;

      console.log(`User ${email} logged in with ID ${userId}`);
      res.json({ 
        success: true, 
        user: { 
          id: userId, 
          email: email, 
          is_admin: email.includes('admin') 
        } 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      
      // Destroy the session completely
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        
        // Clear the session cookie
        res.clearCookie('sessionId');
        console.log('User logged out successfully');
        res.json({ success: true, message: 'Logged out successfully' });
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // === QUOTES ENDPOINTS ===
  app.get('/api/quotes', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      console.log('GET /api/quotes - Fetching quotes');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      console.log(`Fetching quotes for user ${userId}`);

      // Use a retry mechanism for database queries
      let userQuotes;
      let retries = 3;
      while (retries > 0) {
        try {
          userQuotes = await db
            .select()
            .from(quotes)
            .where(eq(quotes.user_id, userId))
            .orderBy(desc(quotes.created_at));
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          console.log(`Database query failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!userQuotes) {
        userQuotes = [];
      }

      console.log(`Found ${userQuotes.length} quotes`);

      const formattedQuotes = userQuotes.map(quote => ({
        id: quote.quote_number,
        subject: quote.subject,
        practiceLocation: `Practice Location (${quote.location_id})`,
        templateType: quote.template_type,
        estimatedRecipients: quote.estimated_recipients,
        totalCost: parseFloat(quote.total_cost || '0'),
        status: quote.status,
        createdAt: quote.created_at?.toISOString(),
        convertedOrderId: quote.converted_order_id
      }));

      res.json({ success: true, quotes: formattedQuotes });
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });

  app.get('/api/quotes/:id', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      console.log(`GET /api/quotes/${req.params.id}`);
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      let quoteId = req.params.id;
      const userId = req.session.user.id;
      
      if (quoteId.startsWith('Q-')) {
        quoteId = quoteId.substring(2);
      }
      
      const [quote] = await db
        .select()
        .from(quotes)
        .where(and(
          eq(quotes.quote_number, `Q-${quoteId}`),
          eq(quotes.user_id, userId)
        ));

      if (!quote) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      const formattedQuote = {
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
      };

      res.json({ success: true, quote: formattedQuote });
    } catch (error) {
      console.error('Failed to fetch quote:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });

  app.put('/api/quotes/:id', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      console.log(`PUT /api/quotes/${req.params.id}`);
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      let quoteId = req.params.id;
      const userId = req.session.user.id;
      
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
        dataCleansing,
        ncoaUpdate,
        firstClassPostage,
        notes
      } = req.body;

      if (!location_id || !subject || !templateType || !colorMode || !estimatedRecipients) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields' 
        });
      }

      const [existingQuote] = await db
        .select()
        .from(quotes)
        .where(and(
          eq(quotes.quote_number, `Q-${quoteId}`),
          eq(quotes.user_id, userId)
        ));

      if (!existingQuote) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      if (existingQuote.status === 'Converted') {
        return res.status(400).json({ success: false, message: 'Cannot edit converted quotes' });
      }

      const recipientCount = parseInt(estimatedRecipients) || 0;
      const enclosureCount = parseInt(enclosures) || 0;
      const baseRate = colorMode === 'color' ? 0.65 : 0.50;
      let totalCost = recipientCount * (baseRate + (enclosureCount * 0.10));
      
      if (dataCleansing === 'true' || dataCleansing === true) totalCost += 25;
      if (ncoaUpdate === 'true' || ncoaUpdate === true) totalCost += 50;
      if (firstClassPostage === 'true' || firstClassPostage === true) totalCost += recipientCount * 0.68;

      const [updatedQuote] = await db
        .update(quotes)
        .set({
          location_id: location_id,
          subject: subject,
          template_type: templateType,
          color_mode: colorMode,
          estimated_recipients: recipientCount,
          enclosures: enclosureCount,
          data_cleansing: dataCleansing === 'true' || dataCleansing === true,
          ncoa_update: ncoaUpdate === 'true' || ncoaUpdate === true,
          first_class_postage: firstClassPostage === 'true' || firstClassPostage === true,
          notes: notes || '',
          total_cost: totalCost.toFixed(2),
          updated_at: new Date()
        })
        .where(and(
          eq(quotes.quote_number, `Q-${quoteId}`),
          eq(quotes.user_id, userId)
        ))
        .returning();

      if (!updatedQuote) {
        return res.status(500).json({ success: false, message: 'Failed to update quote' });
      }

      res.json({ 
        success: true, 
        quote: updatedQuote,
        message: 'Quote updated successfully' 
      });
    } catch (error) {
      console.error('Error updating quote:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });

  app.post('/api/quotes', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      console.log('POST /api/quotes - Creating new quote');
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userId = req.session.user.id;
      const {
        location_id,
        subject,
        templateType,
        colorMode,
        estimatedRecipients,
        enclosures,
        dataCleansing,
        ncoaUpdate,
        firstClassPostage,
        notes
      } = req.body;

      if (!location_id || !subject || !templateType || !colorMode || !estimatedRecipients) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields' 
        });
      }

      const recipientCount = parseInt(estimatedRecipients) || 0;
      const enclosureCount = parseInt(enclosures) || 0;
      const baseRate = colorMode === 'color' ? 0.65 : 0.50;
      let totalCost = recipientCount * (baseRate + (enclosureCount * 0.10));
      
      if (dataCleansing === 'true' || dataCleansing === true) totalCost += 25;
      if (ncoaUpdate === 'true' || ncoaUpdate === true) totalCost += 50;
      if (firstClassPostage === 'true' || firstClassPostage === true) totalCost += recipientCount * 0.68;

      const quoteNumber = `Q-${Math.floor(Math.random() * 9000) + 1000}`;

      const [newQuote] = await db
        .insert(quotes)
        .values({
          quote_number: quoteNumber,
          user_id: userId,
          location_id: location_id,
          subject: subject,
          template_type: templateType,
          color_mode: colorMode,
          estimated_recipients: recipientCount,
          enclosures: enclosureCount,
          data_cleansing: dataCleansing === 'true' || dataCleansing === true,
          ncoa_update: ncoaUpdate === 'true' || ncoaUpdate === true,
          first_class_postage: firstClassPostage === 'true' || firstClassPostage === true,
          notes: notes || '',
          total_cost: totalCost.toFixed(2),
          status: 'Quote'
        })
        .returning();

      console.log(`Created quote ${quoteNumber} for user ${userId}`);

      res.json({ 
        success: true, 
        quote: newQuote,
        quoteNumber: quoteNumber,
        message: 'Quote created successfully' 
      });
    } catch (error) {
      console.error('Error creating quote:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });

  // Delete quote
  app.delete('/api/quotes/:id', async (req: Request, res: Response) => {
    try {
      console.log(`DELETE /api/quotes/${req.params.id}`);
      
      if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const userId = req.session.user.id;
      const quoteId = req.params.id;

      console.log(`Deleting quote ${quoteId} for user ${userId}`);

      // Handle both Q-XXXX and numeric formats
      let quoteNumber = quoteId;
      if (!quoteNumber.startsWith('Q-')) {
        quoteNumber = `Q-${quoteId}`;
      }

      // Find the quote by quote_number and user_id
      const [existingQuote] = await db
        .select()
        .from(quotes)
        .where(and(
          eq(quotes.quote_number, quoteNumber),
          eq(quotes.user_id, userId)
        ));

      if (!existingQuote) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      // Check if quote has been converted to an order
      if (existingQuote.status === 'Converted') {
        return res.status(400).json({ success: false, message: 'Cannot delete converted quotes' });
      }

      // Delete the quote
      await db
        .delete(quotes)
        .where(and(
          eq(quotes.quote_number, quoteNumber),
          eq(quotes.user_id, userId)
        ));

      console.log(`Successfully deleted quote ${quoteNumber}`);
      res.json({ success: true, message: 'Quote deleted successfully' });

    } catch (error) {
      console.error('Error deleting quote:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.post('/api/quotes/:id/convert', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      console.log(`POST /api/quotes/${req.params.id}/convert`);
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      let quoteNumber = req.params.id;
      const userId = req.session.user.id;
      
      if (!quoteNumber.startsWith('Q-')) {
        quoteNumber = `Q-${quoteNumber}`;
      }

      const [quote] = await db
        .select()
        .from(quotes)
        .where(and(
          eq(quotes.quote_number, quoteNumber),
          eq(quotes.user_id, userId)
        ));

      if (!quote) {
        return res.status(404).json({ success: false, message: 'Quote not found' });
      }

      if (quote.status === 'Converted') {
        return res.status(400).json({ 
          success: false, 
          message: 'Quote already converted'
        });
      }

      const orderNumber = `O-${Math.floor(Math.random() * 9000) + 1000}`;

      const [newOrder] = await db
        .insert(orders)
        .values({
          order_number: orderNumber,
          user_id: userId,
          quote_id: quote.id,
          quote_number: quote.quote_number,
          subject: quote.subject,
          template_type: quote.template_type,
          color_mode: quote.color_mode,
          estimated_recipients: quote.estimated_recipients,
          recipient_count: quote.estimated_recipients,
          enclosures: quote.enclosures,
          notes: quote.notes,
          data_cleansing: quote.data_cleansing,
          ncoa_update: quote.ncoa_update,
          first_class_postage: quote.first_class_postage,
          total_cost: quote.total_cost,
          status: 'Pending Approval',
          production_start_date: new Date().toISOString().split('T')[0],
          production_end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        .returning();

      await db
        .update(quotes)
        .set({ 
          status: 'Converted',
          converted_order_id: newOrder.id,
          updated_at: new Date()
        })
        .where(eq(quotes.id, quote.id));

      console.log(`Quote ${quoteNumber} converted to order ${orderNumber}`);

      res.json({
        success: true,
        message: 'Quote converted to order successfully',
        orderId: newOrder.order_number,
        order: newOrder
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
          userOrders = await db
            .select()
            .from(orders)
            .where(eq(orders.user_id, userId))
            .orderBy(desc(orders.created_at));
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          console.log(`Database query failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!userOrders) {
        userOrders = [];
      }

      console.log(`Found ${userOrders.length} orders for user ${userId}`);

      const formattedOrders = userOrders.map(order => ({
        id: order.order_number || `O-${order.id}`,
        order_number: order.order_number,
        jobId: order.id,
        subject: order.subject,
        status: order.status,
        createdAt: order.created_at?.toISOString(),
        recipientCount: order.recipient_count || order.estimated_recipients,
        cost: parseFloat(order.total_cost || '0'),
        practiceLocation: 'Practice Location',
        colorMode: order.color_mode,
        dataCleansing: order.data_cleansing,
        ncoaUpdate: order.ncoa_update,
        firstClassPostage: order.first_class_postage,
        quote_id: order.quote_number,
        templateType: order.template_type,
        enclosures: order.enclosures,
        notes: order.notes
      }));

      res.json({ success: true, orders: formattedOrders });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });

  app.get('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      console.log(`GET /api/orders/${req.params.id}`);
      
      if (!req.session?.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      let orderId = req.params.id;
      const userId = req.session.user.id;
      
      let orderQuery;
      if (orderId.startsWith('O-')) {
        orderQuery = and(
          eq(orders.order_number, orderId),
          eq(orders.user_id, userId)
        );
      } else {
        orderQuery = and(
          eq(orders.id, parseInt(orderId)),
          eq(orders.user_id, userId)
        );
      }

      const [order] = await db
        .select()
        .from(orders)
        .where(orderQuery);

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: 'Order not found' 
        });
      }

      const formattedOrder = {
        id: order.order_number,
        order_number: order.order_number,
        jobId: order.id,
        subject: order.subject,
        status: order.status,
        createdAt: order.created_at?.toISOString(),
        recipientCount: order.recipient_count || order.estimated_recipients,
        cost: parseFloat(order.total_cost || '0'),
        practiceLocation: 'Practice Location',
        colorMode: order.color_mode,
        dataCleansing: order.data_cleansing,
        ncoaUpdate: order.ncoa_update,
        firstClassPostage: order.first_class_postage,
        quote_id: order.quote_number,
        templateType: order.template_type,
        enclosures: order.enclosures,
        notes: order.notes
      };

      res.json({ 
        success: true, 
        order: formattedOrder 
      });
    } catch (error) {
      console.error('Error getting order:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Practice settings endpoints
  app.get('/api/settings/practice', async (req: Request, res: Response) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const userId = req.session.user.id;

      // Get user's main practice data using raw SQL
      const result = await db.execute(
        `SELECT * FROM practices WHERE owner_id = '${userId}' LIMIT 1`
      );

      const practice = result.rows.length > 0 ? result.rows[0] : null;

      res.json({
        success: true,
        practice: practice,
        locations: []
      });

    } catch (error) {
      console.error('Error fetching practice data:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  app.get('/api/settings/practice/locations', async (req: Request, res: Response) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const userId = req.session.user.id;

      // Get user's practice locations using raw SQL
      const result = await db.execute(
        `SELECT * FROM practices WHERE owner_id = '${userId}'`
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

  console.log('All API routes registered successfully');
}