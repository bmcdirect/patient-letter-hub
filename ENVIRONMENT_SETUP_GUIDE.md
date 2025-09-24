# Environment Setup Guide for Microsoft 365 SMTP

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Microsoft 365 SMTP Configuration
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-app-password-here
EMAIL_FROM=your-email@yourdomain.com

# Other required environment variables
NODE_ENV=development
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_WEBHOOK_SECRET=your-clerk-webhook-secret
DATABASE_URL=your-database-url
STRIPE_API_KEY=your-stripe-api-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Public environment variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
NEXT_PUBLIC_APP_URL=http://localhost:3002
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=your-stripe-plan-id
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=your-stripe-plan-id
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=your-stripe-plan-id
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=your-stripe-plan-id
NEXT_PUBLIC_USE_CLERK=true
```

## Microsoft 365 SMTP Setup Steps

### 1. Get Your SMTP Credentials

1. **SMTP_HOST**: Always use `smtp.office365.com`
2. **SMTP_PORT**: Use `587` for TLS encryption
3. **SMTP_USER**: Your Microsoft 365 email address
4. **SMTP_PASS**: Create an app-specific password (see below)
5. **EMAIL_FROM**: Usually the same as SMTP_USER

### 2. Create App-Specific Password

1. Go to your Microsoft 365 account security settings
2. Navigate to **Security** > **Advanced security options**
3. Enable **App passwords** if not already enabled
4. Generate a new app password for this application
5. Copy the generated password (it will look like: `abcd-efgh-ijkl-mnop`)

### 3. Enable SMTP Authentication

1. Log into Microsoft 365 Admin Center
2. Go to **Settings** > **Mail** > **Mail flow**
3. Enable **SMTP AUTH** for your domain
4. Ensure **Modern Authentication** is enabled

### 4. Test Your Configuration

After setting up your environment variables, test the configuration:

```bash
npm run dev
```

The application will attempt to connect to Microsoft 365 SMTP on startup. Check the console logs for any connection errors.

## Troubleshooting

### Common Configuration Issues

1. **Authentication Failed**
   - Verify your app password is correct
   - Ensure SMTP AUTH is enabled
   - Check that the email address exists in Microsoft 365

2. **Connection Timeout**
   - Verify SMTP_HOST is `smtp.office365.com`
   - Check SMTP_PORT is `587`
   - Ensure network allows outbound SMTP connections

3. **TLS/SSL Errors**
   - Check firewall settings
   - Verify TLS configuration
   - Ensure port 587 is not blocked

### Testing SMTP Connection

You can test your SMTP connection independently using a tool like `telnet`:

```bash
telnet smtp.office365.com 587
```

Or use an online SMTP testing tool to verify your credentials work.

## Security Notes

- Never commit your `.env.local` file to version control
- Use app-specific passwords, never your regular password
- Keep your SMTP credentials secure
- Consider rotating app passwords regularly
- Monitor email delivery for any suspicious activity
