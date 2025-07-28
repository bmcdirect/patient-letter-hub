# PatientLetterHub Phase 2 Architecture Plan

## Executive Summary
Based on our current MVP (multi-tenant uploads → offline proof generation → approval workflow → status updates), this plan outlines the evolution to a scalable, compliance-ready healthcare SaaS platform.

## Current Architecture Analysis

### Strengths
- **Multi-tenant foundation**: Complete tenant isolation with proper database schema
- **Proven workflows**: Quote-to-order → proof → approval → invoice pipeline working
- **Authentication**: Dual auth system (customer + operations) with proper session management
- **Database integrity**: 15+ tables with foreign key relationships and tenant_id isolation
- **File management**: Project files system with revision tracking

### Architectural Debt
- **Monolithic structure**: All services in single Express.js application
- **Tight coupling**: Business logic mixed with API routes
- **Limited scalability**: Single database connection pool
- **Manual compliance**: No automated regulatory monitoring

## 1. Service Architecture Strategy

### Recommended Approach: **Modular Monolith → Selective Microservices**

**Keep Monolithic (Phase 2A):**
- **Core Business Logic**: Quote/Order management, pricing calculations
- **Authentication & Authorization**: Single point of auth truth
- **Database Operations**: Maintain single PostgreSQL instance
- **File Management**: Local file storage with S3 migration path

**Split into Microservices (Phase 2B):**
- **Compliance Service**: Federal/state regulation monitoring
- **Notification Router**: Email, SMS, webhook distribution
- **Proof Engine**: PDF generation, template processing
- **Tenant Management**: Multi-tenant provisioning, billing

### Proposed Folder Structure
```
/services
  /core                    # Main application (current monolith)
    /api                   # API routes
    /business-logic        # Domain services
    /data-access          # Database layer
  /compliance-service      # Federal/state regulation monitoring
  /notification-service    # Email, SMS, webhook routing
  /proof-engine           # PDF generation, template processing
  /tenant-service         # Multi-tenant management
/shared
  /types                  # TypeScript interfaces
  /schemas                # Validation schemas
  /utils                  # Common utilities
/infrastructure
  /database              # Migration scripts, seed data
  /deployment            # Docker, K8s configs
  /monitoring            # Logging, metrics
```

## 2. Data Model & API Architecture

### Multi-Tenant Data Strategy

**Current Implementation:** ✅ Tenant-scoped tables with tenant_id foreign keys

**Phase 2 Enhancements:**
```sql
-- Compliance tracking
CREATE TABLE compliance_events (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  event_type VARCHAR(100), -- 'regulation_change', 'deadline_alert', 'audit_required'
  source VARCHAR(50), -- 'cms', 'state_health_dept', 'oig'
  priority VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
  title TEXT,
  description TEXT,
  effective_date DATE,
  deadline_date DATE,
  metadata JSONB,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit trail for compliance
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  user_id VARCHAR REFERENCES users(id),
  action VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id INTEGER,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Integration connectors
CREATE TABLE integration_configs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  provider VARCHAR(50), -- 'cms_api', 'state_health_api', 'usps_api'
  config JSONB, -- API keys, endpoints, polling intervals
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Design Patterns

**RESTful + Event-Driven Architecture:**
```typescript
// Core API (existing)
GET    /api/tenants/:id/orders
POST   /api/tenants/:id/orders
PUT    /api/tenants/:id/orders/:orderId

// Compliance API (new)
GET    /api/tenants/:id/compliance/events
POST   /api/tenants/:id/compliance/events/:eventId/acknowledge
GET    /api/tenants/:id/compliance/audit

// Notification API (new)
POST   /api/notifications/email
POST   /api/notifications/sms
POST   /api/notifications/webhook
GET    /api/notifications/status/:id

// Proof Engine API (new)
POST   /api/proof/generate
GET    /api/proof/status/:jobId
GET    /api/proof/download/:jobId
```

## 3. Compliance Integration Architecture

### Federal/State Compliance Sources

**Primary Integration Points:**
1. **CMS (Centers for Medicare & Medicaid Services)**
   - API: CMS Open Data API
   - Data: Medicare provider updates, compliance bulletins
   - Frequency: Daily polling

2. **State Health Departments**
   - API: State-specific APIs (varies by state)
   - Data: Licensing updates, regulatory changes
   - Frequency: Weekly polling

3. **OIG (Office of Inspector General)**
   - API: OIG Exclusion Database API
   - Data: Provider exclusions, compliance alerts
   - Frequency: Daily polling

### Compliance Service Architecture
```typescript
// Compliance Service Interface
interface ComplianceService {
  // Source management
  registerSource(source: ComplianceSource): Promise<void>;
  syncSources(): Promise<SyncResult[]>;
  
  // Event processing
  processEvents(events: ComplianceEvent[]): Promise<void>;
  getEvents(tenantId: number, filters?: EventFilters): Promise<ComplianceEvent[]>;
  
