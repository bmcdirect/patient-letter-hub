# Microsoft 365 SMTP Email Configuration Guide

## Overview

This application has been converted from Resend API to Microsoft 365 SMTP for HIPAA compliance and professional email delivery. The email system maintains all existing functionality while using Microsoft 365's secure SMTP infrastructure.

## Environment Variables

### Required SMTP Configuration

Add the following environment variables to your `.env.local` file:

```bash
# Microsoft 365 SMTP Configuration
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@yourdomain.com
```

### Environment Variable Descriptions

- **SMTP_HOST**: Microsoft 365 SMTP server hostname (`smtp.office365.com`)
- **SMTP_PORT**: SMTP port number (`587` for TLS, `465` for SSL)
- **SMTP_USER**: Your Microsoft 365 email address
- **SMTP_PASS**: App-specific password (not your regular password)
- **EMAIL_FROM**: The "from" address for outgoing emails (usually same as SMTP_USER)

## Microsoft 365 Setup Requirements

### 1. Enable SMTP Authentication

1. Log into the Microsoft 365 Admin Center
2. Navigate to **Settings** > **Mail** > **Mail flow**
3. Enable **SMTP AUTH** for your domain
4. Ensure **Modern Authentication** is enabled

### 2. Create App-Specific Password

1. Go to your Microsoft 365 account security settings
2. Navigate to **Security** > **Advanced security options**
3. Enable **App passwords** if not already enabled
4. Generate a new app password specifically for this application
5. Use this app password as your `SMTP_PASS` environment variable

### 3. Domain Configuration

Ensure your domain is properly configured in Microsoft 365:

1. **Domain verification**: Your domain must be verified in Microsoft 365
2. **DNS records**: Proper MX, SPF, DKIM, and DMARC records should be configured
3. **Mailbox setup**: The email address used for `SMTP_USER` must have a valid mailbox

## SMTP Configuration Details

### Connection Settings

The application uses the following SMTP configuration:

```typescript
const transporter = nodemailer.createTransporter({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // TLS encryption
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});
```

### Security Features

- **TLS Encryption**: All emails are sent over encrypted connections
- **Authentication**: Uses Microsoft 365's secure authentication
- **HIPAA Compliance**: Microsoft 365 provides HIPAA-compliant email infrastructure

## Email Functionality

### Supported Email Types

The system maintains all existing email functionality:

1. **Magic Link Authentication**: Passwordless login emails
2. **Order Confirmations**: Automatic order confirmation emails
3. **Status Updates**: Order status change notifications
4. **Proof Responses**: Proof approval/rejection confirmations
5. **Custom Emails**: Admin-sent custom emails

### Email Templates

All existing email templates are preserved and will render correctly with Microsoft 365 SMTP:

- Professional HTML formatting
- Consistent branding
- Responsive design
- HIPAA-compliant content

## Testing Email Delivery

### 1. Verify SMTP Connection

Test the SMTP connection by sending a test email:

```bash
# The application will automatically test SMTP on startup
npm run dev
```

### 2. Check Email Logs

Monitor the application logs for email delivery status:

```bash
# Look for these log messages:
# "Magic link email sent: [messageId]"
# "Order confirmation email sent: [messageId]"
# "Status update email sent: [messageId]"
# "Proof response email sent: [messageId]"
# "Custom email sent: [messageId]"
```

### 3. Database Email Tracking

All email attempts are tracked in the `emailNotifications` table:

- **Status**: `sent`, `failed`, or `pending`
- **Error messages**: Detailed error information for failed emails
- **Metadata**: Additional tracking information

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

**Error**: `Invalid login: 535-5.7.3 Authentication unsuccessful`

**Solutions**:
- Verify your app password is correct
- Ensure SMTP AUTH is enabled for your account
- Check that the email address exists in Microsoft 365

#### 2. Connection Timeout

**Error**: `Connection timeout`

**Solutions**:
- Verify `SMTP_HOST` is set to `smtp.office365.com`
- Check that `SMTP_PORT` is set to `587`
- Ensure your network allows outbound SMTP connections

#### 3. TLS/SSL Errors

**Error**: `TLS/SSL connection errors`

**Solutions**:
- Verify TLS settings in the transporter configuration
- Check that your firewall allows TLS connections on port 587
- Ensure `secure: false` is set for port 587

#### 4. Rate Limiting

**Error**: `Too many requests`

**Solutions**:
- Microsoft 365 has sending limits (typically 10,000 emails/day for business accounts)
- Implement email queuing for high-volume sending
- Consider upgrading to a higher-tier Microsoft 365 plan

### Debug Mode

Enable detailed SMTP logging by setting:

```bash
DEBUG=nodemailer:*
```

## Migration from Resend

### What Changed

1. **Dependencies**: Removed `resend` package, added `nodemailer`
2. **Environment Variables**: Replaced `RESEND_API_KEY` with SMTP configuration
3. **Email Service**: Updated `EmailService` class to use SMTP instead of Resend API
4. **Error Handling**: Maintained all existing error handling and logging

### What Stayed the Same

1. **Email Templates**: All existing email templates work unchanged
2. **API Endpoints**: All email-related API endpoints function identically
3. **Database Tracking**: Email notification tracking remains the same
4. **Admin Interface**: Email sending interface works without changes

## Security Considerations

### HIPAA Compliance

- Microsoft 365 provides HIPAA-compliant email infrastructure
- All emails are encrypted in transit using TLS
- Email content should not contain PHI unless properly secured
- Consider implementing additional encryption for sensitive data

### Best Practices

1. **App Passwords**: Use app-specific passwords, never regular passwords
2. **Environment Variables**: Keep SMTP credentials secure and never commit to version control
3. **Monitoring**: Monitor email delivery rates and failures
4. **Backup**: Have a backup email delivery method for critical communications

## Support

For Microsoft 365 SMTP issues:

1. Check Microsoft 365 service health
2. Verify your domain configuration
3. Review Microsoft 365 documentation
4. Contact Microsoft support for account-specific issues

For application-specific issues:

1. Check application logs for detailed error messages
2. Verify environment variable configuration
3. Test SMTP connection independently
4. Review this documentation for troubleshooting steps
