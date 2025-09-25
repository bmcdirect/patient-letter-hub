# Microsoft 365 SMTP Alias Setup Guide

## Overview

This guide configures Microsoft 365 SMTP to authenticate with your primary account (`davids@patientletterhub.com`) while sending emails from a professional alias (`noreply@patientletterhub.com`). This provides HIPAA compliance and professional email appearance.

## Environment Configuration

### Required Environment Variables

Create or update your `.env.local` file with these variables:

```bash
# Microsoft 365 SMTP Configuration with Alias Support
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=davids@patientletterhub.com
SMTP_PASS=YOUR_SMTP_PASSWORD_HERE
SMTP_FROM=noreply@patientletterhub.com
```

### Environment Variable Descriptions

- **SMTP_HOST**: Microsoft 365 SMTP server (`smtp.office365.com`)
- **SMTP_PORT**: SMTP port for TLS encryption (`587`)
- **SMTP_USER**: Primary account for authentication (`davids@patientletterhub.com`)
- **SMTP_PASS**: App-specific password for the primary account
- **SMTP_FROM**: Professional alias for sending emails (`noreply@patientletterhub.com`)

## Microsoft 365 Setup Requirements

### 1. Primary Account Configuration

**Account**: `davids@patientletterhub.com`

1. **Enable SMTP Authentication**:
   - Log into Microsoft 365 Admin Center
   - Navigate to **Settings** > **Mail** > **Mail flow**
   - Enable **SMTP AUTH** for your domain
   - Ensure **Modern Authentication** is enabled

2. **Create App-Specific Password**:
   - Go to your Microsoft 365 account security settings
   - Navigate to **Security** > **Advanced security options**
   - Enable **App passwords** if not already enabled
   - Generate a new app password specifically for this application
   - Use this password as your `SMTP_PASS` environment variable

### 2. Alias Configuration

**Alias**: `noreply@patientletterhub.com`

1. **Create Email Alias**:
   - In Microsoft 365 Admin Center, go to **Users** > **Active users**
   - Find your primary account (`davids@patientletterhub.com`)
   - Click **Manage email aliases**
   - Add `noreply@patientletterhub.com` as an alias

2. **Verify Alias Permissions**:
   - Ensure the alias is properly configured
   - Verify it appears in the user's alias list
   - Test that emails can be sent from this alias

### 3. Domain Configuration

Ensure your domain (`patientletterhub.com`) is properly configured:

1. **Domain Verification**: Domain must be verified in Microsoft 365
2. **DNS Records**: Proper MX, SPF, DKIM, and DMARC records
3. **Mailbox Setup**: The primary account must have a valid mailbox

## How Alias SMTP Works

### Authentication vs. Sending Address

- **Authentication**: Uses `davids@patientletterhub.com` credentials
- **From Address**: Uses `noreply@patientletterhub.com` alias
- **Result**: Professional emails sent from noreply alias with primary account authentication

### Technical Implementation

```typescript
const transporter = nodemailer.createTransporter({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: 'davids@patientletterhub.com', // Primary account for auth
    pass: 'YOUR_SMTP_PASSWORD_HERE',     // App password
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// Email options
const mailOptions = {
  from: 'noreply@patientletterhub.com', // Professional alias
  to: recipient,
  subject: 'Subject | Patient Letter Hub',
  html: 'Professional HTML content...'
};
```

## Testing the Configuration

### 1. Run SMTP Test

```bash
npm run test-smtp
```

This will:
- Verify SMTP connection with primary account
- Test email sending from alias address
- Confirm professional email appearance
- Validate all email templates

### 2. Expected Test Results

```
🔍 Testing Microsoft 365 SMTP Connection...

✅ All required environment variables are set
📧 SMTP Host: smtp.office365.com
🔌 SMTP Port: 587
👤 SMTP User (Auth): davids@patientletterhub.com
📨 SMTP From (Alias): noreply@patientletterhub.com

🔗 Testing SMTP connection...
✅ SMTP connection successful!

📤 Testing email delivery with alias...
✅ Test email sent successfully!
📧 Message ID: <message-id>

🧪 Testing EmailService class...
✅ EmailService custom email test successful!

🎉 All tests completed successfully!
```

### 3. Verify Email Delivery

Check your inbox (`davids@patientletterhub.com`) for:
- Test email sent from `noreply@patientletterhub.com`
- Professional Patient Letter Hub branding
- Proper HTML formatting and styling

## Email Templates

### Professional Branding

All email templates now include:
- **Patient Letter Hub** branding
- Professional color scheme (#2563eb blue)
- Consistent HTML styling
- Responsive design
- HIPAA-compliant messaging

### Template Types

1. **Magic Link Emails**: Passwordless authentication
2. **Order Confirmations**: Professional order confirmations
3. **Status Updates**: Order progress notifications
4. **Proof Responses**: Proof approval/rejection confirmations
5. **Custom Emails**: Admin-sent communications

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

**Error**: `Invalid login: 535-5.7.3 Authentication unsuccessful`

**Solutions**:
- Verify app password is correct for `davids@patientletterhub.com`
- Ensure SMTP AUTH is enabled for your domain
- Check that the primary account exists and is active

#### 2. Alias Not Working

**Error**: `Sender address rejected: not owned by user`

**Solutions**:
- Verify `noreply@patientletterhub.com` is configured as an alias
- Ensure alias is properly linked to primary account
- Check alias permissions in Microsoft 365 Admin Center

#### 3. Connection Issues

**Error**: `Connection timeout` or `TLS/SSL errors`

**Solutions**:
- Verify `SMTP_HOST` is `smtp.office365.com`
- Check `SMTP_PORT` is `587`
- Ensure network allows outbound SMTP connections
- Verify TLS configuration

### Debug Mode

Enable detailed SMTP logging:

```bash
DEBUG=nodemailer:*
```

## Security Considerations

### HIPAA Compliance

- Microsoft 365 provides HIPAA-compliant infrastructure
- All emails encrypted in transit using TLS
- Professional alias maintains compliance standards
- No PHI should be included in email content

### Best Practices

1. **App Passwords**: Use app-specific passwords, never regular passwords
2. **Environment Variables**: Keep SMTP credentials secure
3. **Alias Management**: Regularly verify alias configuration
4. **Monitoring**: Monitor email delivery rates and failures
5. **Access Control**: Limit access to SMTP credentials

## Production Deployment

### 1. Environment Setup

Update production environment variables:
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=davids@patientletterhub.com
SMTP_PASS=your-production-app-password
SMTP_FROM=noreply@patientletterhub.com
```

### 2. Testing

Run comprehensive tests in production:
```bash
npm run test-smtp
```

### 3. Monitoring

Set up monitoring for:
- Email delivery success rates
- SMTP connection health
- Authentication failures
- Alias configuration status

## Support

### Microsoft 365 Issues

1. Check Microsoft 365 service health
2. Verify domain and alias configuration
3. Review Microsoft 365 documentation
4. Contact Microsoft support for account issues

### Application Issues

1. Check application logs for detailed errors
2. Verify environment variable configuration
3. Test SMTP connection independently
4. Review this documentation for troubleshooting

## Summary

This configuration provides:
- ✅ HIPAA-compliant email delivery
- ✅ Professional email appearance from noreply alias
- ✅ Secure authentication with primary account
- ✅ All existing email functionality preserved
- ✅ Enhanced email templates with Patient Letter Hub branding
- ✅ Comprehensive testing and monitoring capabilities

Your email system is now ready for production use with Microsoft 365 SMTP and alias support!
