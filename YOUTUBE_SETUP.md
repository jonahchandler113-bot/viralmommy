# YouTube Integration Setup Guide

This guide will walk you through setting up YouTube OAuth integration for ViralMommy using Google Cloud Platform.

## Prerequisites

- Google Account
- Access to Google Cloud Console

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project details:
   - **Project name**: ViralMommy (or your preferred name)
   - **Organization**: Your organization (if applicable)
4. Click **Create**
5. Wait for the project to be created, then select it

## Step 2: Enable YouTube Data API v3

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click on **YouTube Data API v3**
4. Click **Enable**
5. Wait for the API to be enabled

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace)
3. Click **Create**
4. Fill in the app information:
   - **App name**: ViralMommy
   - **User support email**: Your email
   - **App logo**: (optional) Upload your logo
   - **Developer contact email**: Your email
5. Click **Save and Continue**

### Add Scopes:
1. Click **Add or Remove Scopes**
2. Add the following scopes:
   - `https://www.googleapis.com/auth/youtube.upload` - Upload videos
   - `https://www.googleapis.com/auth/youtube` - Manage YouTube account
   - `https://www.googleapis.com/auth/youtube.readonly` - View channel data
   - `https://www.googleapis.com/auth/userinfo.profile` - View profile info
3. Click **Update** → **Save and Continue**

### Test Users (for development):
1. Add your email and any test users' emails
2. Click **Save and Continue**
3. Review the summary and click **Back to Dashboard**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Configure the client:
   - **Name**: ViralMommy Web Client

   **Authorized JavaScript origins**:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)

   **Authorized redirect URIs**:
   - `http://localhost:3000/api/platforms/youtube/callback` (for development)
   - `https://yourdomain.com/api/platforms/youtube/callback` (for production)
   - `http://localhost:3000/api/auth/callback/google` (if using Google Sign-In)
   - `https://yourdomain.com/api/auth/callback/google` (for production Google Sign-In)

