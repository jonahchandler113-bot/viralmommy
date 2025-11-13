# ViralMommy Deployment Checklist

## Pre-Deployment Checklist

### Code & Dependencies
- [ ] All code committed to GitHub
- [ ] No uncommitted changes locally
- [ ] All tests passing (when tests are implemented)
- [ ] No console.log statements in production code
- [ ] Dependencies up to date (`npm audit` shows no critical issues)
- [ ] TypeScript compilation successful (`npm run build`)

### Environment Variables
- [ ] `.env.example` file is up to date
- [ ] All required environment variables documented
- [ ] No secrets committed to Git
- [ ] `.env*` files added to `.gitignore`

### Database
- [ ] Prisma schema finalized
- [ ] Migrations created and tested
- [ ] Database indexes created for performance
- [ ] Seed data prepared (if needed)

### Security
- [ ] NEXTAUTH_SECRET generated and secured
- [ ] API keys rotated and secured
- [ ] CORS configuration reviewed
- [ ] Rate limiting implemented
- [ ] Security headers configured

---

## Railway Setup Checklist

### Project Creation
- [ ] Railway account created
- [ ] New project "viralmommy" created
- [ ] GitHub repository connected
- [ ] Build configuration verified

### Database Services
- [ ] PostgreSQL service added
- [ ] PostgreSQL connection tested
- [ ] DATABASE_URL copied to environment variables
- [ ] Connection pooling enabled (PgBouncer)
- [ ] Redis service added
- [ ] Redis connection tested
- [ ] REDIS_URL copied to environment variables

### Environment Variables (Railway)
Critical variables set:
- [ ] `DATABASE_URL`
- [ ] `REDIS_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `NODE_ENV=production`

AI services:
- [ ] `ANTHROPIC_API_KEY`
- [ ] `OPENAI_API_KEY`

OAuth (when ready):
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] Other OAuth credentials

Storage (when ready):
- [ ] Cloudflare R2 credentials
- [ ] `R2_BUCKET_NAME`
- [ ] `R2_PUBLIC_URL`

### Initial Deployment
- [ ] First deployment triggered
- [ ] Build logs reviewed
- [ ] Deployment successful
- [ ] Health check endpoint responding
- [ ] Application accessible via Railway URL

### Database Initialization
- [ ] Prisma migrations deployed
- [ ] Prisma Client generated
- [ ] Database schema verified
- [ ] Seed data imported (if applicable)

---

## Domain Configuration Checklist

### Railway Domain Setup
- [ ] Custom domain added: `viralmommy.com`
- [ ] WWW subdomain added: `www.viralmommy.com`
- [ ] Railway DNS instructions reviewed

### DNS Configuration
- [ ] A or CNAME record added for root domain
- [ ] CNAME record added for www subdomain
- [ ] TTL set to 300 seconds (5 minutes)
- [ ] DNS propagation verified

### SSL Certificate
- [ ] SSL certificate auto-provisioned
- [ ] HTTPS enabled
- [ ] SSL certificate valid
- [ ] HTTP redirects to HTTPS
- [ ] Certificate auto-renewal enabled

### Domain Verification
- [ ] `nslookup viralmommy.com` returns correct IP
- [ ] `curl -I https://viralmommy.com` returns 200 OK
- [ ] Both www and non-www work
- [ ] NEXTAUTH_URL updated to production domain

---

## Post-Deployment Checklist

### Monitoring & Logging
- [ ] Railway metrics dashboard reviewed
- [ ] Deployment logs reviewed
- [ ] No critical errors in logs
- [ ] Health check endpoint tested
- [ ] Response times acceptable

### Sentry Setup (Error Tracking)
- [ ] Sentry account created
- [ ] Project "viralmommy" created
- [ ] `SENTRY_DSN` added to environment variables
- [ ] Sentry SDK initialized in application
- [ ] Test error sent to verify integration
- [ ] Source maps uploaded (for better error tracking)

### Uptime Monitoring
- [ ] UptimeRobot or Better Uptime account created
- [ ] Monitor created for homepage
- [ ] Monitor created for `/api/health`
- [ ] Alert contacts configured
- [ ] Alert thresholds set

### Performance Checks
- [ ] Homepage loads in < 3 seconds
- [ ] API endpoints respond in < 500ms
- [ ] Database queries optimized
- [ ] Redis caching working
- [ ] No memory leaks

### Functionality Tests
- [ ] Homepage accessible
- [ ] User registration working
- [ ] User login working
- [ ] Session management working
- [ ] AI content generation working (when implemented)
- [ ] Media upload working (when implemented)
- [ ] Social media posting working (when implemented)

---

## External Services Checklist

### Cloudflare R2 (Media Storage)
- [ ] Cloudflare account created
- [ ] R2 bucket created: `viralmommy-media`
- [ ] Access credentials generated
- [ ] CORS configured on bucket
- [ ] Public URL configured
- [ ] Environment variables added to Railway
- [ ] Upload functionality tested

### OAuth Providers

#### Google OAuth
- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] Credentials created (Web application)
- [ ] Authorized redirect URIs added
- [ ] Client ID and secret added to Railway
- [ ] Google sign-in tested

#### Instagram OAuth
- [ ] Facebook Developer account created
- [ ] App created
- [ ] Instagram Basic Display configured
- [ ] Redirect URIs configured
- [ ] Credentials added to Railway
- [ ] Instagram connection tested

#### TikTok OAuth
- [ ] TikTok Developer account created
- [ ] App registered
- [ ] OAuth credentials obtained
- [ ] Webhook configured (if needed)
- [ ] Credentials added to Railway
- [ ] TikTok connection tested

