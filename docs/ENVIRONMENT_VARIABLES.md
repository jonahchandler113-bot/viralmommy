# Environment Variables Reference

## Quick Start

For local development, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then fill in the required values.

---

## Variable Categories

### 1. Database & Cache (Required)

#### `DATABASE_URL`
- **Required:** Yes
- **Source:** Railway PostgreSQL service
- **Format:** `postgresql://user:password@host:port/database`
- **Example:** `postgresql://postgres:abc123@containers.railway.app:5432/railway`
- **Used by:** Prisma ORM, database connections
- **Notes:** Get from Railway PostgreSQL service variables

#### `DIRECT_DATABASE_URL`
- **Required:** No (but recommended)
- **Source:** Railway PostgreSQL service
- **Format:** `postgresql://user:password@host:port/database`
- **Example:** `postgresql://postgres:abc123@containers.railway.app:5432/railway`
- **Used by:** Prisma migrations, schema operations
- **Notes:** Direct connection without pooling

#### `REDIS_URL`
- **Required:** Yes
- **Source:** Railway Redis service
- **Format:** `redis://user:password@host:port`
- **Example:** `redis://default:xyz789@containers.railway.app:6379`
- **Used by:** Session storage, caching, rate limiting, job queues
- **Notes:** Get from Railway Redis service variables

---

### 2. Authentication (Required)

#### `NEXTAUTH_SECRET`
- **Required:** Yes
- **Source:** Generate yourself
- **Format:** Base64 string (32+ bytes)
- **Generate with:** `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- **Example:** `Z3PonfpuCQPeksuWoD91N4yVP1x/zT4WwWPypw03EK4=`
- **Used by:** NextAuth.js for session encryption
- **Security:** CRITICAL - Rotate every 90 days, never commit to Git

#### `NEXTAUTH_URL`
- **Required:** Yes
- **Source:** Your application URL
- **Format:** Full URL with protocol
- **Development:** `http://localhost:3000`
- **Production:** `https://viralmommy.com`
- **Used by:** NextAuth.js for callbacks and redirects
- **Notes:** Must match your deployed domain

---

### 3. OAuth Providers (Required for Auth Features)

#### Google OAuth

##### `GOOGLE_CLIENT_ID`
- **Required:** Yes (for Google sign-in)
- **Source:** Google Cloud Console
- **Format:** `xxxxx.apps.googleusercontent.com`
- **Get from:** https://console.cloud.google.com/apis/credentials
- **Used by:** Google OAuth authentication
- **Setup:**
  1. Create project in Google Cloud Console
  2. Enable Google+ API
  3. Create OAuth 2.0 credentials
  4. Add authorized redirect URI: `https://viralmommy.com/api/auth/callback/google`

##### `GOOGLE_CLIENT_SECRET`
- **Required:** Yes (for Google sign-in)
- **Source:** Google Cloud Console
- **Format:** String
- **Security:** Keep secret, never commit to Git

#### Instagram OAuth

##### `INSTAGRAM_CLIENT_ID`
- **Required:** Yes (for Instagram posting)
- **Source:** Facebook Developers
- **Get from:** https://developers.facebook.com
- **Used by:** Instagram content posting

##### `INSTAGRAM_CLIENT_SECRET`
- **Required:** Yes (for Instagram posting)
- **Source:** Facebook Developers

#### TikTok OAuth

##### `TIKTOK_CLIENT_KEY`
- **Required:** Yes (for TikTok posting)
- **Source:** TikTok Developers
- **Get from:** https://developers.tiktok.com

##### `TIKTOK_CLIENT_SECRET`
- **Required:** Yes (for TikTok posting)
- **Source:** TikTok Developers

#### Facebook OAuth (Optional)

##### `FACEBOOK_CLIENT_ID`
- **Required:** No
- **Source:** Facebook Developers
- **Used by:** Facebook integration

##### `FACEBOOK_CLIENT_SECRET`
- **Required:** No
- **Source:** Facebook Developers

---

### 4. AI Services (Required for Content Generation)

#### `ANTHROPIC_API_KEY`
- **Required:** Yes
- **Source:** Anthropic Console
- **Format:** `sk-ant-xxxxx`
- **Get from:** https://console.anthropic.com/settings/keys
- **Used by:** Claude AI for content generation, script writing
- **Pricing:** Pay-per-use
- **Notes:** Main AI service for ViralMommy

