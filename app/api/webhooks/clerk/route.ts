import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { upsertUserWithClerkId } from "@/lib/session-manager";

// HIPAA-compliant audit logging
function auditLog(event: string, details: Record<string, any>, userId?: string) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    userId: userId || 'system',
    source: 'clerk-webhook',
    details: {
      ...details,
      // Remove any PII from logs for HIPAA compliance
      email: details.email ? '[REDACTED]' : undefined,
      name: details.name ? '[REDACTED]' : undefined,
    }
  };
  
  console.log(`[AUDIT] ${JSON.stringify(logEntry)}`);
}

// Error handling with HIPAA-compliant logging
function handleError(error: any, context: string, userId?: string) {
  const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  auditLog('webhook_error', {
    errorId,
    context,
    errorType: error.constructor.name,
    message: error.message,
    // Don't log stack traces in production for security
    stack: process.env.NODE_ENV === 'development' ? error.stack : '[REDACTED]'
  }, userId);

  return {
    errorId,
    message: 'Internal server error',
    status: 500
  };
}

// Validate webhook signature
async function verifyWebhookSignature(request: NextRequest): Promise<boolean> {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      auditLog('webhook_security_error', {
        error: 'CLERK_WEBHOOK_SECRET not configured',
        severity: 'critical'
      });
      return false;
    }

    const headerPayload = headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      auditLog('webhook_security_error', {
        error: 'Missing required webhook headers',
        severity: 'high',
        headers: {
          svix_id: !!svix_id,
          svix_timestamp: !!svix_timestamp,
          svix_signature: !!svix_signature
        }
      });
      return false;
    }

    const payload = await request.text();
    const body = JSON.parse(payload);

    const wh = new Webhook(WEBHOOK_SECRET);
    wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });

    return true;
  } catch (error) {
    auditLog('webhook_security_error', {
      error: 'Webhook signature verification failed',
      severity: 'high',
      details: error.message
    });
    return false;
  }
}

// Handle user.created event
async function handleUserCreated(event: WebhookEvent) {
  try {
    const { id, email_addresses, first_name, last_name, created_at } = event.data;
    
    if (!id || !email_addresses || email_addresses.length === 0) {
      throw new Error('Invalid user data: missing required fields');
    }

    const email = email_addresses[0].email_address;
    const name = first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name || 'Unknown User';

    auditLog('user_creation_started', {
      clerkId: id,
      email: email,
      name: name,
      source: 'clerk_webhook'
    });

    // Create user with default role as USER
    const user = await upsertUserWithClerkId(id, {
      email,
      name,
      role: 'USER', // Default role for new users
      practiceId: null // Will be assigned later through profile setup
    });

    auditLog('user_creation_completed', {
      clerkId: id,
      databaseId: user.id,
      role: user.role,
      practiceId: user.practiceId
    });

    return { success: true, user };
  } catch (error) {
    auditLog('user_creation_failed', {
      clerkId: event.data?.id,
      error: error.message,
      severity: 'high'
    });
    throw error;
  }
}

// Handle user.updated event
async function handleUserUpdated(event: WebhookEvent) {
  try {
    const { id, email_addresses, first_name, last_name, updated_at } = event.data;
    
    if (!id) {
      throw new Error('Invalid user data: missing user ID');
    }

    const email = email_addresses?.[0]?.email_address;
    const name = first_name && last_name ? `${first_name} ${last_name}` : first_name || last_name;

    auditLog('user_update_started', {
      clerkId: id,
      email: email,
      name: name,
      source: 'clerk_webhook'
    });

    // Update existing user
    const user = await upsertUserWithClerkId(id, {
      email: email || undefined,
      name: name || undefined,
      // Don't change role or practiceId on updates - only profile info
    });

    auditLog('user_update_completed', {
      clerkId: id,
      databaseId: user.id,
      updatedFields: { email: !!email, name: !!name }
    });

    return { success: true, user };
  } catch (error) {
    auditLog('user_update_failed', {
      clerkId: event.data?.id,
      error: error.message,
      severity: 'high'
    });
    throw error;
  }
}

// Handle user.deleted event
async function handleUserDeleted(event: WebhookEvent) {
  try {
    const { id } = event.data;
    
    if (!id) {
      throw new Error('Invalid user data: missing user ID');
    }

    auditLog('user_deletion_started', {
      clerkId: id,
      source: 'clerk_webhook'
    });

    // Find user in database
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: id },
      select: { id: true, email: true, role: true }
    });

    if (!existingUser) {
      auditLog('user_deletion_skipped', {
        clerkId: id,
        reason: 'User not found in database'
      });
      return { success: true, message: 'User not found in database' };
    }

    // Soft delete: Remove clerkId but keep user record for audit purposes
    await prisma.user.update({
      where: { clerkId: id },
      data: { 
        clerkId: null,
        updatedAt: new Date()
      }
    });

    auditLog('user_deletion_completed', {
      clerkId: id,
      databaseId: existingUser.id,
      action: 'soft_delete'
    });

    return { success: true, user: existingUser };
  } catch (error) {
    auditLog('user_deletion_failed', {
      clerkId: event.data?.id,
      error: error.message,
      severity: 'high'
    });
    throw error;
  }
}

// Main webhook handler
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify webhook signature for security
    const isValidSignature = await verifyWebhookSignature(request);
    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse webhook event
    const payload = await request.json();
    const event = payload as WebhookEvent;

    auditLog('webhook_received', {
      eventType: event.type,
      clerkId: event.data?.id,
      timestamp: new Date().toISOString()
    });

    let result;
    let statusCode = 200;

    // Route to appropriate handler based on event type
    switch (event.type) {
      case 'user.created':
        result = await handleUserCreated(event);
        break;
      
      case 'user.updated':
        result = await handleUserUpdated(event);
        break;
      
      case 'user.deleted':
        result = await handleUserDeleted(event);
        break;
      
      default:
        auditLog('webhook_ignored', {
          eventType: event.type,
          reason: 'Event type not handled'
        });
        return NextResponse.json(
          { message: 'Event type not handled', eventType: event.type },
          { status: 200 }
        );
    }

    const processingTime = Date.now() - startTime;
    
    auditLog('webhook_processed', {
      eventType: event.type,
      clerkId: event.data?.id,
      processingTimeMs: processingTime,
      success: result.success
    });

    return NextResponse.json({
      success: true,
      eventType: event.type,
      processingTimeMs: processingTime,
      ...result
    }, { status: statusCode });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorResponse = handleError(error, 'webhook_processing', event?.data?.id);
    
    auditLog('webhook_failed', {
      eventType: event?.type,
      clerkId: event?.data?.id,
      processingTimeMs: processingTime,
      errorId: errorResponse.errorId
    });

    return NextResponse.json(
      { 
        success: false,
        error: errorResponse.message,
        errorId: errorResponse.errorId,
        processingTimeMs: processingTime
      },
      { status: errorResponse.status }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'clerk-webhook',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
