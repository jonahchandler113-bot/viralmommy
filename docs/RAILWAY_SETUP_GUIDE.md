# Railway Setup Guide for ViralMommy

## Quick Start Checklist

- [ ] Create Railway account
- [ ] Create new Railway project named "viralmommy"
- [ ] Connect GitHub repository
- [ ] Add PostgreSQL database
- [ ] Add Redis database
- [ ] Configure environment variables
- [ ] Deploy application
- [ ] Configure custom domain

---

## Step-by-Step Setup Instructions

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Login" and sign in with GitHub
3. Authorize Railway to access your GitHub account

### Step 2: Create New Project

1. Click "New Project" button
2. Select "Deploy from GitHub repo"
3. Choose repository: **jonahchandler113-bot/viralmommy**
4. Select branch: **main**
5. Project name will auto-populate as "viralmommy"
6. Click "Deploy Now"

Railway will:
- Detect it's a Next.js application
- Set up build configuration automatically
- Create initial deployment (will fail until env vars are set)

### Step 3: Add PostgreSQL Database

#### Option A: Via Dashboard (Recommended)

1. In your viralmommy project, click "+ New" button
2. Select "Database"
3. Choose "Add PostgreSQL"
4. Railway provisions database (takes 30-60 seconds)
5. Database appears on project canvas

#### Option B: Via CLI

```bash
cd viralmommy
npx @railway/cli login
npx @railway/cli link
npx @railway/cli add --database postgresql
```

#### Get PostgreSQL Connection String

1. Click on PostgreSQL service in project canvas
2. Go to "Variables" tab
3. Copy the following variables:
   - `DATABASE_URL`
   - `DATABASE_PRIVATE_URL` (optional, for faster internal connections)

Example format:
```
postgresql://postgres:PASSWORD@containers.railway.app:5432/railway
```

Save these for Step 5.

### Step 4: Add Redis Database

#### Option A: Via Dashboard (Recommended)

1. In your viralmommy project, click "+ New" button
2. Select "Database"
3. Choose "Add Redis"
4. Railway provisions Redis (takes 30-60 seconds)
5. Redis appears on project canvas

#### Option B: Via CLI

```bash
npx @railway/cli add --database redis
```

#### Get Redis Connection String

1. Click on Redis service in project canvas
2. Go to "Variables" tab
3. Copy the `REDIS_URL` variable

Example format:
```
redis://default:PASSWORD@containers.railway.app:6379
```

Save this for Step 5.

### Step 5: Configure Environment Variables

#### Required Variables

1. Click on your Next.js service (viralmommy)
2. Go to "Variables" tab
3. Click "New Variable" for each of the following:

**Critical Variables (Required for deployment):**

```bash
# Database (from Step 3)
DATABASE_URL=postgresql://postgres:PASSWORD@containers.railway.app:5432/railway

# Redis (from Step 4)
REDIS_URL=redis://default:PASSWORD@containers.railway.app:6379

# Authentication
NEXTAUTH_SECRET=Z3PonfpuCQPeksuWoD91N4yVP1x/zT4WwWPypw03EK4=
NEXTAUTH_URL=https://viralmommy.com

# AI Services (if you have them)
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here

# Node Environment
NODE_ENV=production
```

**Note:** For NEXTAUTH_SECRET, generate a new one with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Using Railway Variable References

Railway allows you to reference variables from other services:

```bash
# Instead of copying DATABASE_URL manually:
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Instead of copying REDIS_URL manually:
REDIS_URL=${{Redis.REDIS_URL}}
```

This automatically keeps values in sync.

#### Optional Variables (Add later)

See `.env.example` file for complete list of optional variables:
- OAuth credentials (Google, Facebook, Instagram, TikTok)
- Cloudflare R2 storage
- Stripe payment processing
- Sentry error tracking
- Email service (Resend)

### Step 6: Deploy Application

After setting environment variables:

1. Railway will automatically trigger a new deployment
2. Monitor deployment progress in "Deployments" tab
3. Watch build logs for any errors

**Expected deployment time:** 3-5 minutes

**Check deployment status:**
- Green checkmark = Successful deployment
- Red X = Failed deployment (check logs)

#### If Deployment Fails

Common issues:

**1. Missing Environment Variables**
- Check all required variables are set
- Verify DATABASE_URL and REDIS_URL are correct

**2. Build Errors**
- Check build logs in Deployments tab
- Look for TypeScript errors or missing dependencies

**3. Database Connection Issues**
- Verify DATABASE_URL format
- Check PostgreSQL service is running

### Step 7: Configure Custom Domain

#### Add Domain in Railway

1. Click on your Next.js service
2. Go to "Settings" tab
3. Scroll to "Domains" section
4. Click "Add Domain"
5. Enter: `viralmommy.com`
6. Click "Add Domain" again and enter: `www.viralmommy.com`

Railway will provide DNS configuration instructions.

#### Update DNS Records

Go to your domain registrar (where you bought viralmommy.com) and add these records:

**For Root Domain (viralmommy.com):**

```
Type: A
Name: @
Value: [IP provided by Railway]
TTL: 300
```

OR if your registrar supports CNAME flattening:

```
Type: CNAME
Name: @
Value: [your-service].railway.app
TTL: 300
```

**For WWW Subdomain:**

```
Type: CNAME
Name: www
Value: [your-service].railway.app
TTL: 300
```

#### Verify Domain Configuration

