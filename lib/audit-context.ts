import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export interface AuditContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  userName?: string;
  practiceId?: string;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
}

/**
 * Extract audit context from Next.js request
 */
export async function getAuditContext(request: NextRequest): Promise<AuditContext> {
  const { userId } = await auth();
  
  // Extract IP address (handle various proxy headers)
  let ipAddress = 
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown';

  // Validate IP format to prevent header injection
  if (ipAddress !== 'unknown') {
    const ipv4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^[a-f0-9:]+$/i;
    
    if (!ipv4Regex.test(ipAddress) && !ipv6Regex.test(ipAddress)) {
      ipAddress = 'invalid';
    }
  }
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const method = request.method;
  const path = request.nextUrl.pathname;
  
  return {
    userId: userId || undefined,
    ipAddress,
    userAgent,
    method,
    path,
  };
}

/**
 * Helper to get current user details for audit logging
 */
export async function getCurrentUserForAudit() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      practiceId: true,
    },
  });
  
  return user;
}

/**
 * Sanitize data before logging (remove sensitive fields)
 */
export function sanitizeForAudit(data: any): any {
  if (!data) return null;
  
  const sanitized = { ...data };
  
  // Remove fields that should never be logged
  const sensitiveFields = [
    'password',
    'passwordHash',
    'apiKey',
    'secret',
    'token',
    'stripeSecret',
    'ssn',
    'socialSecurityNumber',
    'creditCard',
    'cardNumber',
    'cvv',
    'securityCode',
  ];
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}