  // Alerting
  createAlert(alert: ComplianceAlert): Promise<void>;
  getAlerts(tenantId: number): Promise<ComplianceAlert[]>;
  
  // Audit
  logAction(action: AuditAction): Promise<void>;
  getAuditTrail(tenantId: number): Promise<AuditEntry[]>;
}

// Event Bus for real-time updates
interface EventBus {
  publish(event: string, data: any): Promise<void>;
  subscribe(event: string, handler: EventHandler): void;
}
```

## 4. Security & Authentication Architecture

### Recommended: **API Gateway + Service Mesh Pattern**

**API Gateway (Phase 2A):**
```typescript
// Single JWT gateway for all services
class APIGateway {
  // Authentication
  authenticate(token: string): Promise<User>;
  
  // Authorization
  authorize(user: User, resource: string, action: string): boolean;
  
  // Rate limiting
  rateLimit(tenantId: number, endpoint: string): boolean;
  
  // Request routing
  route(request: Request): Service;
}
```

**Service-to-Service Authentication:**
```typescript
// Internal service tokens
interface ServiceToken {
  serviceId: string;
  permissions: string[];
  expiresAt: Date;
}

// Per-tenant API keys for external integrations
interface TenantAPIKey {
  tenantId: number;
  keyId: string;
  scopes: string[];
  rateLimit: number;
}
```

### Security Layers
1. **External API**: JWT tokens, rate limiting, tenant isolation
2. **Internal Services**: Service tokens, mTLS
3. **Database**: Row-level security, encrypted at rest
4. **File Storage**: Tenant-scoped buckets, signed URLs

## 5. High-Level Roadmap

### Phase 2A: Foundation (4-6 weeks)
**Core Refactors:**
- [ ] **Service Layer Extraction**: Move business logic from routes to services
- [ ] **Data Access Layer**: Create repository pattern for database operations
- [ ] **API Gateway**: Implement centralized authentication and routing
- [ ] **Event System**: Add internal event bus for decoupled communication
- [ ] **Audit Logging**: Implement comprehensive action tracking

**New Modules:**
- [ ] **Compliance Data Model**: Add compliance_events, audit_log, integration_configs tables
- [ ] **Notification Service**: Email/SMS/webhook routing system
- [ ] **Configuration Management**: Tenant-specific settings and feature flags

### Phase 2B: Compliance Integration (6-8 weeks)
**Compliance Service Development:**
- [ ] **CMS Integration**: Daily polling of CMS Open Data API
- [ ] **State Health Dept APIs**: Multi-state compliance monitoring
- [ ] **OIG Integration**: Provider exclusion monitoring
- [ ] **Alert System**: Real-time compliance notifications
- [ ] **Dashboard Integration**: Compliance widgets for tenant dashboards

**Scale Preparation:**
- [ ] **Database Optimization**: Query optimization, connection pooling
- [ ] **Caching Layer**: Redis for frequently accessed data
- [ ] **File Storage Migration**: S3 with CDN for proof files
- [ ] **Monitoring**: APM, error tracking, performance metrics

### Phase 2C: Microservices Split (8-10 weeks)
**Service Extraction:**
- [ ] **Proof Engine**: Separate PDF generation service
- [ ] **Notification Service**: Independent routing service
- [ ] **Compliance Service**: Standalone compliance monitoring
- [ ] **Tenant Service**: Multi-tenant management portal

**Production Readiness:**
- [ ] **Load Testing**: Multi-tenant stress testing
- [ ] **Security Audit**: Penetration testing, compliance review
- [ ] **Documentation**: API docs, deployment guides
- [ ] **Monitoring**: Full observability stack

## Checkpoints & Success Metrics

### Checkpoint 1: Service Layer (Week 4)
- [ ] All business logic extracted from routes
- [ ] Repository pattern implemented
- [ ] 100% test coverage for service layer
- [ ] API response times < 200ms

### Checkpoint 2: Compliance-Feed Ready (Week 8)
- [ ] Compliance service deployed
- [ ] CMS integration functional
- [ ] Alert system operational
- [ ] Tenant dashboard updated

### Checkpoint 3: Scale Testing (Week 12)
- [ ] 100 concurrent tenants supported
- [ ] 1000 orders/hour processing
- [ ] 99.9% uptime maintained
- [ ] Compliance SLA met (<15min alert delivery)

## Risk Mitigation

### Technical Risks
- **Database Performance**: Implement read replicas, query optimization
- **File Storage Limits**: Migrate to S3 with lifecycle policies
- **API Rate Limits**: Implement caching, request batching
- **Compliance API Changes**: Version management, fallback mechanisms

### Business Risks
- **Regulatory Changes**: Automated monitoring, legal review process
- **Tenant Churn**: Usage analytics, early warning systems
- **Security Breaches**: Zero-trust architecture, regular audits
- **Scaling Costs**: Resource optimization, auto-scaling

This architecture plan provides a clear path from the current MVP to a scalable, compliance-ready healthcare SaaS platform while maintaining system stability and development velocity.