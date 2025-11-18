# TikTok Integration Setup Guide

This guide will walk you through setting up TikTok OAuth integration for ViralMommy.

## Prerequisites

- TikTok Business Account
- Access to TikTok Developer Portal

## Step 1: Create TikTok Developer App

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Sign in with your TikTok account
3. Click **Manage Apps** in the top navigation
4. Click **Connect an app** or **Create new app**
5. Fill in the app details:
   - **App name**: ViralMommy (or your preferred name)
   - **Use case**: Content Publishing
   - **Platform**: Web
6. Click **Create**

## Step 2: Configure OAuth Settings

1. In your app dashboard, go to **Login Kit** section
2. Click **Configure** or **Add redirect URL**
3. Add your redirect URL:
   - **Development**: `http://localhost:3000/api/platforms/tiktok/callback`
   - **Production**: `https://yourdomain.com/api/platforms/tiktok/callback`
4. Save the settings

## Step 3: Request API Permissions

TikTok requires manual approval for certain scopes. Request the following permissions:

### Required Scopes:
- `user.info.basic` - Get user profile information
- `video.upload` - Upload videos to TikTok
- `video.publish` - Publish videos to TikTok
- `video.list` - List user's videos

### How to Request:
1. In your app dashboard, go to **Permissions** or **Scopes**
2. Select the scopes listed above
3. Submit for review (usually takes 1-3 business days)
4. TikTok will review your app and approve the scopes

## Step 4: Get API Credentials

1. In your app dashboard, find your **Client Key** and **Client Secret**
2. Copy these values - you'll need them for your environment variables

## Step 5: Update Environment Variables

Add the following to your `.env` file:

```env
# TikTok OAuth & API
TIKTOK_CLIENT_KEY="your-client-key-here"
TIKTOK_CLIENT_SECRET="your-client-secret-here"
```

Replace `your-client-key-here` and `your-client-secret-here` with your actual credentials.

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Log into your app
3. Go to **Settings** → **Platforms** tab
4. Click **Connect** on the TikTok card
5. You'll be redirected to TikTok to authorize the app
6. After authorization, you'll be redirected back to Settings

## TikTok Publishing Features

### Video Upload
- Supports standard TikTok videos
- Maximum file size: 287.6MB
- Supported formats: MP4, MOV, MPEG, AVI, FLV, WebM
- Recommended resolution: 1080x1920 (9:16 vertical)
- Duration: 3 seconds - 10 minutes

### Privacy Settings
The integration currently publishes videos as:
- **Privacy**: Private (SELF_ONLY)
- **Comments**: Enabled
- **Duet**: Enabled
- **Stitch**: Enabled

You can customize these in `lib/services/tiktok.ts`

## API Endpoints Used

- **OAuth Authorization**: `https://www.tiktok.com/v2/auth/authorize/`
- **Token Exchange**: `https://open.tiktokapis.com/v2/oauth/token/`
- **Video Upload**: `https://open.tiktokapis.com/v2/post/publish/video/init/`
- **Video Status**: `https://open.tiktokapis.com/v2/post/publish/status/{publish_id}/`
- **User Info**: `https://open.tiktokapis.com/v2/user/info/`

## Token Management

- **Access Token**: Valid for 24 hours
- **Refresh Token**: Can be used to get new access tokens
- Tokens are automatically refreshed when expired during publish

## Troubleshooting

### "Scopes not approved"
- Ensure you've submitted your app for scope review
- Wait for TikTok to approve your requested permissions
- Check your app's status in the developer portal

### "Invalid client_key"
- Verify your `TIKTOK_CLIENT_KEY` in `.env` is correct
- Make sure there are no extra spaces or quotes

### "Redirect URI mismatch"
- Ensure the redirect URI in your TikTok app matches exactly:
  - `http://localhost:3000/api/platforms/tiktok/callback` for development
  - `https://yourdomain.com/api/platforms/tiktok/callback` for production

### "Video upload failed"
- Check that your video file is accessible via URL
- Verify the video meets TikTok's requirements (size, format, duration)
- Check server logs for detailed error messages

### "Token expired"
- The integration automatically refreshes tokens
- If issues persist, try reconnecting your TikTok account from Settings

## Important Notes

1. **Business Account**: TikTok API access requires a TikTok Business Account
2. **Rate Limits**: TikTok has rate limits on API calls - be mindful when publishing multiple videos
3. **Review Process**: Initial app review can take 1-3 business days
4. **Webhook URL**: TikTok may require a webhook URL for production apps
5. **Production**: Before going live, ensure your app is approved and in production mode

## Testing Checklist

- [ ] TikTok developer app created
- [ ] Redirect URIs configured correctly
- [ ] API scopes approved by TikTok
- [ ] Client key and secret added to `.env`
- [ ] OAuth connection works from Settings page
- [ ] Test video upload and publish
- [ ] Verify video appears in TikTok account
- [ ] Test token refresh functionality

## Resources

- [TikTok for Developers](https://developers.tiktok.com/)
- [TikTok API Documentation](https://developers.tiktok.com/doc)
- [Login Kit Documentation](https://developers.tiktok.com/doc/login-kit-web)
- [Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started)

## Support

If you encounter issues:
1. Check the TikTok developer documentation
2. Review server logs for error details
3. Verify your app status in TikTok Developer Portal
4. Contact TikTok Developer Support if needed
