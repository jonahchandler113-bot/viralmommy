# Facebook Integration Setup Guide

This guide will walk you through setting up Facebook OAuth and publishing capabilities for ViralMommy.

## Prerequisites

- A Facebook account
- Admin access to a Facebook Page
- Your Railway deployment URL

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Choose **"Business"** as the app type
4. Fill in app details:
   - **App Name**: ViralMommy
   - **App Contact Email**: Your email
   - **Business Account**: (optional)
5. Click **"Create App"**

## Step 2: Configure Facebook Login

1. In your app dashboard, click **"Add Product"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Choose **"Web"** as the platform
4. Enter your Site URL:
   ```
   https://your-railway-app.com
   ```
5. Click **"Save"** and **"Continue"**

## Step 3: Configure OAuth Settings

1. Go to **Settings** → **Basic**
2. Add your **App Domains**:
   ```
   your-railway-app.com
   ```

3. Scroll down to **"Add Platform"** → **"Website"**
4. Enter **Site URL**:
   ```
   https://your-railway-app.com
   ```

5. Go to **Facebook Login** → **Settings**
6. Add **Valid OAuth Redirect URIs**:
   ```
   https://your-railway-app.com/api/platforms/facebook/callback
   ```
7. **Save Changes**

## Step 4: Get App Credentials

1. Go to **Settings** → **Basic**
2. Copy your **App ID** and **App Secret**
3. Add these to your Railway environment variables:
   ```
   FACEBOOK_APP_ID=your_app_id_here
   FACEBOOK_APP_SECRET=your_app_secret_here
   ```

## Step 5: Add Required Permissions

1. Go to **App Review** → **Permissions and Features**
2. Request the following permissions (some may need Facebook review):
   - `pages_show_list` - To list user's pages
   - `pages_read_engagement` - To read page engagement
   - `pages_manage_posts` - To publish to pages
   - `instagram_basic` - Instagram basic access
   - `instagram_content_publish` - Publish to Instagram
   - `business_management` - Manage business assets

**Note:** Some permissions require Business Verification. For development, you can use Test Users without approval.

## Step 6: Switch to Live Mode (Production)

1. Go to **Settings** → **Basic**
2. At the top, toggle from **"In Development"** to **"Live"**
3. This allows real users (not just testers) to connect

**Before going live, Facebook requires:**
- Privacy Policy URL
- Terms of Service URL
- App Review for certain permissions

## Step 7: Test the Integration

1. Deploy your code to Railway
2. Go to your app's Settings page
3. Click **"Connect"** on Facebook
4. Authorize the app
5. Select a Facebook Page to connect
6. You should be redirected back to Settings with success message

## Publishing Videos

Once connected, you can publish videos to Facebook:

```typescript
// API call from frontend
const response = await fetch('/api/platforms/facebook/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoId: 'video-uuid',
    caption: 'Your video caption with hashtags',
    publishToInstagram: false, // Set true to also publish to Instagram
  }),
})
```

## Token Management

- Facebook provides **60-day long-lived tokens**
- Tokens are automatically refreshed before expiry
- Page tokens don't expire as long as the user token is valid
- Implement token refresh in a cron job for production

## Troubleshooting

### "No Facebook Pages Found"
- Make sure you're an admin of at least one Facebook Page
- Create a Page at facebook.com/pages/create

### "Invalid Redirect URI"
- Double-check the callback URL in Facebook settings
- Ensure it exactly matches: `https://your-domain.com/api/platforms/facebook/callback`
- No trailing slash!

### "Permission Denied"
- Some permissions require app review
- Use Test Users during development
- Submit for App Review before public launch

### "Token Expired"
- Reconnect your Facebook account from Settings
- Implement automatic token refresh (coming soon)

## Instagram Integration

To publish to Instagram (via Facebook):

1. Connect your Instagram Business Account to your Facebook Page
2. Go to Facebook Page Settings → Instagram
3. Connect Instagram account
4. Use the same Facebook OAuth flow
5. Set `publishToInstagram: true` when publishing

## Environment Variables

Required in Railway:

```env
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
NEXTAUTH_URL=https://your-railway-app.com
```

## Resources

- [Facebook OAuth Documentation](https://developers.facebook.com/docs/facebook-login)
- [Pages API](https://developers.facebook.com/docs/pages-api)
- [Instagram API](https://developers.facebook.com/docs/instagram-api)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

## Next Steps

After Facebook is working:
1. Test video publishing end-to-end
2. Set up Instagram OAuth (uses same Facebook app)
3. Add TikTok integration
4. Add YouTube integration
5. Implement analytics fetching from Facebook Insights
