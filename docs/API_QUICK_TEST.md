# Video Upload API - Quick Test Guide

## Prerequisites

1. Start the development server:
```bash
npm run dev
```

2. Ensure PostgreSQL database is running and migrated:
```bash
npx prisma migrate dev
npx prisma generate
```

## Quick Test Commands

### 1. Upload a Video

```bash
curl -X POST http://localhost:3000/api/videos/upload \
  -F "video=@path/to/your/video.mp4"
```

Expected Response:
```json
{
  "success": true,
  "video": {
    "id": "...",
    "filename": "video.mp4",
    "storageKey": "dev-user-id/...",
    "status": "UPLOADING"
  },
  "message": "Video uploaded and queued for processing"
}
```

### 2. List All Videos

```bash
curl http://localhost:3000/api/videos
```

With pagination and filtering:
```bash
curl "http://localhost:3000/api/videos?page=1&limit=10&status=READY&sortBy=createdAt&sortOrder=desc"
```

### 3. Get Video by ID

```bash
# Replace {VIDEO_ID} with actual ID from upload response
curl http://localhost:3000/api/videos/{VIDEO_ID}
```

### 4. Update Video Status

```bash
curl -X PATCH http://localhost:3000/api/videos/{VIDEO_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "READY"}'
```

### 5. Delete Video

```bash
curl -X DELETE http://localhost:3000/api/videos/{VIDEO_ID}
```

## Using Postman

1. Create a new collection called "ViralMommy API"
2. Set base URL variable: `http://localhost:3000`
3. Import these endpoints:

**Upload Video**
- Method: POST
- URL: `{{baseUrl}}/api/videos/upload`
- Body: form-data
  - Key: `video` (File type)
  - Value: Select your video file

**List Videos**
- Method: GET
- URL: `{{baseUrl}}/api/videos?page=1&limit=10`

**Get Video**
- Method: GET
- URL: `{{baseUrl}}/api/videos/{{videoId}}`

**Update Video**
- Method: PATCH
- URL: `{{baseUrl}}/api/videos/{{videoId}}`
- Body: raw (JSON)
```json
{
  "status": "READY",
  "transcription": "Test transcription"
}
```

**Delete Video**
- Method: DELETE
- URL: `{{baseUrl}}/api/videos/{{videoId}}`

## JavaScript/Fetch Example

```javascript
// Upload Video
async function uploadVideo(file) {
  const formData = new FormData();
  formData.append('video', file);

  const response = await fetch('/api/videos/upload', {
    method: 'POST',
    body: formData,
  });

  return await response.json();
}

// List Videos
async function listVideos(page = 1, limit = 10) {
  const response = await fetch(
    `/api/videos?page=${page}&limit=${limit}`
  );
  return await response.json();
}

// Get Video
async function getVideo(videoId) {
  const response = await fetch(`/api/videos/${videoId}`);
  return await response.json();
}

// Update Video
async function updateVideo(videoId, updates) {
  const response = await fetch(`/api/videos/${videoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return await response.json();
}

// Delete Video
async function deleteVideo(videoId) {
  const response = await fetch(`/api/videos/${videoId}`, {
    method: 'DELETE',
  });
  return await response.json();
}
```

## React/Next.js Component Example

```tsx
'use client';

import { useState } from 'react';

export default function VideoUpload() {
  const [uploading, setUploading] = useState(false);
  const [video, setVideo] = useState<any>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setVideo(data.video);
        console.log('Upload successful:', data);
      } else {
        console.error('Upload failed:', data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="video/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {video && (
        <div>
          <h3>Upload Complete!</h3>
          <p>Video ID: {video.id}</p>
          <p>Status: {video.status}</p>
          {video.thumbnailUrl && (
            <img src={video.thumbnailUrl} alt="Thumbnail" />
          )}
        </div>
      )}
    </div>
  );
}
```

## Expected File Sizes for Testing

Free Tier (max 100MB, 3 minutes):
- Small: 5-10MB (30-60 seconds)
- Medium: 30-50MB (1-2 minutes)
- Large: 80-100MB (2-3 minutes)

Pro Tier (max 500MB, 10 minutes):
- Small: 50-100MB (2-3 minutes)
- Medium: 200-300MB (5-7 minutes)
- Large: 400-500MB (8-10 minutes)

## Troubleshooting

### "No video file provided"
- Ensure you're using `multipart/form-data`
- Field name must be exactly `video`

### "Unauthorized"
- In development, this shouldn't happen (mock session is used)
- In production, ensure you have a valid session

### "File too large"
- Check your subscription tier limits
- Free: 100MB, Pro: 500MB

### "Invalid file format"
- Supported: MP4, MOV, AVI, MKV, WebM
- Check the file MIME type

### Database errors
- Ensure PostgreSQL is running
- Run `npx prisma migrate dev`
- Check DATABASE_URL in .env

### File system errors
- Ensure `/uploads` directory is writable
- Check disk space

## Check Upload Directory

```bash
# Windows
dir /s C:\Users\jonah\OneDrive\Desktop\viralmommy\uploads

# Linux/Mac
ls -lah ./uploads/
```

Files should be organized as:
```
uploads/
  dev-user-id/
    ├── abc123.mp4
    ├── def456.mp4
    └── thumbnails/
        ├── abc123.jpg
        └── def456.jpg
```

## Database Verification

```bash
# Open Prisma Studio to view database records
npx prisma studio
```

Navigate to the `Video` model to see uploaded videos.

## Monitor Queue Jobs

Check queue processing status:
```bash
# In a separate terminal, run the queue worker
npm run worker

# Or check queue stats via API (if implemented)
curl http://localhost:3000/api/queue/stats
```

## Sample Test Videos

For testing, you can use:
- Your own video files
- Download free test videos from:
  - https://sample-videos.com/
  - https://test-videos.co.uk/
  - Record a short video on your phone

Recommended test video:
- Format: MP4
- Duration: 10-30 seconds
- Size: 5-20MB
- Resolution: 720p or 1080p

## Success Criteria

A successful implementation should:
- [x] Accept valid video files
- [x] Reject invalid files with clear errors
- [x] Generate thumbnails automatically
- [x] Extract video metadata (duration, dimensions, etc.)
- [x] Save records to database
- [x] Return proper video ID
- [x] Support pagination in list endpoint
- [x] Allow filtering and search
- [x] Properly delete files and records
- [x] Enforce user ownership

## Next Steps After Testing

1. Integrate with frontend upload UI
2. Implement queue worker for background processing
3. Add AI analysis integration
4. Set up cloud storage (R2/S3)
5. Configure production authentication
6. Add rate limiting
7. Set up monitoring and alerts
