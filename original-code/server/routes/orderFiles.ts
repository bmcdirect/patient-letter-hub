import { Request, Response } from 'express';
import { storage } from '../storage';

export async function list(req: Request, res: Response) {
  try {
    const orderId = parseInt(req.params.orderId);
    const orderFiles = await storage.getOrderFiles(orderId);
    res.json(orderFiles);
  } catch (error) {
    console.error('Error listing order files:', error);
    res.status(500).json({ error: 'Failed to list order files' });
  }
}