#### `OPENAI_API_KEY`
- **Required:** Optional
- **Source:** OpenAI Platform
- **Format:** `sk-xxxxx`
- **Get from:** https://platform.openai.com/api-keys
- **Used by:** Alternative AI models, embeddings
- **Pricing:** Pay-per-use

---

### 5. Storage (Required for Media)

#### Cloudflare R2

##### `R2_ACCOUNT_ID`
- **Required:** Yes (for media storage)
- **Source:** Cloudflare Dashboard
- **Get from:** https://dash.cloudflare.com
- **Used by:** Cloudflare R2 SDK

##### `R2_ACCESS_KEY_ID`
- **Required:** Yes
- **Source:** Cloudflare R2 API Tokens
- **Used by:** S3-compatible authentication

##### `R2_SECRET_ACCESS_KEY`
- **Required:** Yes
- **Source:** Cloudflare R2 API Tokens
- **Security:** Keep secret

##### `R2_BUCKET_NAME`
- **Required:** Yes
- **Default:** `viralmommy-media`
- **Used by:** Storage bucket identification

##### `R2_PUBLIC_URL`
- **Required:** Yes
- **Format:** `https://media.viralmommy.com`
- **Used by:** Public CDN URL for media assets
- **Notes:** Configure custom domain in Cloudflare

---

### 6. Payment Processing (Required for Subscriptions)

#### Stripe

##### `STRIPE_SECRET_KEY`
- **Required:** Yes (for payments)
- **Source:** Stripe Dashboard
- **Format:** `sk_test_xxx` (test) or `sk_live_xxx` (production)
- **Get from:** https://dashboard.stripe.com/apikeys
- **Used by:** Server-side payment processing
- **Security:** CRITICAL - Never expose to client

##### `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Required:** Yes (for payments)
- **Source:** Stripe Dashboard
- **Format:** `pk_test_xxx` or `pk_live_xxx`
- **Used by:** Client-side Stripe.js
- **Notes:** Safe to expose to client (prefix: NEXT_PUBLIC_)

##### `STRIPE_WEBHOOK_SECRET`
- **Required:** Yes (for webhooks)
- **Source:** Stripe Webhook settings
- **Format:** `whsec_xxx`
- **Used by:** Webhook signature verification
- **Get from:** Stripe Dashboard > Webhooks > Add endpoint

##### Subscription Price IDs

##### `STRIPE_PRICE_ID_STARTER`
- **Required:** Yes
- **Source:** Create in Stripe Dashboard > Products
- **Format:** `price_xxx`
- **Used by:** Starter plan subscription

##### `STRIPE_PRICE_ID_PRO`
- **Required:** Yes
- **Source:** Stripe Dashboard
- **Used by:** Pro plan subscription

##### `STRIPE_PRICE_ID_ENTERPRISE`
- **Required:** Yes
- **Source:** Stripe Dashboard
- **Used by:** Enterprise plan subscription

---

### 7. Email Service (Required for Transactional Emails)

#### Resend

##### `RESEND_API_KEY`
- **Required:** Yes
- **Source:** Resend Dashboard
- **Format:** `re_xxx`
- **Get from:** https://resend.com/api-keys
- **Used by:** Sending transactional emails

##### `EMAIL_FROM`
- **Required:** Yes
- **Format:** `noreply@viralmommy.com`
- **Used by:** Sender email address
- **Notes:** Domain must be verified in Resend

---

### 8. Monitoring & Error Tracking (Recommended)

#### Sentry

##### `SENTRY_DSN`
- **Required:** No (but recommended)
- **Source:** Sentry Project Settings
- **Format:** `https://xxx@xxx.ingest.sentry.io/xxx`
- **Get from:** https://sentry.io/settings/
- **Used by:** Error tracking and monitoring

##### `SENTRY_AUTH_TOKEN`
- **Required:** No
- **Source:** Sentry Settings
- **Used by:** Source map uploads

##### `NEXT_PUBLIC_SENTRY_ENABLED`
- **Required:** No
- **Default:** `true` (production), `false` (development)
- **Values:** `true` or `false`
- **Used by:** Enable/disable Sentry in client

---

### 9. Analytics (Optional)

#### Google Analytics

##### `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- **Required:** No
- **Source:** Google Analytics
- **Format:** `G-XXXXXXXXXX`
- **Used by:** Web analytics

#### PostHog

##### `NEXT_PUBLIC_POSTHOG_KEY`
- **Required:** No
- **Source:** PostHog
- **Used by:** Product analytics

##### `NEXT_PUBLIC_POSTHOG_HOST`
- **Required:** No
- **Default:** `https://app.posthog.com`
- **Used by:** PostHog API endpoint

