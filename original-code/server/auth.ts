import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { sql } from 'drizzle-orm';

export interface SimpleAuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: number;
    practiceName: string;
    role: string;
  };
}

// Simple authentication middleware using sessions
export function requireAuth(req: SimpleAuthRequest, res: Response, next: NextFunction) {
  console.log('🔐 Session check:', req.session?.userId ? 'User logged in' : 'No user session');
  console.log('Session debug:', {
    sessionId: req.session?.id,
    userId: req.session?.userId,
    hasUserData: !!req.session?.userData,
    cookies: req.headers.cookie,
    userAgent: req.headers['user-agent']
  });
  
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Add user data to request
  req.user = req.session.userData;
  
  // Also set tenantId for tenant-aware operations
  req.tenantId = req.session.userData?.tenantId;
  
  next();
}

// Login function
export async function loginUser(email: string, password: string) {
  try {
    // Query the users table with tenant information
    const result = await db.execute(sql`
      SELECT u.*, t.name as tenant_name 
      FROM users u 
      JOIN tenants t ON u.tenant_id = t.id 
      WHERE u.email = ${email}
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    const user = result.rows[0] as any;
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Return user data (without password hash)
    return {
      id: user.id,
      email: user.email,
      firstName: 'Admin', // Default first name
      lastName: 'User',   // Default last name
      tenantId: user.tenant_id,
      practiceName: user.tenant_name,
      role: user.role
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Get all practices for the login dropdown
export async function getAllPractices() {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT t.id, t.name as practice_name 
      FROM tenants t 
      ORDER BY t.name
    `);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      practice_name: row.practice_name
    }));
  } catch (error) {
    console.error('Error fetching practices:', error);
    return [];
  }
}