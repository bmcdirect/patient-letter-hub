# PatientLetterHub - Healthcare Communication Platform

## Overview

PatientLetterHub is a healthcare communication SaaS platform that enables healthcare practices to generate, print, and mail patient notification letters with complete compliance. The application provides a streamlined workflow for creating various types of patient communications including practice relocations, closures, provider departures, and HIPAA breach notifications.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with custom Tailwind CSS styling (shadcn/ui)
- **Styling**: Tailwind CSS with custom healthcare-focused color palette
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Authentication**: OpenID Connect with Replit Auth integration
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Database**: PostgreSQL with Drizzle ORM
- **Payment Processing**: Stripe integration for credit purchases and subscriptions

### Data Storage
- **Primary Database**: PostgreSQL via Neon Database
- **ORM**: Drizzle with TypeScript schema definitions
- **Session Storage**: PostgreSQL sessions table for authentication persistence
- **Migration Strategy**: Drizzle Kit for schema migrations

## Key Components

### Authentication System
- **Provider**: Replit OpenID Connect
- **Session Management**: Server-side sessions with PostgreSQL storage
- **Authorization**: Route-level authentication middleware
- **User Management**: Automatic user provisioning on first login

### Database Schema
- **Users**: Profile information and authentication data
- **Practices**: Healthcare practice information including NPI, address, taxonomy
- **Templates**: Letter templates for different event types (relocation, closure, etc.)
- **Letter Jobs**: Mailing job tracking and status
- **Addresses**: Patient address management
- **Letters**: Individual letter generation and tracking
- **Alerts**: Compliance and system notifications

### Letter Generation Workflow
1. **Template Selection**: Choose from pre-built templates or create custom
2. **Data Upload**: CSV upload for patient addresses and data
3. **Letter Generation**: Template variable substitution with patient data
4. **Job Creation**: Submit letter jobs for processing
5. **Print & Mail**: Integration with postal services for delivery

### Simplified Architecture
- **Direct Letter Generation**: Create and manage letters without payment barriers
- **Focus on Core Features**: Template selection, data upload, and letter processing
- **Streamlined Workflow**: Immediate access to all letter generation features

## Data Flow

1. **User Authentication**: OpenID Connect flow with Replit
2. **Practice Setup**: Users create practice profiles with required healthcare information
3. **Template Selection**: Choose from compliance-ready templates or create custom
4. **Data Upload**: CSV file processing for patient information
5. **Letter Generation**: Server-side template processing with patient data merge
6. **Cost Calculation**: Dynamic pricing based on letter count and type
7. **Payment Processing**: Stripe integration for credit purchases
8. **Job Submission**: Letter job creation and tracking
9. **Delivery Tracking**: Real-time status updates for mailed letters

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL for primary data storage
- **Authentication**: Replit OpenID Connect for user authentication
- **Payments**: Stripe for credit purchases and subscription management
- **Email/SMS**: Potential future integration for delivery notifications

### Development Dependencies
- **Build Tools**: Vite, TypeScript, ESBuild for production builds
- **Testing**: Framework ready for test implementation
- **Linting**: TypeScript strict mode enabled
- **Deployment**: Replit deployment configuration

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Development Server**: Vite dev server with hot module replacement
- **Port Configuration**: Application runs on port 5000

### Production Deployment
- **Build Process**: Vite production build with ESBuild server bundling
- **Deployment Target**: Replit Autoscale for automatic scaling
- **Environment Variables**: Secure configuration for database, auth, and Stripe
- **Static Assets**: Vite-optimized asset bundling and serving

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **SESSION_SECRET**: Session encryption key
- **STRIPE_SECRET_KEY**: Stripe API credentials
- **REPLIT_DOMAINS**: Allowed domains for OIDC
- **ISSUER_URL**: OpenID Connect issuer endpoint

## Changelog

```
Changelog:
- June 14, 2025. Initial setup
- June 15, 2025. Credit system completely removed - eliminated all payment functionality, Stripe integration, and credit-based pricing to focus on core letter generation features
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```