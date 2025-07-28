import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertQuoteSchema } from '../../shared/schema';

export async function list(req: Request, res: Response) {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const userId = (req as any).session?.userId;
    
    (req as any).log.info({ tenantId, userId }, 'Listing quotes');
    
    const quotes = await storage.getQuotesByTenant(tenantId);
    res.json(quotes);
  } catch (error) {
    (req as any).log.error({ error, tenantId: parseInt(req.params.tenantId), userId: (req as any).session?.userId }, 'Error listing quotes');
    res.status(500).json({ error: 'Failed to list quotes' });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const userId = (req as any).session?.userId;
    const letterType = req.body.letterType || req.body.subject;
    const quoteNumber = `Q-${Date.now()}`;
    
    (req as any).log.info({ tenantId, userId, letterType, quoteNumber }, 'Creating quote');
    
    const quoteData = insertQuoteSchema.parse({
      ...req.body,
      tenantId,
      quoteNumber
    });
    
    const quote = await storage.createQuote(quoteData);
    
    (req as any).log.info({ tenantId, userId, letterType, quoteNumber, quoteId: quote.id }, 'Quote created successfully');
    
    res.status(201).json(quote);
  } catch (error) {
    (req as any).log.error({ error, tenantId: parseInt(req.params.tenantId), userId: (req as any).session?.userId, letterType: req.body.letterType || req.body.subject }, 'Error creating quote');
    res.status(500).json({ error: 'Failed to create quote' });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const quoteId = parseInt(req.params.id);
    const userId = (req as any).session?.userId;
    const tenantId = (req as any).tenantId;
    const letterType = req.body.letterType || req.body.subject;
    const updates = req.body;
    
    (req as any).log.info({ quoteId, userId, tenantId, letterType }, 'Updating quote');
    
    const quote = await storage.updateQuote(quoteId, updates);
    
    (req as any).log.info({ quoteId, userId, tenantId, letterType }, 'Quote updated successfully');
    
    res.json(quote);
  } catch (error) {
    (req as any).log.error({ error, quoteId: parseInt(req.params.id), userId: (req as any).session?.userId, tenantId: (req as any).tenantId, letterType: req.body.letterType || req.body.subject }, 'Error updating quote');
    res.status(500).json({ error: 'Failed to update quote' });
  }
}

export async function remove(req: Request, res: Response) {
  res.json({ message: 'Delete quote functionality not implemented' });
}

export async function getStats(req: Request, res: Response) {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const userId = (req as any).session?.userId;
    
    (req as any).log.info({ tenantId, userId }, 'Getting dashboard stats');
    
    const quotes = await storage.getQuotesByTenant(tenantId);
    const orders = await storage.getOrdersByTenant(tenantId);
    
    // Calculate statistics
    const myQuotes = quotes.length;
    const myOrders = orders.length;
    const pendingQuotes = quotes.filter((q: any) => q.status === 'pending').length;
    const activeOrders = orders.filter((o: any) => o.status === 'in-progress').length;
    
    const stats = {
      myQuotes,
      myOrders,
      pendingQuotes,
      activeOrders,
      totalQuotes: myQuotes,
      totalOrders: myOrders,
      completedOrders: orders.filter((o: any) => o.status === 'completed').length,
      pendingOrders: orders.filter((o: any) => o.status === 'pending').length
    };
    
    (req as any).log.info({ tenantId, userId, stats }, 'Dashboard stats calculated');
    
    res.json(stats);
  } catch (error) {
    (req as any).log.error({ error, tenantId: parseInt(req.params.tenantId), userId: (req as any).session?.userId }, 'Error getting dashboard stats');
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
}