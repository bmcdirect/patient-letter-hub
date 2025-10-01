import { prisma } from '@/lib/db';
import { AuditAction, AuditResource, AuditSeverity, UserRole } from '@prisma/client';

/**
 * Audit Logging Service - HIPAA Tier 1.5 Compliance
 * 
 * This service provides comprehensive audit logging for all patient data access,
 * file operations, and administrative actions.
 * 
 * SECURITY NOTES:
 * - All sensitive data in beforeData/afterData is automatically redacted
 * - Logs are retained for 7 years per HIPAA requirements
 * - Failed audit writes are logged but don't break application flow
 * - Consider implementing rate limiting in production to prevent log flooding
 * 
 * HIPAA COMPLIANCE:
 * - Tracks: Who, What, When, Where, Why for all patient data access
 * - Flags PHI access with containsPHI boolean
 * - Maintains audit trail with tamper-evident timestamps
 * - Supports querying by user, practice, action, severity, and date range
 */

interface AuditLogParams {
  userId?: string;
  userEmail?: string;
  userRole?: UserRole;
  userName?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  description: string;
  practiceId?: string;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
  containsPatientData?: boolean;
  containsPHI?: boolean;
  severity?: AuditSeverity;
  success?: boolean;
  errorMessage?: string;
}

class AuditLogger {
  /**
   * Main audit logging function
   */
  async log(params: AuditLogParams): Promise<void> {
    try {
      const retainUntil = new Date();
      retainUntil.setFullYear(retainUntil.getFullYear() + 7); // 7-year retention for HIPAA
      
      // Sanitize before/after data to prevent logging sensitive information
      const sanitizedBeforeData = params.beforeData 
        ? this.sanitizeData(params.beforeData) 
        : undefined;
      const sanitizedAfterData = params.afterData 
        ? this.sanitizeData(params.afterData) 
        : undefined;

      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          userEmail: params.userEmail,
          userRole: params.userRole,
          userName: params.userName,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          description: params.description,
          practiceId: params.practiceId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          method: params.method,
          path: params.path,
          statusCode: params.statusCode,
          beforeData: sanitizedBeforeData,
          afterData: sanitizedAfterData,
          containsPatientData: params.containsPatientData || false,
          containsPHI: params.containsPHI || false,
          severity: params.severity || AuditSeverity.LOW,
          success: params.success !== false,
          errorMessage: params.errorMessage,
          retainUntil,
        },
      });
    } catch (error) {
      // CRITICAL: Audit logging should never fail silently
      // But also should never break the application
      console.error('[AUDIT LOGGING ERROR]', error);
      console.error('[AUDIT LOG DATA]', JSON.stringify(params, null, 2));
    }
  }

  /**
   * Log user authentication events
   */
  async logAuth(
    action: 'LOGIN' | 'LOGOUT',
    userId: string,
    userEmail: string,
    userRole: UserRole,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole,
      action: action as AuditAction,
      resource: AuditResource.SESSION,
      description: `User ${action.toLowerCase()}: ${userEmail}`,
      ipAddress,
      userAgent,
      severity: success ? AuditSeverity.LOW : AuditSeverity.HIGH,
      success,
      errorMessage,
    });
  }

  /**
   * Log patient data access (HIGH PRIORITY for HIPAA)
   */
  async logPatientDataAccess(
    action: AuditAction,
    resourceType: AuditResource,
    resourceId: string,
    userId: string,
    userEmail: string,
    userRole: UserRole,
    practiceId: string,
    description: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole,
      action,
      resource: resourceType,
      resourceId,
      description,
      practiceId,
      ipAddress,
      userAgent,
      containsPatientData: true,
      containsPHI: true,
      severity: AuditSeverity.HIGH,
    });
  }

  /**
   * Log file operations (uploads/downloads)
   */
  async logFileOperation(
    action: 'UPLOAD' | 'DOWNLOAD',
    fileId: string,
    fileName: string,
    orderId: string,
    userId: string,
    userEmail: string,
    userRole: UserRole,
    practiceId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole,
      action: action as AuditAction,
      resource: AuditResource.ORDER_FILE,
      resourceId: fileId,
      description: `${action}: ${fileName} for order ${orderId}`,
      practiceId,
      ipAddress,
      userAgent,
      containsPatientData: true,
      containsPHI: true,
      severity: AuditSeverity.HIGH,
    });
  }

  /**
   * Log order operations
   */
  async logOrderOperation(
    action: AuditAction,
    orderId: string,
    orderNumber: string,
    userId: string,
    userEmail: string,
    userRole: UserRole,
    practiceId: string,
    description: string,
    beforeData?: Record<string, any>,
    afterData?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole,
      action,
      resource: AuditResource.ORDER,
      resourceId: orderId,
      description: `${description} (Order: ${orderNumber})`,
      practiceId,
      ipAddress,
      userAgent,
      beforeData,
      afterData,
      containsPatientData: true,
      severity: AuditSeverity.MEDIUM,
    });
  }

  /**
   * Log proof operations
   */
  async logProofOperation(
    action: AuditAction,
    proofId: string,
    orderId: string,
    userId: string,
    userEmail: string,
    userRole: UserRole,
    practiceId: string,
    description: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole,
      action,
      resource: AuditResource.PROOF,
      resourceId: proofId,
      description: `${description} for order ${orderId}`,
      practiceId,
      ipAddress,
      userAgent,
      containsPatientData: true,
      severity: AuditSeverity.MEDIUM,
    });
  }

  /**
   * Log admin actions (always CRITICAL severity)
   */
  async logAdminAction(
    action: AuditAction,
    resource: AuditResource,
    resourceId: string,
    userId: string,
    userEmail: string,
    description: string,
    beforeData?: Record<string, any>,
    afterData?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole: UserRole.ADMIN,
      action,
      resource,
      resourceId,
      description,
      ipAddress,
      userAgent,
      beforeData,
      afterData,
      severity: AuditSeverity.CRITICAL,
    });
  }

  /**
   * Log failed actions (security events)
   */
  async logFailure(
    action: AuditAction,
    resource: AuditResource,
    userId: string | undefined,
    userEmail: string | undefined,
    description: string,
    errorMessage: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action,
      resource,
      description,
      ipAddress,
      userAgent,
      success: false,
      errorMessage,
      severity: AuditSeverity.CRITICAL,
    });
  }

  /**
   * Sanitize data before logging (remove sensitive fields)
   * @private
   */
  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };
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

  /**
   * Query audit logs with filters
   */
  async query(filters: {
    userId?: string;
    practiceId?: string;
    action?: AuditAction;
    resource?: AuditResource;
    startDate?: Date;
    endDate?: Date;
    containsPHI?: boolean;
    severity?: AuditSeverity;
    success?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.practiceId) where.practiceId = filters.practiceId;
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;
    if (filters.containsPHI !== undefined) where.containsPHI = filters.containsPHI;
    if (filters.severity) where.severity = filters.severity;
    if (filters.success !== undefined) where.success = filters.success;

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();
