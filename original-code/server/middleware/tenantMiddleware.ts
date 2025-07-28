import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { users } from '../../shared/schema';
import { db } from '../db';

export async function tenantMiddleware(
  req: Request, res: Response, next: NextFunction
) {
  const headerTenant = req.header('X-Tenant-Id');
  if (headerTenant) {
    req.tenantId = parseInt(headerTenant, 10);
    return next();
  }
  
  const sessionUserId = req.session?.userId;
  if (sessionUserId) {
    const user = await db
      .select({ tenantId: users.tenantId })
      .from(users)
      .where(eq(users.id, sessionUserId))
      .limit(1)
      .then(r => r[0]);
    
    if (user) {
      req.tenantId = user.tenantId;
      return next();
    }
  }
  
  return res.status(400).json({ error: 'Tenant context not resolved' });
}