1. Wait 5-60 minutes for DNS propagation
2. Check domain status in Railway dashboard
3. SSL certificate will be auto-provisioned (takes a few minutes)
4. Visit https://viralmommy.com to verify

**Check DNS propagation:**
```bash
nslookup viralmommy.com
```

**Test HTTPS:**
```bash
curl -I https://viralmommy.com
```

### Step 8: Initialize Database Schema

Once deployed, initialize the database:

#### Option A: Via Railway CLI

```bash
cd viralmommy

# Link to Railway project
npx @railway/cli link

# Run migrations
npx @railway/cli run npx prisma migrate deploy

# Generate Prisma Client
npx @railway/cli run npx prisma generate
```

#### Option B: Via Railway Dashboard

1. Click on your Next.js service
2. Go to "Settings" > "Deployments"
3. Click "Run Command"
4. Enter: `npx prisma migrate deploy`
5. Click "Run"

### Step 9: Verify Everything Works

#### Check Health Endpoint

```bash
curl https://viralmommy.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "redis": true,
    "timestamp": "2024-11-12T00:00:00.000Z"
  }
}
```

#### Test Database Connection

```bash
npx @railway/cli run npx prisma studio
```

This opens Prisma Studio to view/edit database records.

#### Test Application Features

1. Visit https://viralmommy.com
2. Try to sign up/log in
3. Test AI content generation
4. Check that media uploads work

---

## Post-Setup Configuration

### Enable Monitoring

1. **Railway Metrics**
   - Automatically enabled
   - View in Railway dashboard > Metrics tab

2. **Sentry Error Tracking**
   - Sign up at sentry.io
   - Create project "viralmommy"
   - Add SENTRY_DSN to Railway variables
   - Redeploy

3. **Uptime Monitoring**
   - Sign up for UptimeRobot or Better Uptime
   - Monitor: https://viralmommy.com/api/health

### Configure Automatic Backups

1. **PostgreSQL Backups**
   - Automatically enabled by Railway
   - Daily backups, 7-day retention
   - Access via Railway dashboard > Database > Backups

2. **Redis Backups**
   - Persistence enabled by default
   - Snapshots on Redis service restart

### Set Up CI/CD

Railway automatically deploys on push to main:

```bash
# Make changes locally
git add .
git commit -m "feat: new feature"
git push origin main

# Railway auto-deploys
```

To deploy from other branches:

1. Railway dashboard > Service settings
2. Change "Production Branch" to your branch
3. Save changes

### Enable Preview Environments

For pull request previews:

1. Railway dashboard > Project settings
2. Enable "PR Deploys"
3. Each PR gets its own preview URL
4. Auto-deleted when PR is closed

---

## Estimated Costs

### Railway Pricing

**Hobby Plan (Recommended for MVP):**
- $5/month base fee
- Plus usage-based pricing:
  - Next.js service: ~$5-10/month
  - PostgreSQL: ~$3-5/month
  - Redis: ~$2-3/month
- **Total: ~$15-23/month**

**Pro Plan (For production scale):**
- $20/month base fee
- Better resource limits
- Priority support
- **Total: ~$30-50/month**

**Monitor your usage:**
- Railway dashboard > Usage tab
- Set up billing alerts
- Review monthly invoices

---

## Troubleshooting Common Issues

### Issue: Deployment Fails with "Cannot find module"

**Solution:**
```bash
# Ensure all dependencies are in package.json
npm install <missing-package> --save

# Commit and push
git add package.json package-lock.json
git commit -m "fix: add missing dependency"
git push
```

### Issue: Database Connection Timeout

**Solution:**
1. Check DATABASE_URL is set correctly
2. Verify PostgreSQL service is running
3. Try using DATABASE_PRIVATE_URL instead (internal network)

### Issue: Build Timeout

**Solution:**
1. Increase build timeout in Settings > Deploy
2. Optimize build process (reduce dependencies)
3. Consider upgrading Railway plan

### Issue: Out of Memory

**Solution:**
```bash
# Add to Railway variables:
NODE_OPTIONS=--max-old-space-size=4096
```

### Issue: SSL Certificate Not Provisioning

**Solution:**
1. Verify DNS records are correct
2. Wait up to 24 hours for DNS propagation
3. Check domain status in Railway dashboard
4. Contact Railway support if issue persists

---

## Getting Help

**Railway Support:**
- Discord: https://discord.gg/railway
- Help Station: https://help.railway.app
- Status Page: https://status.railway.app

**ViralMommy Team:**
- GitHub Issues: https://github.com/jonahchandler113-bot/viralmommy/issues
- Documentation: See `/docs` directory

---

## Next Steps After Setup

1. **Configure External Services**
   - Set up Cloudflare R2 for media storage
   - Configure OAuth providers
   - Set up Stripe for payments

2. **Database Management**
   - Create database indexes for performance
   - Set up automated migrations
   - Plan data retention policies

3. **Security Hardening**
   - Enable rate limiting
   - Configure CORS policies
   - Set up security headers
   - Review Railway security best practices

4. **Performance Optimization**
   - Enable Redis caching
   - Optimize database queries
   - Set up CDN for static assets
   - Configure image optimization

5. **Monitoring & Alerts**
   - Set up error tracking
   - Configure uptime alerts
   - Create performance dashboards
   - Set up log aggregation

---

**Setup Guide Version:** 1.0.0
**Last Updated:** November 12, 2024
**Estimated Setup Time:** 30-45 minutes
