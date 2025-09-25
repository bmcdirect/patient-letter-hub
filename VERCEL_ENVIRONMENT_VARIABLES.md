# Vercel Environment Variables Configuration

## Required Environment Variables for Production

### Microsoft 365 SMTP Configuration
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=davids@patientletterhub.com
SMTP_PASS=YOUR_SMTP_PASSWORD_HERE
SMTP_FROM=noreply@patientletterhub.com
```

### Clerk Authentication
```bash
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_USE_CLERK=true
```

### Database
```bash
DATABASE_URL=postgresql://...
```

### Stripe Payment Processing
```bash
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_...
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_...
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_...
```

### Application Configuration
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Environment Variable Descriptions

### SMTP Configuration
- **SMTP_HOST**: Microsoft 365 SMTP server
- **SMTP_PORT**: SMTP port for TLS encryption
- **SMTP_USER**: Primary account for authentication
- **SMTP_PASS**: App-specific password
- **SMTP_FROM**: Professional alias for sending emails

### Clerk Configuration
- **CLERK_SECRET_KEY**: Server-side authentication key
- **CLERK_WEBHOOK_SECRET**: Webhook signature verification
- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**: Client-side authentication key
- **NEXT_PUBLIC_USE_CLERK**: Enable Clerk authentication

### Database
- **DATABASE_URL**: PostgreSQL connection string

### Stripe Configuration
- **STRIPE_API_KEY**: Server-side Stripe API key
- **STRIPE_WEBHOOK_SECRET**: Stripe webhook signature verification
- **NEXT_PUBLIC_STRIPE_*_PLAN_ID**: Subscription plan IDs

### Application
- **NODE_ENV**: Environment mode (production)
- **NEXT_PUBLIC_APP_URL**: Public application URL

## Vercel Configuration Steps

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add each environment variable with appropriate values
3. Ensure all variables are set for Production environment
4. Redeploy the application after adding variables

## Testing Checklist

- [ ] SMTP connection works with Microsoft 365
- [ ] Email sending from noreply alias functions
- [ ] Clerk webhook creates users in database
- [ ] User authentication works properly
- [ ] Stripe webhooks process payments
- [ ] Database connections are stable
