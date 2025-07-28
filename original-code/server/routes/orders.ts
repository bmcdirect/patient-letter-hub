import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertOrderSchema } from '../../shared/schema';
import multer from 'multer';

// Configure multer for file uploads
export const upload = multer({ dest: 'uploads/' });

export async function list(req: Request, res: Response) {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const userId = (req as any).session?.userId;
    
    (req as any).log.info({ tenantId, userId }, 'Listing orders');
    
    const orders = await storage.getOrdersByTenant(tenantId);
    
    (req as any).log.info({ tenantId, userId, orderCount: orders.length }, 'Orders retrieved successfully');
    
    res.json(orders);
  } catch (error) {
    (req as any).log.error({ error, tenantId: parseInt(req.params.tenantId), userId: (req as any).session?.userId }, 'Error listing orders');
    res.status(500).json({ error: 'Failed to list orders' });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const tenantId = (req as any).tenantId || parseInt(req.params.tenantId);
    const sessionUserId = (req as any).session?.userId;
    const letterType = req.body.letterType || req.body.subject;
    const orderNumber = `O-${Date.now()}`;
    
    (req as any).log.info({
      tenantId,
      userId: sessionUserId,
      letterType,
      orderNumber,
      hasFiles: !!(req.files as Express.Multer.File[])?.length
    }, 'Creating order');
    
    // Ensure we have required fields with proper fallbacks
    if (!sessionUserId && !req.body.userId) {
      (req as any).log.error({ tenantId, sessionUserId, letterType }, 'No userId found in session or request body');
      return res.status(400).json({ error: 'User authentication required' });
    }
    
    // Parse form data - convert strings to numbers where needed
    const processedData = {
      ...req.body,
      tenantId,
      practiceId: req.body.practiceId ? parseInt(req.body.practiceId) : tenantId, // Default to tenantId
      userId: req.body.userId ? parseInt(req.body.userId) : sessionUserId, // Use session user ID or request body
      orderNumber, // Use pre-generated order number
      total: req.body.total || "25.00", // Default total with realistic value
      status: req.body.status || "pending", // Default status
      subject: req.body.subject || "Test Order" // Default subject
    };
    
    (req as any).log.info({ 
      tenantId, 
      userId: sessionUserId, 
      letterType, 
      orderNumber, 
      total: processedData.total,
      status: processedData.status 
    }, 'Processed order data');
    
    const orderData = insertOrderSchema.parse(processedData);
    
    const order = await storage.createOrder(orderData);
    
    // Handle file uploads if any
    const files = req.files as Express.Multer.File[];
    let fileCount = 0;
    if (files && files.length > 0) {
      for (const file of files) {
        await storage.createOrderFile({
          orderId: order.id,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
        fileCount++;
      }
    }
    
    (req as any).log.info({ 
      tenantId, 
      userId: sessionUserId, 
      letterType, 
      orderNumber, 
      orderId: order.id,
      fileCount
    }, 'Order created successfully');
    
    res.status(201).json(order);
  } catch (error) {
    (req as any).log.error({ 
      error, 
      tenantId: (req as any).tenantId || parseInt(req.params.tenantId),
      userId: (req as any).session?.userId,
      letterType: req.body.letterType || req.body.subject
    }, 'Error creating order');
    res.status(500).json({ error: 'Failed to create order' });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const order = await storage.updateOrder(id, updates);
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
}

export async function remove(req: Request, res: Response) {
  res.json({ message: 'Delete order functionality not implemented' });
}