### Stripe (Payment Processing)
- [ ] Stripe account created
- [ ] Live mode activated
- [ ] API keys generated
- [ ] Products created (Starter, Pro, Enterprise)
- [ ] Price IDs obtained
- [ ] Webhook endpoint configured
- [ ] Webhook secret added to Railway
- [ ] Test payment processed

### Resend (Email Service)
- [ ] Resend account created
- [ ] Domain verified
- [ ] API key generated
- [ ] Email templates created
- [ ] Test email sent
- [ ] Credentials added to Railway

---

## Security Hardening Checklist

### Application Security
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers added
- [ ] Input validation on all forms
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention
- [ ] CSRF protection enabled

### Authentication & Authorization
- [ ] NextAuth.js configured correctly
- [ ] Session security reviewed
- [ ] Password hashing implemented
- [ ] OAuth flows secured
- [ ] API routes protected
- [ ] Role-based access control (when needed)

### Data Protection
- [ ] Sensitive data encrypted in database
- [ ] API keys secured in environment variables
- [ ] No secrets in code or logs
- [ ] Database access restricted
- [ ] Redis access secured

### Infrastructure Security
- [ ] Railway project access controlled
- [ ] Team permissions configured
- [ ] Audit logs enabled
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented

---

## Performance Optimization Checklist

### Caching
- [ ] Redis caching implemented
- [ ] API response caching enabled
- [ ] Static asset caching configured
- [ ] Cache invalidation strategy defined

### Database Performance
- [ ] Database indexes created
- [ ] Query performance analyzed
- [ ] N+1 queries eliminated
- [ ] Connection pooling enabled
- [ ] Slow query logging enabled

### Frontend Optimization
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Bundle size minimized
- [ ] Lazy loading enabled
- [ ] CDN configured for static assets

### API Optimization
- [ ] Response compression enabled
- [ ] Payload sizes minimized
- [ ] Pagination implemented
- [ ] Rate limiting configured

---

## Documentation Checklist

### Developer Documentation
- [ ] README.md updated
- [ ] INFRASTRUCTURE.md complete
- [ ] API documentation created
- [ ] Environment variables documented
- [ ] Setup guide written

### Operational Documentation
- [ ] Deployment process documented
- [ ] Rollback procedure documented
- [ ] Disaster recovery plan created
- [ ] On-call procedures defined
- [ ] Runbook created

---

## Backup & Recovery Checklist

### Database Backups
- [ ] Automated backups enabled (Railway default)
- [ ] Backup frequency verified (daily)
- [ ] Backup retention period configured
- [ ] Manual backup tested
- [ ] Restore procedure tested

### Application Backups
- [ ] Code backed up in GitHub
- [ ] Configuration backed up
- [ ] Environment variables documented
- [ ] Infrastructure as code (railway.json)

### Disaster Recovery
- [ ] Recovery Time Objective (RTO) defined: 1 hour
- [ ] Recovery Point Objective (RPO) defined: 24 hours
- [ ] Disaster recovery plan documented
- [ ] Recovery procedure tested

---

## Compliance & Legal Checklist

### Privacy
- [ ] Privacy policy created
- [ ] Cookie consent implemented
- [ ] Data retention policy defined
- [ ] GDPR compliance reviewed (if applicable)
- [ ] CCPA compliance reviewed (if applicable)

### Terms of Service
- [ ] Terms of service created
- [ ] User agreements defined
- [ ] Content policies defined

### Analytics & Tracking
- [ ] Analytics implementation reviewed for privacy
- [ ] User consent for tracking implemented
- [ ] Data collection minimized

---

## Final Verification

### Pre-Launch
- [ ] All critical features working
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security review complete

### Launch Day
- [ ] Team notified
- [ ] Support channels ready
- [ ] Monitoring active
- [ ] Rollback plan ready
- [ ] Communication plan ready

### Post-Launch
- [ ] Monitor errors and performance
- [ ] Gather user feedback
- [ ] Address critical issues immediately
- [ ] Plan next iteration

---

## Rollback Procedure

If issues are discovered after deployment:

1. **Immediate Rollback**
   ```bash
   # Via Railway Dashboard
   # Go to Deployments > Select previous deployment > Click "Redeploy"

   # Via CLI
   npx @railway/cli rollback
   ```

2. **Verify Rollback**
   - [ ] Check health endpoint
   - [ ] Test critical functionality
   - [ ] Review error logs

3. **Investigate Issue**
   - [ ] Review deployment logs
   - [ ] Check environment variables
   - [ ] Test locally
   - [ ] Identify root cause

4. **Fix and Redeploy**
   - [ ] Fix issue locally
   - [ ] Test thoroughly
   - [ ] Commit and push
   - [ ] Monitor deployment

---

## Support & Escalation

### Issue Severity Levels

**P0 - Critical (Site Down)**
- Response time: Immediate
- All hands on deck
- Rollback immediately if needed

**P1 - High (Major Feature Broken)**
- Response time: < 1 hour
- Fix ASAP or disable feature

**P2 - Medium (Minor Issue)**
- Response time: < 4 hours
- Schedule fix for next deployment

**P3 - Low (Enhancement)**
- Response time: < 24 hours
- Add to backlog

### Contact Information

**Railway Support:**
- Discord: https://discord.gg/railway
- Help Station: https://help.railway.app

**External Services:**
- Cloudflare: Support portal
- Sentry: Status page
- Stripe: Dashboard support

---

## Sign-Off

**Deployed By:** _________________
**Date:** _________________
**Deployment ID:** _________________
**Build Version:** _________________

**Verified By:** _________________
**Date:** _________________

---

**Checklist Version:** 1.0.0
**Last Updated:** November 12, 2024
