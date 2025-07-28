# PatientLetterHub Architecture Diagrams

## Current Architecture (Phase 1)
```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (Vite)                                         │
│  ├── Customer Dashboard    ├── Operations Dashboard             │
│  ├── Quote Management      ├── Order Processing                │
│  ├── Proof Review         ├── File Management                  │
│  └── Authentication       └── Admin Controls                   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/REST
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MONOLITHIC API                             │
├─────────────────────────────────────────────────────────────────┤
│  Express.js Server                                              │
│  ├── Authentication Routes     ├── File Upload Routes          │
│  ├── Quote/Order APIs         ├── Proof Generation             │
│  ├── Practice Management      ├── Email Notifications          │
│  └── Admin APIs              └── Cost Calculation              │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ SQL
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (Multi-tenant)                                      │
│  ├── Tenants           ├── Orders          ├── Files           │
│  ├── Users             ├── Quotes          ├── Revisions       │
│  ├── Practices         ├── Templates       ├── Approvals       │
│  └── Sessions          └── Invoices        └── Emails          │
└─────────────────────────────────────────────────────────────────┘
```

## Phase 2 Target Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend + Mobile Apps                                   │
│  ├── Customer Portal      ├── Operations Dashboard             │
│  ├── Compliance Dashboard ├── Analytics & Reporting            │
│  └── Multi-tenant Admin   └── Integration Management           │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS/WSS
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                │
├─────────────────────────────────────────────────────────────────┤
│  ├── Authentication & Authorization                             │
│  ├── Rate Limiting & Throttling                                │
│  ├── Request Routing & Load Balancing                          │
│  └── API Versioning & Documentation                            │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   CORE SERVICE      │  │ COMPLIANCE SERVICE  │  │ NOTIFICATION SERVICE│
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ ├── Order Management│  │ ├── CMS Integration │  │ ├── Email Router    │
│ ├── Quote Processing│  │ ├── State Health API│  │ ├── SMS Gateway     │
│ ├── Practice Mgmt   │  │ ├── OIG Monitoring  │  │ ├── Webhook Manager │
│ ├── File Management │  │ ├── Alert Engine    │  │ ├── Template Engine │
│ └── Payment Processing│  │ └── Audit Logger   │  │ └── Delivery Status │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
            │                        │                        │
            │                        │                        │
            └────────────────────────┼────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EVENT BUS                                  │
├─────────────────────────────────────────────────────────────────┤
│  ├── Order Status Updates      ├── Compliance Alerts           │
│  ├── File Processing Events    ├── Notification Triggers       │
│  ├── Audit Events             ├── System Health Metrics       │
│  └── Real-time Sync           └── Integration Events          │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   PROOF ENGINE      │  │  TENANT SERVICE     │  │  ANALYTICS ENGINE   │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ ├── PDF Generation  │  │ ├── Tenant Provisio-│  │ ├── Usage Tracking  │
│ ├── Template Engine │  │ ├── Billing Mgmt    │  │ ├── Performance Mtrs│
│ ├── Asset Processing│  │ ├── Feature Flags   │  │ ├── Business Intel  │
│ ├── Version Control │  │ ├── Multi-tenant    │  │ ├── Compliance Rprt │
│ └── Quality Assurance│  │ └── User Management │  │ └── Audit Reports   │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA & STORAGE LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   PostgreSQL      │  │   Redis Cache   │  │   File Storage  │ │
│  │   (Multi-tenant)  │  │   (Sessions,    │  │   (S3 + CDN)    │ │
│  │   - Read Replicas │  │    API Cache,   │  │   - Proof Files │ │
│  │   - Partitioning  │  │    Rate Limits) │  │   - Templates   │ │
│  │   - Backup/Recovery│  │                 │  │   - Uploads     │ │
│  └───────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Compliance Integration Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL COMPLIANCE SOURCES                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  │ CMS Open    │  │ State Health│  │ OIG Database│  │ Custom APIs │
│  │ Data API    │  │ Dept APIs   │  │ API         │  │ (Future)    │
│  │ (Daily)     │  │ (Weekly)    │  │ (Daily)     │  │ (On-demand) │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Scheduled Polling
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                 COMPLIANCE SERVICE                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ Source Manager  │  │ Event Processor │  │ Alert Engine    │   │
│  │ - API Connectors│  │ - Data Validation│  │ - Rule Engine   │   │
│  │ - Rate Limiting │  │ - Tenant Mapping│  │ - Priority Calc │   │
│  │ - Error Handling│  │ - Deduplication │  │ - Notification  │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Filtered Events
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TENANT-SPECIFIC PROCESSING                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ Tenant A        │  │ Tenant B        │  │ Tenant C        │   │
│  │ ├─Cardiovascular│  │ ├─Pediatrics    │  │ ├─Orthopedics   │   │
│  │ ├─California    │  │ ├─Texas         │  │ ├─New York      │   │
│  │ └─Critical Only │  │ └─All Alerts    │  │ └─Weekly Digest │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Personalized Alerts
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NOTIFICATION DELIVERY                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ Email Alerts    │  │ Dashboard       │  │ API Webhooks    │   │
│  │ - Immediate     │  │ - Real-time     │  │ - Third-party   │   │
│  │ - Daily Digest  │  │ - Historical    │  │ - Integration   │   │
│  │ - Weekly Report │  │ - Analytics     │  │ - Automation    │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                      REQUEST LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────┤
│  1. User Request                                                │
│     ├── Authentication (JWT)                                   │
│     ├── Tenant Resolution                                      │
│     └── Rate Limiting                                          │
│                                                                 │
│  2. Service Routing                                             │
│     ├── API Gateway                                            │
│     ├── Load Balancer                                          │
│     └── Service Discovery                                      │
│                                                                 │
│  3. Business Logic                                              │
│     ├── Validation                                             │
│     ├── Authorization                                          │
│     └── Processing                                             │
│                                                                 │
│  4. Data Operations                                             │
│     ├── Database Queries                                       │
│     ├── Cache Operations                                       │
│     └── File Storage                                           │
│                                                                 │
│  5. Event Generation                                            │
│     ├── Audit Logging                                          │
│     ├── Notification Triggers                                  │
│     └── Real-time Updates                                      │
│                                                                 │
│  6. Response Formation                                          │
│     ├── Data Serialization                                     │
│     ├── Error Handling                                         │
│     └── Response Caching                                       │
└─────────────────────────────────────────────────────────────────┘
```

This architecture supports:
- **High Availability**: Service redundancy and load balancing
- **Scalability**: Horizontal scaling of individual services
- **Security**: Multi-layered security with tenant isolation
- **Compliance**: Automated monitoring and audit trails
- **Maintainability**: Clear separation of concerns
- **Flexibility**: Easy integration of new compliance sources