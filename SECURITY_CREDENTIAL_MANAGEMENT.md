# Security Credential Management Guide

## 🚨 **CRITICAL SECURITY NOTICE**

**NEVER commit real credentials to the repository!** This guide provides secure practices for managing sensitive information.

## 🔐 **Environment Variables Security**

### **Required Environment Variables**

**Microsoft 365 SMTP Configuration:**
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=YOUR_SMTP_PASSWORD_HERE
SMTP_FROM=noreply@yourdomain.com
```

**Database Configuration:**
```bash
DATABASE_URL=postgresql://username:password@hostname:5432/database?sslmode=require
```

**Clerk Authentication:**
```bash
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_USE_CLERK=true
```

**Stripe Payment Processing:**
```bash
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_...
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_...
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_...
```

**Application Configuration:**
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## 🛡️ **Security Best Practices**

### **1. Environment File Protection**

**Local Development (.env.local):**
- Create `.env.local` file for local development
- Add real credentials only in `.env.local`
- **NEVER commit `.env.local` to repository**

**Production (Vercel):**
- Add environment variables in Vercel Dashboard
- Use strong, unique passwords
- Rotate credentials regularly

### **2. Password Security**

**SMTP Passwords:**
- Use app-specific passwords, never regular passwords
- Generate strong passwords with special characters
- Rotate passwords every 90 days

**Database Passwords:**
- Use strong, unique passwords
- Enable SSL/TLS connections
- Rotate passwords regularly

### **3. Credential Rotation**

**When to Rotate:**
- Every 90 days for production credentials
- Immediately if credentials are compromised
- When team members leave
- After security incidents

**How to Rotate:**
1. Generate new credentials
2. Update Vercel environment variables
3. Test new credentials
4. Update local `.env.local` files
5. Document rotation in security log

## 🔍 **Security Checklist**

### **Before Committing Code:**
- [ ] No real credentials in code files
- [ ] No credentials in documentation examples
- [ ] All `.env*` files are in `.gitignore`
- [ ] Placeholder values used in examples
- [ ] No hardcoded passwords or API keys

### **Before Deployment:**
- [ ] All environment variables configured in Vercel
- [ ] Strong passwords used for all services
- [ ] SSL/TLS enabled for database connections
- [ ] App-specific passwords used for SMTP
- [ ] Webhook secrets are secure

### **Regular Security Review:**
- [ ] Review environment variables monthly
- [ ] Check for exposed credentials in repository
- [ ] Verify `.gitignore` protection
- [ ] Update documentation with secure examples
- [ ] Rotate credentials as needed

## 🚨 **Emergency Procedures**

### **If Credentials Are Exposed:**

1. **Immediate Actions:**
   - Rotate exposed credentials immediately
   - Update Vercel environment variables
   - Remove credentials from repository
   - Check git history for other exposures

2. **Investigation:**
   - Search repository for exposed credentials
   - Check all branches and commits
   - Review team access logs
   - Document exposure details

3. **Prevention:**
   - Update security procedures
   - Train team on secure practices
   - Implement credential scanning
   - Review access controls

## 📋 **Credential Management Tools**

### **Recommended Tools:**
- **Vercel Environment Variables**: Secure cloud storage
- **1Password/Bitwarden**: Password management
- **GitGuardian**: Credential scanning
- **GitHub Secrets**: Secure credential storage

### **Monitoring:**
- Set up alerts for credential exposure
- Monitor access logs regularly
- Use automated security scanning
- Review security reports monthly

## 📞 **Security Contacts**

**For Security Issues:**
- Report immediately to security team
- Document all incidents
- Follow incident response procedures
- Update security documentation

**Remember: Security is everyone's responsibility!**

---

**Last Updated:** September 2025  
**Next Review:** October 2025  
**Security Level:** CONFIDENTIAL