---

### 10. Security & Rate Limiting

#### `RATE_LIMIT_MAX_REQUESTS`
- **Required:** No
- **Default:** `100`
- **Used by:** API rate limiting (requests per window)

#### `RATE_LIMIT_WINDOW_MS`
- **Required:** No
- **Default:** `60000` (1 minute)
- **Used by:** Rate limit window size

#### `CORS_ALLOWED_ORIGINS`
- **Required:** No
- **Default:** `https://viralmommy.com,https://www.viralmommy.com`
- **Format:** Comma-separated URLs
- **Used by:** CORS configuration

---

### 11. Feature Flags (Optional)

#### `FEATURE_AI_GENERATION`
- **Required:** No
- **Default:** `true`
- **Values:** `true` or `false`
- **Used by:** Enable/disable AI content generation

#### `FEATURE_SOCIAL_POSTING`
- **Required:** No
- **Default:** `true`
- **Used by:** Enable/disable social media posting

#### `FEATURE_VIDEO_PROCESSING`
- **Required:** No
- **Default:** `true`
- **Used by:** Enable/disable video processing

#### `FEATURE_BRAND_PARTNERSHIPS`
- **Required:** No
- **Default:** `false`
- **Used by:** Enable/disable brand partnership features

---

### 12. System Configuration

#### `NODE_ENV`
- **Required:** Yes
- **Values:** `development`, `production`, `test`
- **Railway:** Set to `production`
- **Local:** Defaults to `development`
- **Used by:** Next.js, various libraries

---

## Environment-Specific Variables

### Local Development (.env.local)

**Minimal setup for local development:**

```bash
# Database (use local PostgreSQL or Railway)
DATABASE_URL="postgresql://postgres:password@localhost:5432/viralmommy"

# Redis (use local Redis or Railway)
REDIS_URL="redis://localhost:6379"

# Auth
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"

# AI (add your keys)
ANTHROPIC_API_KEY="sk-ant-your-key"

# Node environment
NODE_ENV="development"
```

### Railway Production

**All required variables must be set in Railway dashboard.**

Use Railway variable references:
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

---

## Security Best Practices

### Never Commit Secrets
- ✅ `.env.example` - Template only, no real values
- ❌ `.env`, `.env.local` - Contains secrets, in .gitignore
- ❌ `.env.production` - Contains secrets, in .gitignore

### Prefix Rules
- **`NEXT_PUBLIC_`** - Exposed to client (browser)
- **No prefix** - Server-only, never exposed to client

### Variable Validation

Add to `lib/env.ts`:

```typescript
function validateEnv() {
  const required = [
    'DATABASE_URL',
    'REDIS_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }
}

validateEnv()
```

### Rotation Schedule

Rotate these secrets regularly:

- **Every 90 days:**
  - NEXTAUTH_SECRET
  - Database passwords (via Railway)
  - Redis passwords (via Railway)

- **Annually:**
  - API keys
  - OAuth credentials

- **Immediately if compromised:**
  - All secrets

---

## Troubleshooting

### Common Issues

#### Database Connection Fails
- Check `DATABASE_URL` format
- Verify PostgreSQL service is running
- Try `DIRECT_DATABASE_URL` instead

#### Redis Connection Timeout
- Check `REDIS_URL` format
- Verify Redis service is running
- Check network connectivity

#### OAuth Not Working
- Verify redirect URIs match
- Check client ID and secret
- Ensure OAuth app is in production mode

#### Stripe Webhooks Failing
- Verify `STRIPE_WEBHOOK_SECRET`
- Check webhook endpoint URL
- Review Stripe Dashboard > Webhooks > Logs

### Debugging Environment Variables

```typescript
// Check if variable is set
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')

// Never log the actual value in production
if (process.env.NODE_ENV === 'development') {
  console.log('DATABASE_URL:', process.env.DATABASE_URL)
}
```

---

## Railway-Specific Notes

### Variable References

Reference other service variables:
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

### Shared Variables

Create shared variables across services:
```bash
NEXTAUTH_SECRET=${{shared.NEXTAUTH_SECRET}}
```

### Variable Precedence

1. Service variables (highest)
2. Shared variables
3. Project variables (lowest)

---

## Update History

- **2024-11-12**: Initial environment variables documentation
- **TBD**: Add new OAuth providers
- **TBD**: Add analytics configuration

---

**Document Version:** 1.0.0
**Last Updated:** November 12, 2024
