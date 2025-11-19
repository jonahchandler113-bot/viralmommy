# Cloudflare R2 Storage Setup Guide

This guide explains how to configure Cloudflare R2 storage for ViralMommy's video upload system.

## What Was Built

### 1. R2 Storage Service (`lib/storage/r2-storage.ts`)
A comprehensive service for interacting with Cloudflare R2 storage:
- **uploadVideoToR2()** - Upload videos with metadata
- **uploadThumbnailToR2()** - Upload optimized thumbnails
- **deleteVideoFromR2()** - Delete videos and thumbnails
- **getSignedUrl()** - Generate temporary access URLs (1 hour default)
- **getPublicUrl()** - Generate public URLs (requires custom domain)
- **checkObjectExists()** - Verify file existence
- **getVideoMetadata()** - Retrieve file metadata
- **batchDeleteFromR2()** - Delete multiple files efficiently

### 2. Updated Upload Handler (`lib/video/upload-handler.ts`)
Modified to use R2 instead of local file storage:
- Videos uploaded directly to R2 cloud storage
- Thumbnails generated locally, optimized, then uploaded to R2
- Temporary files cleaned up after processing
- Storage keys format: `videos/{userId}/{fileId}.{ext}`
- Thumbnail keys format: `thumbnails/{userId}/{fileId}.jpg`

### 3. Video Stream API (`app/api/videos/[id]/stream/route.ts`)
New endpoint to generate signed URLs for secure video playback:
- `GET /api/videos/{videoId}/stream`
- Returns temporary signed URLs for both video and thumbnail
- 1-hour expiration (configurable)
- Validates user ownership before granting access

### 4. Updated Upload API (`app/api/videos/upload/route.ts`)
Modified to store R2 URLs in database:
- Storage URLs stored in format: `r2://bucket-name/videos/{userId}/{fileId}.{ext}`
- Status automatically set to `PROCESSING` after upload
- Metadata includes upload timestamp and video dimensions

## Prerequisites

1. **Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com)
2. **R2 Storage Plan** - Free tier includes 10GB storage
3. **Node.js & npm** - Already installed (required by Next.js)

## Step-by-Step Setup

### Step 1: Create Cloudflare R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** in the left sidebar
3. Click **Create bucket**
4. Enter bucket name: `viralmommy-videos` (or your preferred name)
5. Choose location: **Automatic** (recommended)
6. Click **Create bucket**

### Step 2: Generate R2 API Token

1. In R2 section, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Configure token:
   - **Token name**: `viralmommy-app`
   - **Permissions**:
     - Object Read & Write
     - Bucket List
   - **TTL**: Never expires (or set custom expiration)
   - **Bucket**: Select your bucket or "Apply to all buckets"
4. Click **Create API token**
5. **IMPORTANT**: Copy the credentials immediately (shown only once):
   - Access Key ID
   - Secret Access Key
   - Endpoint URL (contains your Account ID)

### Step 3: Configure Environment Variables

1. Open your `.env` file (or create from `.env.example`)
2. Add the R2 credentials:

```bash
# Cloudflare R2 Storage
CLOUDFLARE_ACCOUNT_ID="your-account-id-from-endpoint-url"
CLOUDFLARE_R2_ACCESS_KEY_ID="your-access-key-id"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-secret-access-key"
CLOUDFLARE_R2_BUCKET_NAME="viralmommy-videos"

# Optional: Custom domain (configure in Step 5)
CLOUDFLARE_R2_PUBLIC_DOMAIN=""
```

**Finding your Account ID:**
- From the endpoint URL: `https://[ACCOUNT_ID].r2.cloudflarestorage.com`
- Or in Cloudflare Dashboard: Right sidebar under "Account ID"

### Step 4: Install Dependencies

Dependencies are already installed if you ran `npm install` after updating package.json:

```bash
npm install
```

Key packages added:
- `@aws-sdk/client-s3` - S3-compatible client for R2
- `@aws-sdk/s3-request-presigner` - Generate signed URLs

### Step 5: (Optional) Configure Custom Domain

To serve videos from your own domain (e.g., `videos.viralmommy.com`):

1. In Cloudflare Dashboard, go to **R2** > **Your Bucket**
2. Click **Settings** tab
3. Under **Public Access**, click **Connect Domain**
4. Choose:
   - **Custom Domain** - Use your own domain (recommended for production)
   - **R2.dev subdomain** - Free Cloudflare subdomain (not for production)
5. Add custom domain (must be on Cloudflare DNS):
   - Enter: `videos.yourdomain.com`
   - Click **Connect domain**
6. Update `.env`:
   ```bash
   CLOUDFLARE_R2_PUBLIC_DOMAIN="videos.yourdomain.com"
   ```

**Note:** Without custom domain, videos are served via signed URLs (secure but temporary).

### Step 6: Test the Upload System

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the upload page: `http://localhost:3000/upload`

3. Upload a test video:
   - Drag and drop or click to select
   - Supported formats: MP4, MOV, AVI, WebM
   - Max size: 500MB (configurable in `lib/video/video-validator.ts`)

