# ViralMommy Infrastructure Documentation

## Overview

ViralMommy is deployed on Railway with the following architecture:
- **Hosting**: Railway (Next.js app)
- **Database**: PostgreSQL 15+ (Railway)
- **Cache/Queue**: Redis 7+ (Railway)
- **Storage**: Cloudflare R2
- **Domain**: viralmommy.com
- **Monitoring**: Sentry (to be configured)

## Table of Contents

1. [Railway Setup](#railway-setup)
2. [Database Configuration](#database-configuration)
3. [Redis Configuration](#redis-configuration)
4. [Environment Variables](#environment-variables)
5. [Domain Configuration](#domain-configuration)
6. [Deployment Process](#deployment-process)
7. [Monitoring & Observability](#monitoring--observability)
8. [Backup & Recovery](#backup--recovery)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Railway Setup

### 1. Create Railway Project

**Via Dashboard (Recommended):**

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Empty Project"
4. Name the project: **viralmommy**
5. Add a description: "AI-powered content platform for mom creators"

**Via CLI (Alternative):**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init

# Link to existing GitHub repo
railway link jonahchandler113-bot/viralmommy
```

### 2. Add GitHub Repository

1. In Railway dashboard, click "+ New" button
2. Select "GitHub Repo"
3. Choose repository: **jonahchandler113-bot/viralmommy**
4. Select branch: **main**
5. Railway will auto-detect it's a Next.js app

### 3. Configure Build Settings

Railway should auto-detect the following:
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Root Directory**: `/`

If needed, manually configure in Settings > Deploy:
```json
{
  "builder": "NIXPACKS",
  "buildCommand": "npm install && npm run build",
  "startCommand": "npm run start"
}
```

---

## Database Configuration

### PostgreSQL Setup on Railway

#### 1. Add PostgreSQL Service

**Via Dashboard:**
1. In your Railway project, click "+ New"
2. Select "Database"
3. Choose "PostgreSQL"
4. Railway will provision a PostgreSQL 15+ instance

**Via CLI:**
```bash
railway add --database postgresql
```

#### 2. Get Database Connection String

After provisioning, Railway provides these variables:
- `DATABASE_URL`: Connection string with connection pooling
- `DATABASE_PRIVATE_URL`: Private network connection (faster)
- `PGHOST`: Database host
- `PGPORT`: Database port (default: 5432)
- `PGUSER`: Database user
- `PGPASSWORD`: Database password
- `PGDATABASE`: Database name

**Copy the DATABASE_URL** - it will look like:
```
postgresql://postgres:PASSWORD@containers.railway.app:5432/railway
```

#### 3. Configure Connection Pooling

For production, use PgBouncer for connection pooling:

1. In Railway PostgreSQL service, go to "Settings"
2. Enable "Connection Pooling" (PgBouncer)
3. Update your `DATABASE_URL` to use the pooled connection

**Environment Variables:**
```bash
# For application queries (use pooled connection)
DATABASE_URL="postgresql://postgres:PASSWORD@containers.railway.app:6543/railway?pgbouncer=true"

# For migrations (use direct connection)
DIRECT_DATABASE_URL="postgresql://postgres:PASSWORD@containers.railway.app:5432/railway"
```

#### 4. Initialize Database Schema

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (if needed)
npx prisma db seed
```

#### 5. Database Maintenance

**Backups:**
- Railway automatically backs up PostgreSQL daily
- Retention: 7 days on Hobby plan, 14 days on Pro
- Access backups via Railway Dashboard > Database > Backups

**Monitoring:**
```bash
# Check database status
railway run psql $DATABASE_URL -c "SELECT version();"

# Check database size
railway run psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('railway'));"

# View active connections
railway run psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Redis Configuration

### Redis Setup on Railway

#### 1. Add Redis Service

**Via Dashboard:**
1. In your Railway project, click "+ New"
2. Select "Database"
3. Choose "Redis"
4. Railway will provision a Redis 7+ instance

**Via CLI:**
```bash
railway add --database redis
```

#### 2. Get Redis Connection String

After provisioning, Railway provides:
- `REDIS_URL`: Connection string
- `REDIS_PRIVATE_URL`: Private network connection
- `REDISHOST`: Redis host
- `REDISPORT`: Redis port (default: 6379)
- `REDISPASSWORD`: Redis password

**Copy the REDIS_URL** - it will look like:
```
redis://default:PASSWORD@containers.railway.app:6379
```

#### 3. Redis Usage in Application

**Session Storage:**
```typescript
// lib/redis.ts
import { Redis } from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL!)
```

**Caching Strategy:**
- API responses: 5-15 minutes TTL
- User sessions: 7 days TTL
- Rate limiting: 1 minute windows
- Background job queues: BullMQ

**Common Operations:**
```typescript
// Set cache with expiry
await redis.set('key', 'value', 'EX', 300) // 5 minutes

// Get cache
const value = await redis.get('key')

// Delete cache
await redis.del('key')

// Increment counter
await redis.incr('video:views:123')
```

---

## Environment Variables

### Setting Environment Variables in Railway

#### Via Dashboard:
1. Go to your Next.js service in Railway
2. Click "Variables" tab
3. Add each variable from `.env.example`
4. Click "Deploy" to apply changes

#### Via CLI:
```bash
# Set individual variable
railway variables set DATABASE_URL="postgresql://..."

# Set multiple variables from file
railway variables set $(cat .env.local)
```

### Required Environment Variables

See `.env.example` file for complete list. Critical variables:

**Database & Cache:**
```bash
DATABASE_URL=<from-railway-postgresql>
REDIS_URL=<from-railway-redis>
```

**Authentication:**
```bash
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://viralmommy.com
```

**AI Services:**
```bash
ANTHROPIC_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>
```

### Variable References in Railway

Railway allows referencing variables from other services:

```bash
# Reference PostgreSQL DATABASE_URL
${{Postgres.DATABASE_URL}}

# Reference Redis URL
${{Redis.REDIS_URL}}
```

This is useful for keeping services in sync.

---

## Domain Configuration

### Configure viralmommy.com on Railway

#### 1. Add Custom Domain in Railway

1. Go to your Next.js service
2. Click "Settings" > "Domains"
3. Click "Add Domain"
4. Enter: `viralmommy.com` and `www.viralmommy.com`

#### 2. Update DNS Records

Railway will provide DNS instructions. Add these records in your domain registrar:

**For root domain (viralmommy.com):**
```
Type: A
Name: @
Value: <railway-ip-address>
TTL: 300
```

OR (if CNAME flattening supported):
```
Type: CNAME
Name: @
Value: <your-app>.railway.app
TTL: 300
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: <your-app>.railway.app
TTL: 300
```

#### 3. SSL Certificate

Railway automatically provisions SSL certificates via Let's Encrypt:
- SSL is auto-enabled for custom domains
- Certificates auto-renew every 90 days
- HTTPS is enforced by default

#### 4. Verify Domain

```bash
# Check DNS propagation
nslookup viralmommy.com

# Test HTTPS
curl -I https://viralmommy.com
```

Wait 5-60 minutes for DNS propagation globally.

---

## Deployment Process

### Automated Deployments

Railway automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Railway automatically:
# 1. Detects push to main branch
# 2. Pulls latest code
# 3. Installs dependencies
# 4. Runs build command
# 5. Deploys new version
# 6. Performs health checks
```

### Manual Deployments via CLI

```bash
# Deploy current directory
railway up

# Deploy specific service
railway up --service viralmommy

# Watch deployment logs
railway logs --follow
```

### Deployment Workflow

1. **Build Phase**
   ```bash
   npm install
   npm run build
   npx prisma generate
   ```

2. **Health Checks**
   - Railway pings `/api/health` endpoint
   - Requires 200 OK response
   - Timeout: 300 seconds

3. **Zero-Downtime Deployment**
   - Railway keeps old version running
   - Deploys new version in parallel
   - Switches traffic when health checks pass
   - Old version shut down after cutover

### Rollback Strategy

```bash
# Via Dashboard
# 1. Go to Deployments tab
# 2. Find previous deployment
# 3. Click "Redeploy"

# Via CLI
railway rollback
```

---

## Monitoring & Observability

### Railway Built-in Monitoring

**Metrics Available:**
- CPU usage
- Memory usage
- Network I/O
- Request count
- Response times
- Error rates

**Access Metrics:**
1. Railway Dashboard > Your Service
2. Click "Metrics" tab
3. View real-time and historical data

### Application Logs

**View Logs:**
```bash
# Via CLI
railway logs --follow

# Via Dashboard
# Go to service > Deployments > Click deployment > View logs
```

**Log Levels:**
- `INFO`: General information
- `WARN`: Warning messages
- `ERROR`: Error messages
- `DEBUG`: Debug information (disable in production)

### Sentry Integration (Recommended)

**Setup:**
1. Sign up at [sentry.io](https://sentry.io)
2. Create new project: "viralmommy"
3. Get DSN from project settings
4. Add to Railway environment variables:

```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_ENABLED=true
```

**Configure in Next.js:**
```typescript
// pages/_app.tsx
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

### Uptime Monitoring

**Recommended Tools:**
- [UptimeRobot](https://uptimerobot.com) - Free, 5-minute intervals
- [Better Uptime](https://betteruptime.com) - 30-second intervals
- [Checkly](https://www.checklyhq.com) - API monitoring

**Monitor these endpoints:**
- `https://viralmommy.com` - Homepage
- `https://viralmommy.com/api/health` - Health check
- `https://viralmommy.com/api/auth/session` - Auth system

---

## Backup & Recovery

### Database Backups

**Automated Backups (Railway):**
- Frequency: Daily
- Retention: 7 days (Hobby), 14 days (Pro)
- Type: Full database snapshots

**Manual Backups:**
```bash
# Create backup
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
railway run psql $DATABASE_URL < backup_20231205.sql
```

**Export to Local:**
```bash
# Export schema
npx prisma db pull

# Export data
railway run pg_dump -Fc $DATABASE_URL > viralmommy_backup.dump
```

### Redis Backups

Redis is used for cache/sessions (ephemeral data):
- No regular backups needed
- Data can be regenerated
- Persistence enabled on Railway

**Manual Redis snapshot:**
```bash
railway run redis-cli -u $REDIS_URL BGSAVE
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 1 hour
**RPO (Recovery Point Objective):** 24 hours

**Recovery Steps:**
1. Create new Railway project
2. Restore PostgreSQL from latest backup
3. Provision new Redis instance
4. Update environment variables
5. Deploy application from GitHub
6. Update DNS if needed
7. Verify functionality

---

## Security Best Practices

### Environment Variable Security

- **Never commit** `.env`, `.env.local`, `.env.production` to Git
- Use Railway's encrypted variable storage
- Rotate secrets every 90 days
- Use different credentials for dev/staging/prod

### Database Security

```sql
-- Create read-only user for analytics
CREATE USER analytics_readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE railway TO analytics_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;

-- Revoke unnecessary permissions
REVOKE ALL ON DATABASE railway FROM PUBLIC;
```

### API Rate Limiting

Implement rate limiting using Redis:

```typescript
// lib/rate-limit.ts
import { Redis } from 'ioredis'

export async function rateLimit(identifier: string) {
  const redis = new Redis(process.env.REDIS_URL!)
  const key = `rate_limit:${identifier}`
  const limit = 100 // requests per window
  const window = 60 // seconds

  const current = await redis.incr(key)
  if (current === 1) {
    await redis.expire(key, window)
  }

  if (current > limit) {
    return { success: false, limit, current }
  }

  return { success: true, limit, current }
}
```

### CORS Configuration

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'https://viralmommy.com',
    'https://www.viralmommy.com',
  ]

  if (origin && !allowedOrigins.includes(origin)) {
    return new Response('CORS not allowed', { status: 403 })
  }

  // Continue with request
}
```

### Secrets Management

**Railway Secrets:**
- Encrypted at rest
- Encrypted in transit
- Access controlled via Railway RBAC

**Never log secrets:**
```typescript
// Bad
console.log('API Key:', process.env.ANTHROPIC_API_KEY)

// Good
console.log('API Key:', process.env.ANTHROPIC_API_KEY ? '[REDACTED]' : 'NOT SET')
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Error:** `Error: P1001: Can't reach database server`

**Solution:**
```bash
# Check DATABASE_URL is set
railway run echo $DATABASE_URL

# Test connection
railway run psql $DATABASE_URL -c "SELECT 1"

# Check if database is running
railway status
```

#### 2. Build Failures

**Error:** `npm ERR! Failed at the build script`

**Solution:**
```bash
# Check build logs
railway logs --deployment <deployment-id>

# Verify package.json scripts
cat package.json | grep build

# Test build locally
npm run build
```

#### 3. Out of Memory

**Error:** `JavaScript heap out of memory`

**Solution:**
```bash
# Increase Node.js memory limit
# Add to Railway environment variables:
NODE_OPTIONS=--max-old-space-size=4096
```

#### 4. Redis Connection Timeout

**Error:** `TimeoutError: Connection timeout`

**Solution:**
```typescript
// Increase Redis timeout
const redis = new Redis(process.env.REDIS_URL!, {
  connectTimeout: 10000,
  maxRetriesPerRequest: 3,
})
```

#### 5. Deployment Stuck

**Issue:** Deployment in "Building" state for >10 minutes

**Solution:**
```bash
# Cancel deployment
railway deployment cancel

# Redeploy
railway up --force
```

### Health Check Endpoint

Create an API health check endpoint:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export async function GET() {
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString(),
  }

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`
    checks.database = true

    // Check Redis
    await redis.ping()
    checks.redis = true

    const allHealthy = checks.database && checks.redis

    return NextResponse.json(
      { status: allHealthy ? 'healthy' : 'degraded', checks },
      { status: allHealthy ? 200 : 503 }
    )
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', checks, error: String(error) },
      { status: 503 }
    )
  }
}
```

### Getting Help

**Railway Support:**
- Discord: [railway.app/discord](https://railway.app/discord)
- Help Station: [help.railway.app](https://help.railway.app)
- Status Page: [status.railway.app](https://status.railway.app)

**ViralMommy Team:**
- GitHub Issues: [github.com/jonahchandler113-bot/viralmommy/issues](https://github.com/jonahchandler113-bot/viralmommy/issues)
- Documentation: See `/docs` directory

---

## Next Steps

1. **Complete Railway Setup**
   - Create project via dashboard
   - Add PostgreSQL and Redis
   - Copy connection strings to environment variables

2. **Configure External Services**
   - Set up Cloudflare R2 for media storage
   - Configure OAuth providers (Google, Instagram, TikTok)
   - Set up Stripe for payments

3. **Initialize Database**
   - Run Prisma migrations
   - Seed initial data

4. **Deploy Application**
   - Push to GitHub main branch
   - Verify deployment succeeds
   - Test all endpoints

5. **Configure Domain**
   - Add custom domain in Railway
   - Update DNS records
   - Verify SSL certificate

6. **Set Up Monitoring**
   - Configure Sentry for error tracking
   - Set up uptime monitoring
   - Create alert rules

---

## Resource Limits

**Railway Hobby Plan:**
- $5/month base + usage
- 512MB RAM per service
- 1GB storage per database
- 100GB bandwidth
- Unlimited projects

**Recommended for Production:**
- Upgrade to Pro plan ($20/month)
- 8GB RAM per service
- 10GB storage per database
- 1TB bandwidth
- Priority support

**Monitor Usage:**
```bash
railway status --usage
```

---

## Changelog

- **2024-11-12**: Initial infrastructure documentation
- **TBD**: Add Sentry integration
- **TBD**: Configure Cloudflare R2
- **TBD**: Set up CI/CD pipelines

---

**Document Version:** 1.0.0
**Last Updated:** November 12, 2024
**Maintained By:** ViralMommy DevOps Team