5. Click **Create**
6. Copy your **Client ID** and **Client Secret** (you'll need these)

## Step 5: Update Environment Variables

Your `.env` file should already have these from the Google OAuth setup:

```env
# Google OAuth (used for YouTube)
GOOGLE_CLIENT_ID="your-client-id-here"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

If they're not there, add them with your actual credentials.

## Step 6: Publish Your App (Important!)

For production use, you need to publish your OAuth consent screen:

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Review the warning and click **Confirm**

**Note**: While in testing mode, only test users can connect. Publishing makes it available to all users.

## Step 7: Request Verification (Optional - for production)

If you plan to have many users, you should verify your app:

1. Go to **OAuth consent screen**
2. Click **Prepare for Verification**
3. Follow the steps to submit for verification
4. Google will review your app (can take several weeks)

## Step 8: Test the Integration

1. Start your development server: `npm run dev`
2. Log into your app
3. Go to **Settings** → **Platforms** tab
4. Click **Connect** on the YouTube card
5. You'll be redirected to Google to authorize the app
6. Select your Google account
7. Review and grant the requested permissions
8. After authorization, you'll be redirected back to Settings

## YouTube Publishing Features

### Standard Videos
- Upload regular YouTube videos
- Any duration (up to YouTube's limits)
- Any aspect ratio (16:9 recommended for desktop)
- Automatic public publishing

### YouTube Shorts
- Videos under 60 seconds
- Vertical format (9:16 aspect ratio)
- Automatically tagged with #Shorts
- Appears in Shorts feed

#### To publish as a Short:
Set `isShort: true` in your publish request:
```typescript
await fetch('/api/platforms/youtube/publish', {
  method: 'POST',
  body: JSON.stringify({
    videoId: 'your-video-id',
    title: 'My YouTube Short',
    description: 'Check out this Short!',
    isShort: true // This makes it a Short
  })
})
```

### Video Specifications
- **Max file size**: 256GB (or 12 hours duration)
- **Supported formats**: MP4, MOV, AVI, WMV, FLV, 3GP, WebM, MPEG
- **Recommended resolution**:
  - Standard: 1920x1080 (1080p)
  - Shorts: 1080x1920 (vertical)
- **Privacy**: Videos are published as public (can be changed in code)

## API Features

### Implemented Methods:
- `publishVideo()` - Upload videos with Shorts support
- `getVideoStats()` - Get views, likes, comments for a video
- `listVideos()` - List channel's uploaded videos
- `refreshToken()` - Refresh expired access tokens

### API Endpoints Used:
- **OAuth**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Token Exchange**: `https://oauth2.googleapis.com/token`
- **Video Upload**: `https://www.googleapis.com/upload/youtube/v3/videos`
- **Video Stats**: `https://www.googleapis.com/youtube/v3/videos`
- **List Videos**: `https://www.googleapis.com/youtube/v3/search`

## Token Management

- **Access Token**: Valid for 1 hour (3600 seconds)
- **Refresh Token**: Long-lived, used to get new access tokens
- `access_type: 'offline'` ensures you get a refresh token
- `prompt: 'consent'` forces consent screen to guarantee refresh token
- Tokens are automatically refreshed when expired during publish

## Quota Management

YouTube Data API has daily quota limits:

- **Default quota**: 10,000 units per day
- **Video upload cost**: 1,600 units
- **This means**: ~6 video uploads per day with default quota

### Request Quota Increase:
1. Go to **APIs & Services** → **Quotas**
2. Select **YouTube Data API v3**
3. Click on **Queries per day**
4. Click **Edit Quotas**
5. Fill out the form explaining your use case
6. Submit for review

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Ensure you've added the correct redirect URI in Google Cloud Console
- The URI must match EXACTLY (including http vs https)
- Make sure the YouTube Data API v3 is enabled

### "invalid_client: Unauthorized"
- Verify your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Ensure there are no extra spaces or quotes
- Check that you're using the Web application credentials, not another type

### "The app is not published"
- If you see this during OAuth, you need to publish your app
- Go to OAuth consent screen and click "Publish App"
- Or add test users in the testing phase

### "Insufficient permissions"
- Ensure all required scopes are added in OAuth consent screen
- The user may need to re-authorize if scopes were added later
- Disconnect and reconnect YouTube from Settings

### "Video upload failed"
- Check that your video file is accessible via URL
- Verify the video meets YouTube's requirements
- Check server logs for detailed error messages
- Ensure you haven't exceeded your daily quota

### "Token has been expired or revoked"
- The integration automatically refreshes tokens
- If issues persist, try reconnecting your YouTube account from Settings
- Check that your refresh token is being stored correctly

### "Quota exceeded"
- You've hit YouTube's daily quota limit (10,000 units)
- Wait until quota resets (midnight Pacific Time)
- Request a quota increase from Google Cloud Console

## Important Notes

1. **YouTube Channel Required**: Users must have a YouTube channel to upload videos
2. **Verification**: For production with many users, app verification is recommended
3. **Quota Limits**: Be mindful of YouTube's quota limits (1,600 units per upload)
4. **Rate Limits**: Don't make too many API calls in short succession
5. **Privacy Status**: Videos are published as "public" by default (configurable in code)
6. **Shorts Detection**: For Shorts, ensure videos are:
   - Under 60 seconds
   - Vertical (9:16 aspect ratio)
   - Have #Shorts in description (auto-added by integration)

## Production Checklist

- [ ] Google Cloud project created
- [ ] YouTube Data API v3 enabled
- [ ] OAuth consent screen configured with all scopes
- [ ] OAuth 2.0 credentials created (Web application)
- [ ] Redirect URIs configured for production domain
- [ ] Client ID and secret added to production `.env`
- [ ] App published (OAuth consent screen)
- [ ] Test video upload works
- [ ] Test Shorts upload works
- [ ] Test token refresh functionality
- [ ] Monitor quota usage
- [ ] (Optional) App verified by Google

## Monitoring Quota Usage

1. Go to **APIs & Services** → **Dashboard**
2. Click on **YouTube Data API v3**
3. View **Metrics** to see your quota usage
4. Set up alerts for high usage

## Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [YouTube API Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
- [YouTube API Support](https://developers.google.com/youtube/v3/support)

## Support

If you encounter issues:
1. Check the YouTube API documentation
2. Review server logs for detailed error messages
3. Verify your OAuth setup in Google Cloud Console
4. Check quota usage in API dashboard
5. Contact Google Cloud Support if needed

## Tips for Success

1. **Test with your own account first** before allowing users to connect
2. **Monitor quota usage** regularly to avoid disruptions
3. **Enable error logging** to catch issues early
4. **Request quota increase** early if you expect high upload volume
5. **Keep refresh tokens secure** - they provide long-term access
6. **Handle errors gracefully** - show user-friendly messages when uploads fail