4. Verify in Cloudflare Dashboard:
   - Go to **R2** > **Your Bucket**
   - You should see files in `videos/{userId}/` folder
   - Thumbnails in `thumbnails/{userId}/` folder

5. Test video playback:
   - Get signed URL: `GET /api/videos/{videoId}/stream`
   - Returns temporary URL valid for 1 hour

## Storage Structure

```
viralmommy-videos (bucket)
├── videos/
│   └── {userId}/
│       ├── {fileId1}.mp4
│       ├── {fileId2}.mov
│       └── ...
└── thumbnails/
    └── {userId}/
        ├── {fileId1}.jpg
        ├── {fileId2}.jpg
        └── ...
```

## Database Schema

The Video model stores R2 references:

```prisma
model Video {
  id           String   @id @default(uuid())
  userId       String
  storageKey   String   @unique  // videos/{userId}/{fileId}.ext
  storageUrl   String?           // r2://bucket/videos/{userId}/{fileId}.ext
  thumbnailUrl String?           // r2://bucket/thumbnails/{userId}/{fileId}.jpg
  // ... other fields
}
```

## API Endpoints

### Upload Video
```http
POST /api/videos/upload
Content-Type: multipart/form-data

Body:
  video: File
```

**Response:**
```json
{
  "success": true,
  "video": {
    "id": "video-uuid",
    "filename": "original-name.mp4",
    "storageKey": "videos/user-id/file-id.mp4",
    "thumbnailUrl": "r2://bucket/thumbnails/user-id/file-id.jpg",
    "duration": 120.5,
    "size": 15728640,
    "status": "PROCESSING"
  },
  "job": {
    "id": "job-id",
    "state": "active"
  }
}
```

### Get Video Stream URL
```http
GET /api/videos/{videoId}/stream
```

**Response:**
```json
{
  "success": true,
  "videoId": "video-uuid",
  "videoUrl": "https://signed-url.r2.cloudflarestorage.com/...",
  "thumbnailUrl": "https://signed-url.r2.cloudflarestorage.com/...",
  "expiresIn": 3600
}
```

## Cost Estimates

Cloudflare R2 Pricing (as of 2024):

| Feature | Free Tier | Overage Cost |
|---------|-----------|--------------|
| Storage | 10 GB/month | $0.015/GB |
| Class A Operations* | 1M/month | $4.50/million |
| Class B Operations** | 10M/month | $0.36/million |
| Egress | Unlimited | Free |

*Class A: Uploads, deletes, lists
**Class B: Downloads, head requests

**Example monthly cost** (after free tier):
- 100 GB storage: ~$1.35
- 100,000 uploads: ~$0.45
- Unlimited downloads: $0 (free egress!)

## Troubleshooting

### Error: "Missing required R2 environment variables"
**Solution:** Verify all 4 required variables are set in `.env`:
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_R2_ACCESS_KEY_ID
- CLOUDFLARE_R2_SECRET_ACCESS_KEY
- CLOUDFLARE_R2_BUCKET_NAME

### Error: "Access Denied" when uploading
**Solutions:**
1. Verify API token has **Object Read & Write** permissions
2. Check token applies to correct bucket
3. Regenerate API token if expired

### Error: "Bucket not found"
**Solutions:**
1. Verify bucket name in `.env` matches Cloudflare Dashboard
2. Bucket names are case-sensitive
3. Check bucket exists in correct Cloudflare account

### Videos upload but can't play
**Solutions:**
1. Use `/api/videos/{id}/stream` endpoint to get signed URL
2. Signed URLs expire after 1 hour - regenerate if needed
3. If using custom domain, verify DNS is configured correctly

### Thumbnails not generating
**Solutions:**
1. Check ffmpeg is installed: `ffmpeg -version`
2. Verify temp directory has write permissions
3. Check video has valid video stream (not corrupted)

## Security Considerations

1. **Never commit `.env` file** - Contains sensitive credentials
2. **API tokens** - Rotate periodically (every 90 days recommended)
3. **Signed URLs** - Expire automatically (1 hour default)
4. **User validation** - Stream endpoint checks video ownership
5. **CORS** - Configure if accessing from different domain

## Migration from Local Storage

If you have existing videos in local storage:

1. **Keep existing videos** - They'll continue to work
2. **New uploads** - Automatically go to R2
3. **Optional migration script** - Create to move old files to R2

## Performance Tips

1. **Use custom domain** - Faster than signed URLs
2. **CDN caching** - Configure Cloudflare cache rules
3. **Thumbnail optimization** - Already done (Sharp with 85% quality)
4. **Batch operations** - Use `batchDeleteFromR2()` for multiple deletions

## Next Steps

1. **Configure custom domain** (recommended for production)
2. **Set up CDN caching** for faster video delivery
3. **Monitor R2 usage** in Cloudflare Dashboard
4. **Configure lifecycle policies** (auto-delete old videos)
5. **Set up backup strategy** (R2 doesn't auto-backup)

## Support

- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **AWS S3 SDK Docs**: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/
- **ViralMommy Issues**: Report bugs via GitHub issues

## Additional Resources

- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/platform/pricing/)
- [S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
- [Custom Domain Setup](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [CORS Configuration](https://developers.cloudflare.com/r2/buckets/cors/)
