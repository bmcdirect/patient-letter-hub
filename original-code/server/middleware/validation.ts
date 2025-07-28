import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// Generic validation middleware for request body
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      console.warn('Validation error:', error);
      return res.status(400).json({ 
        message: 'Invalid request data',
        errors: error instanceof Error ? error.message : 'Validation failed'
      });
    }
  };
};

// Validate query parameters
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      console.warn('Query validation error:', error);
      return res.status(400).json({ 
        message: 'Invalid query parameters',
        errors: error instanceof Error ? error.message : 'Validation failed'
      });
    }
  };
};

// Rate limiting middleware (simple implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // requests per window

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  let clientData = requestCounts.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    clientData = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    requestCounts.set(clientId, clientData);
    next();
  } else if (clientData.count < RATE_LIMIT_MAX) {
    clientData.count++;
    next();
  } else {
    res.status(429).json({ 
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [clientId, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(clientId);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes