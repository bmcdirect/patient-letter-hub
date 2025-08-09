# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# -----------------------------------------------------------------------------
# App - Don't add "/" in the end of the url (same in production)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL=http://localhost:3000

# -----------------------------------------------------------------------------
# Authentication (Clerk) - REQUIRED
# -----------------------------------------------------------------------------
CLERK_SECRET_KEY=your_clerk_secret_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
AUTH_DEV_BYPASS_EXPIRED=true

# -----------------------------------------------------------------------------
# Database (PostgreSQL - Neon DB) - REQUIRED
# -----------------------------------------------------------------------------
DATABASE_URL='postgres://[user]:[password]@[neon_hostname]/[dbname]?sslmode=require'

# -----------------------------------------------------------------------------
# Email (Resend) - Optional for testing
# -----------------------------------------------------------------------------
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM="SaaS Starter App <onboarding@resend.dev>"

# -----------------------------------------------------------------------------
# Subscriptions (Stripe) - Optional for testing
# -----------------------------------------------------------------------------
STRIPE_API_KEY=your_stripe_api_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=your_stripe_plan_id_here
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=your_stripe_plan_id_here

NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=your_stripe_plan_id_here
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=your_stripe_plan_id_here
```

## Getting Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or use an existing one
3. Go to API Keys in the sidebar
4. Copy the **Secret Key** and **Publishable Key**
5. Add them to your `.env.local` file

## Getting Database URL

1. Go to [Neon Dashboard](https://console.neon.tech/)
2. Create a new project or use an existing one
3. Copy the connection string
4. Add it to your `.env.local` file

## Testing Without Full Setup

For testing purposes, you can use these placeholder values:

```bash
CLERK_SECRET_KEY=sk_test_placeholder
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_placeholder
DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
```

The application will use development bypass mode for authentication.
