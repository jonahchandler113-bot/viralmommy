# Analytics Auto-Sync Setup Guide

This guide will help you set up automatic analytics syncing for ViralMommy, which fetches metrics from all connected platforms (TikTok, Instagram, Facebook, YouTube) and updates your database hourly.

## Overview

The analytics sync system:
- Runs automatically every hour
- Fetches the latest metrics (views, likes, comments, shares, saves)
- Updates published posts in the database
- Handles token refresh automatically for TikTok and YouTube
- Processes the last 90 days of published posts
- Includes security via secret token

## Setup Instructions

### 1. Add Environment Variable to Railway

1. Go to your Railway project dashboard
2. Navigate to your service → Variables tab
3. Add a new variable:
   - **Key:** `CRON_SECRET`
   - **Value:** Generate a random secret (e.g., `your-random-secret-key-here-12345`)
   - Keep this secret safe - it's used to authenticate cron requests

### 2. Set Up Cron Job

You have two options for running the cron job:

#### Option A: Use Cron-job.org (Recommended - Free)

1. Go to https://cron-job.org
2. Create a free account
3. Create a new cron job:
   - **Title:** ViralMommy Analytics Sync
   - **Address:** `https://your-railway-app.railway.app/api/cron/sync-analytics`
   - **Schedule:** Every hour (0 * * * *)
   - **Request Method:** GET
   - **Headers:** Add custom header
     - **Header:** `Authorization`
     - **Value:** `Bearer your-random-secret-key-here-12345` (use your CRON_SECRET)
4. Save and enable the cron job

#### Option B: Use Railway Cron (If Available)

If Railway offers cron functionality:

1. In Railway dashboard, go to your service
2. Add a cron schedule:
   ```
   0 * * * *
   ```
3. Set the command:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://your-railway-app.railway.app/api/cron/sync-analytics
   ```

#### Option C: Use GitHub Actions (Free Alternative)

Create `.github/workflows/sync-analytics.yml`:

```yaml
name: Sync Analytics

on:
  schedule:
    # Run every hour
    - cron: '0 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Call Analytics Sync Endpoint
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-railway-app.railway.app/api/cron/sync-analytics
```

Then add `CRON_SECRET` to your GitHub repository secrets.

### 3. Verify Setup

#### Manual Test

Test the cron endpoint manually to ensure it works:

```bash
curl -X GET \
  -H "Authorization: Bearer your-random-secret-key-here-12345" \
  https://your-railway-app.railway.app/api/cron/sync-analytics
```

Expected response:
```json
{
  "success": true,
  "message": "Analytics sync completed",
  "stats": {
    "totalPosts": 10,
    "successCount": 8,
    "errorCount": 2,
    "timestamp": "2025-11-19T20:00:00.000Z"
  }
}
```

#### Check Logs

In Railway dashboard:
1. Go to your service → Deployments
2. Click on the latest deployment
3. View logs to see sync activity:
   ```
   Starting analytics sync...
   Found 10 posts to sync
   Synced analytics for post abc123 (TIKTOK)
   Synced analytics for post def456 (INSTAGRAM)
   ...
   ```

## How It Works

### Sync Process

1. **Authentication:** Verifies CRON_SECRET in Authorization header
2. **Query Posts:** Finds published posts from last 90 days that need syncing
3. **Batch Processing:** Processes up to 100 posts per run (prevents timeouts)
4. **Platform APIs:** Calls each platform's API to fetch metrics:
   - **Facebook:** Uses Graph API for post insights
   - **Instagram:** Uses Graph API for media insights
   - **TikTok:** Uses Open API for video analytics
   - **YouTube:** Uses Data API for video statistics
5. **Token Refresh:** Automatically refreshes expired tokens for TikTok and YouTube
6. **Database Update:** Updates `PublishedPost` records with new metrics
7. **Tracking:** Updates `lastSyncedAt` timestamp to avoid duplicate syncing

### Metrics Synced

| Platform | Views | Likes | Comments | Shares | Saves | Engagement Rate |
|----------|-------|-------|----------|--------|-------|-----------------|
| Facebook | ✅ | ✅ | ❌* | ✅ | ❌ | ✅ |
| Instagram | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| TikTok | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| YouTube | ✅ | ✅ | ✅ | ❌* | ❌ | ✅ |

*Not available via API

### Sync Frequency

- **Hourly sync:** Keeps analytics fresh without hitting rate limits
- **90-day window:** Only syncs recent posts to optimize performance
- **1-hour cooldown:** Each post waits 1 hour between syncs
- **Batch size:** 100 posts per run (scales automatically)

## Troubleshooting

### No Posts Being Synced

**Check:**
- Are there published posts in the last 90 days?
- Do posts have `platformPostId` set?
- Are platforms connected in Settings → Platform Connections?

### Token Expired Errors

**Facebook/Instagram:**
- Long-lived tokens should last 60 days
- Reconnect platform in Settings if token expired

**TikTok:**
- Auto-refreshes using refresh token
- If refresh fails, reconnect in Settings

**YouTube:**
- Auto-refreshes using refresh token
- Refresh tokens don't expire (if used regularly)

### API Rate Limits

Each platform has rate limits:
- **Facebook:** 200 calls per hour per user
- **Instagram:** 200 calls per hour per user
- **TikTok:** 1000 calls per day
- **YouTube:** 10,000 quota units per day

The hourly sync with 100 posts/run stays well within these limits.

### Viewing Sync Status

Check the analytics dashboard to see updated metrics:
1. Go to Dashboard → Analytics
2. View the Overview tab for total metrics
3. Check Platforms tab for platform-specific data
4. Timestamps show last sync time

## Security Notes

- **CRON_SECRET:** Keep this secret safe - it authenticates cron requests
- **Token Storage:** Platform tokens are stored encrypted in database
- **API Keys:** Never commit API keys to git
- **HTTPS Only:** All API calls use HTTPS for security

## Cost Considerations

- **Cron-job.org:** Free tier allows unlimited cron jobs
- **GitHub Actions:** Free tier includes 2,000 minutes/month
- **API Calls:** All platform APIs are free (within rate limits)
- **Railway:** No additional cost for cron endpoint

## Next Steps

After setup:
1. ✅ Verify cron job is running hourly
2. ✅ Check logs for successful syncs
3. ✅ Monitor analytics dashboard for updated metrics
4. ✅ Connect all your social media platforms
5. ✅ Publish content and watch analytics update automatically!

## Support

If you encounter issues:
1. Check Railway logs for error messages
2. Verify CRON_SECRET is set correctly
3. Test endpoint manually with curl
4. Ensure platform connections are active
5. Check platform API documentation for changes

---

**Pro Tip:** Set up monitoring alerts in cron-job.org to get notified if the sync fails!
