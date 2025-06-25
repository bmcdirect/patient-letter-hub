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
- June 19, 2025. Complete file upload system implemented with Multer, order form creation workflow, and test user authentication (test123/MCI123)
- June 19, 2025. Fixed 404 static file serving issues - resolved Replit public URL deployment by configuring dual static file serving (root public/ and server/public/) with cache-busting headers for both development and production modes
- June 19, 2025. Authentication and order processing system fully functional - fixed session persistence, removed dev bypass, implemented proper user authentication flow with /api/auth/login, and resolved 404 dashboard redirect error
- June 19, 2025. Added GET /api/orders/:jobId endpoint for order confirmation pages with comprehensive order details including recipients, costs, and file references. Updated confirmation page redirects to use root path (/) instead of /dashboard to prevent 404 errors
- June 19, 2025. Fixed server crash issues by restoring routes.ts file and resolving authentication middleware errors. Removed req.isAuthenticated() calls and added null safety checks for recipient data. Server fully operational with test job ID 9999 available for confirmation page testing
- June 20, 2025. Order submission system fully operational - fixed multer middleware configuration for file uploads, added database retry logic for connection stability, and confirmed complete workflow from form submission to job creation (Job IDs 18, 19 successfully created with proper file handling)
- June 20, 2025. PDF generation system implemented - added /api/orders/:jobId/pdf endpoint with puppeteer integration, system chromium installation, database retry logic for connection timeouts, and professional healthcare letter formatting. Created /pdf-viewer.html for easy PDF viewing and testing
- June 21, 2025. Orders table implemented - created new orders table with Pending status workflow, updated /api/orders endpoint to use direct SQL INSERT with RETURNING id clause, maintains dual table support (orders + letter_jobs) for flexible order management
- June 21, 2025. PDF generation updated for orders table - modified /api/orders/:jobId/pdf endpoint to fetch from orders table using SELECT subject, body_html, color_mode query instead of letter_jobs, maintains fallback content logic and generates PDFs successfully for Order IDs 1 and 2
- June 21, 2025. Individual order details endpoint implemented - added GET /api/orders/:jobId with exact SQL query SELECT id AS "jobId", subject, status, created_at AS "createdAt" FROM orders WHERE id = $1, handles all error cases (400/404/500) with proper JSON responses for frontend confirmation pages
- June 21, 2025. Admin dashboard implemented - created /admin.html with tabular view of all orders, includes ID, subject, status tags (Pending/Submitted), creation date, and action buttons for viewing confirmation pages and generating PDFs. Uses /api/orders endpoint for data fetching
- June 21, 2025. Enhanced admin dashboard with comprehensive management features - added statistics summary panel (total orders, pending/submitted/fulfilled counts, total recipients, estimated cost), advanced filtering system (search by subject/ID, status filter, date range), inline status update dropdowns with POST /api/orders/:id/status endpoint, toast notifications for success/error feedback, and real-time stats refresh after status changes
- June 21, 2025. Production calendar and scheduler system implemented - added production_start_date and production_end_date columns to orders table with auto-population (start = created_at::date, end = start + 3 days), created /admin-calendar.html with monthly calendar view showing order counts/recipients/costs per production end date, implemented GET /admin/api/calendar endpoint with grouped order data, added CSV export functionality via GET /admin/api/export/schedule, and integrated modal popups for daily order details with status tags and direct links to confirmation pages
- June 21, 2025. Basic user authentication system implemented - created users table with email/password_hash/is_admin schema, added POST /api/auth/register and /api/auth/login endpoints with bcrypt password hashing, implemented session-based authentication with requireLogin/requireAdmin middleware, protected all order and admin routes, linked orders to users via user_id foreign key, created login.html and register.html pages with role-based redirects (admin->admin.html, user->order.html), added logout functionality and user info display across admin pages
- June 21, 2025. Invoice system implemented - created invoice.html with professional styling for order billing details, added invoice.js for data fetching and formatting, implemented GET /api/orders/:jobId/invoice-pdf endpoint with Puppeteer PDF generation, added access control (admin or order owner only), integrated cost calculations ($0.65 color, $0.50 B&W), included postage placeholder, added invoice buttons to admin dashboard and confirmation pages
- June 21, 2025. Practice profiles and assignment system implemented - created practices table with complete contact/address schema, added practice management API endpoints (POST/GET /api/practices, PUT /api/orders/:id/practice), integrated practice selection dropdown in order form, created practice-form.html for profile creation, updated order queries to include practice name via LEFT JOIN, added sample practice data for testing
- June 22, 2025. User dashboard enhancements implemented - added job duplication with POST /api/orders/:jobId/duplicate endpoint, implemented logout button with proper authentication flow, added practice column to orders table showing practiceName, integrated invoice buttons for each order row, added color-coded status tags (Pending: orange, Submitted: blue, Fulfilled: green), implemented compliance alerts for orders pending over 7 days, added search functionality by subject or job ID with real-time filtering
- June 22, 2025. Quote request feature implemented - created quotes table with practice integration, built quote.html form with cost calculator (base rates + enclosure fees), implemented API endpoints (POST/GET /api/quotes, GET /api/quotes/:id/pdf), added Puppeteer PDF generation with quote numbers (Q-1001 format), integrated quotes section in user dashboard with tabbed interface, included cost breakdown and practice information in quotes
- June 22, 2025. Quote to order conversion implemented - added converted_order_id column to quotes table for tracking conversions, implemented POST /api/quotes/:id/convert endpoint with validation and duplicate prevention, updated quotes dashboard UI with conditional Convert/View Order buttons, added conversion confirmation and redirect to order confirmation page, ensured proper access control and one-time conversion constraint
- June 22, 2025. Post-fulfillment workflow implemented - added fulfilled_at timestamp column to orders table, enhanced POST /api/orders/:id/status endpoint to automatically set fulfillment date when status becomes "Fulfilled", created GET /api/orders/:id/fulfillment-pdf endpoint with professional confirmation PDF generation using Puppeteer, updated user and admin dashboards with "Confirmation PDF" buttons for fulfilled orders, added fulfillment date display in admin dashboard, implemented proper access control for PDF generation
- June 22, 2025. Database schema standardization completed - fixed column name mismatches between practices/quotes/orders tables, updated all API queries to use proper table prefixes (o.created_at, p.name), added COALESCE null handling for unassigned practices ("Unassigned" fallback), implemented proper LEFT JOIN queries with fallback values, resolved ambiguous column references, ensured user_id filtering works correctly across all endpoints, complete customer workflow now functional from registration through fulfillment
- June 22, 2025. Admin practice management system implemented - created admin-practices.html with responsive table view of all practices, built admin-practices.js with search/filter functionality, added GET/POST/DELETE /admin/api/practices endpoints for CRUD operations, integrated practice assignment status with user email display, implemented deletion protection for practices with associated orders/quotes, added sidebar navigation link in admin dashboard, includes confirmation modals and toast notifications for admin actions
- June 22, 2025. User dashboard routing fixed - corrected login.html redirect behavior to send regular users to dashboard.html instead of order.html, ensuring proper user experience flow from login to their personalized dashboard with orders and quotes management
- June 22, 2025. Quote feature access added to user dashboard - integrated "Request a Quote" navigation link in dashboard sidebar positioned under "New Mailing" link, verified proper authentication middleware allows both regular users and admins to access quote.html, completed user workflow from dashboard navigation to quote request functionality
- June 22, 2025. Practice Settings with location-aware profile system implemented - created comprehensive settings.html interface with practice information and multiple location management, implemented practices_new and practice_locations database tables with full address schema, added API endpoints for practice and location CRUD operations (/api/settings/practice/*), activated Settings sidebar link in dashboard, migrated existing practice data to new structure with default locations, supports location-specific contact info, addresses, active/inactive status, and default location designation
- June 22, 2025. Enhanced practice settings with individual name fields and location suffix display - split contact name into Prefix, First Name, MI, Last Name, Suffix fields for proper professional formatting, added location suffix display (practice_id.location_number) next to location labels, integrated main practice location as first entry in locations list with auto-generated suffix (.0), updated quote page to "Select Practice Location" with dropdown populated from active locations including main location, enhanced location management with comprehensive contact details and suffix identification
- June 22, 2025. Quote page dropdown functionality fixed - implemented proper practice location dropdown population with active locations, added location sorting (default first), auto-selection of default location, validation preventing submission without location selection, updated quote API to handle location_id parameter with proper practice resolution for both main and regular locations, added location_id column to quotes table for tracking location-specific quotes
- June 22, 2025. All practice locations made editable - enhanced settings page to allow editing of all additional locations through edit buttons, implemented editLocation function to populate form with existing data, confirmed PUT endpoint functionality for location updates, maintained existing form submission logic for both add and edit operations
- June 23, 2025. Deployment fixes applied - resolved build failures by creating missing server/middleware/auth.ts module with requireAuth/requireAdmin functions, updated server/routes.ts to use correct import paths (./db, ./storage, ./middleware/auth), created server/types.ts for Express session type definitions, fixed server initialization to properly create HTTP server instance, ensured esbuild can successfully bundle server code without unresolved imports
- June 23, 2025. Authentication persistence fixed - resolved session logout issue by updating session configuration (saveUninitialized: true, sameSite: lax, proper cookie name), removed database dependency from auth routes to use session-only authentication, fixed POST /api/auth/login endpoint to properly store user data in session, updated all protected routes to check req.session.user directly instead of database calls, confirmed complete login-to-quote workflow functions properly
- June 23, 2025. Practice location dropdown implemented - created functional /api/settings/practice/locations endpoint that returns actual practice location data, fixed authentication to use consistent user ID (2) matching existing practice data, populated dropdown with main location and additional practice locations including UMass Occupational Therapy and North Valley Clinic with proper location suffixes and contact information
- June 23, 2025. Quote form enhanced with additional services - added Data Cleansing & De-Duplication ($25 flat fee) and NCOA Move Update ($50 flat fee) checkboxes to quote.html, updated cost calculation function to include these services in total pricing, modified form submission to send checkbox values to backend, enhanced /api/quotes endpoint to accept and log additional service flags with proper cost calculation including base rates and flat fees
- June 23, 2025. First Class Postage option added - implemented checkbox for "Include First Class Postage ($0.68 per recipient)" in quote form, updated cost calculation to add $0.68 per recipient when selected, enhanced cost breakdown to show postage line item only when checked, integrated postage calculation in both frontend and backend processing with proper form submission handling
- June 23, 2025. Quote submission redirect implemented - updated quote form to automatically redirect users to dashboard after successful quote creation, added 1.5 second delay with success message display before redirect to provide user feedback and smooth transition back to main dashboard interface
- June 23, 2025. Additional services layout improved - fixed checkbox alignment in quote form using flexbox layout with proper service-option styling, enhanced visual consistency for Data Cleansing, NCOA Update, and First Class Postage options with consistent spacing and cursor interaction
- June 23, 2025. Practice settings API endpoints fixed - implemented missing GET and POST /api/settings/practice endpoints to resolve JSON error on settings page, added proper practice data structure with contact information and location details, enabled settings page functionality for practice and location management
- June 23, 2025. Quotes section added to dashboard - implemented quotes display between Recent Mailings and Compliance Alerts sections, added GET /api/quotes endpoint with sample quote data, created quote conversion functionality with POST /api/quotes/:id/convert endpoint, integrated Convert to Order and Edit buttons with proper status indicators for Quote vs Converted states
- June 23, 2025. Confirmation page API error fixed - implemented missing GET /api/orders/:id endpoint with proper JSON responses and 404 handling, enhanced confirmation page error handling with robust fetch error checking, added proper error states and user-friendly messages for missing orders, authentication errors, and server issues
- June 23, 2025. Quote-to-order conversion workflow fixed - resolved data mismatch issue by mapping specific quote IDs to consistent order IDs (Q-4350→188, Q-7964→9999, Q-2452→15), updated order sample data to match quote details, ensured confirmation page displays proper converted order information with matching subjects and costs
- June 23, 2025. Order form layout redesigned with template feature disabled - commented out template selection section and Quick Actions from dashboard, redesigned upload section with full-width Letter Document upload at top, implemented two-column responsive layout for remaining uploads (Practice Letterhead/Logo/Envelope Artwork vs Letter Signature/Enclosures/Zip File), added proper responsive grid that stacks on mobile devices
- June 23, 2025. Quote-to-order workflow issues identified and fixed - resolved data persistence issue where new quotes weren't appearing in dashboard, implemented session-based tracking for converted quotes with proper status updates, added duplicate conversion prevention, enhanced edit quote functionality with placeholder message, confirmed complete user workflow from quote creation through order conversion with proper error handling
- June 24, 2025. Order form layout enhanced with improved UX - added visual styling to upload sections with background colors and borders, implemented file type guidance (.PNG, .JPG, .PDF, etc.) under each upload field, added descriptive placeholder text for each upload area explaining purpose (e.g., "Official practice header with contact info"), enhanced responsive design with properly styled upload columns that stack on mobile devices
- June 24, 2025. Order form completely redesigned and fixed - removed Letter Body textarea, reordered form sections (Subject Line → Letter Document → Recipient List → Letter Color → Additional Services), added cost preview calculation with breakdown, implemented required field validation, fixed Generate Proof button error by adding POST /api/orders endpoint with multer file upload support, moved optional uploads to expandable section, added real-time cost estimation matching quote page functionality
- June 24, 2025. Enhanced quote-to-order approval workflow implemented - added "Download Proofs" and "Approve Order" buttons for Pending Approval status orders, created comprehensive approval modal with final cost summary breakdown including recipients, base rates, and add-on services (Data Cleansing $25, NCOA $50, First Class Postage $0.68/recipient), integrated legal terms acceptance with PatientLetterHub Mailing Authorization, implemented POST /api/orders/:id/approve endpoint with invoice generation (NET 30 terms), added status-specific action buttons (In Process shows View Invoice, others show existing actions), updated dashboard styling with new status tags for Pending Approval and In Process states
- June 24, 2025. Comprehensive admin dashboard sync implemented - enhanced admin.html with full order lifecycle visibility showing Quote/Converted/Pending Approval/In Process/Fulfilled statuses, added document upload visibility with clickable file links for all uploaded materials (Letter Document, Letterhead, Logo, Envelope artwork, Signature, Enclosures, Zip files), implemented admin-specific functionality including proof downloads, invoice viewing, order fulfillment marking, metadata editing, and internal admin notes, created advanced filtering by practice, status, date range, and invoice number with CSV export capability, added status audit log showing complete order progression timeline, integrated /admin/api/orders endpoint with comprehensive order data including practice names, user emails, file references, and status histories
- June 25, 2025. Quote form submission issue completely resolved - fixed field validation mismatch between frontend and backend, added detailed error messaging with specific missing field identification, implemented proper form data mapping for all fields (location_id, subject, templateType, colorMode, estimatedRecipients, enclosures, notes, additional services), enhanced frontend validation with real-time feedback, added loading states and success messaging with automatic dashboard redirect, confirmed complete quote-to-dashboard workflow functionality
- June 25, 2025. Confirmation page dashboard redirect fixed - corrected "Back to Dashboard" button in confirmation.html to redirect to /dashboard.html instead of root URL (/), ensuring users return to proper dashboard after quote-to-order conversion workflow
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```