import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  // Add user ID to session for easier access
  if (req.user && typeof req.user === 'object' && 'id' in req.user) {
    req.session.userId = req.user.id as string;
  }
  
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  
  // Check if user has admin privileges
  if (req.user && typeof req.user === 'object' && 'isAdmin' in req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
}