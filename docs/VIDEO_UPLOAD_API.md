# Video Upload API Documentation

## Overview

The Video Upload API provides endpoints for uploading, managing, and retrieving videos in the ViralMommy platform. All endpoints require authentication via NextAuth session.

## Base URL

```
/api/videos
```

## Authentication

All endpoints require an authenticated session. Include session cookies with each request. In development mode, a mock session is used automatically.

## Endpoints

### 1. Upload Video

Upload a new video file with automatic validation, thumbnail generation, and metadata extraction.

**Endpoint:** `POST /api/videos/upload`

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| video | File | Yes | Video file (MP4, MOV, AVI, MKV, WebM) |

**File Constraints:**

Free Tier:
- Max size: 100MB
- Max duration: 180 seconds (3 minutes)
- Min duration: 5 seconds
- Max resolution: 1920x1080

Pro/Enterprise Tier:
- Max size: 500MB
- Max duration: 600 seconds (10 minutes)
- Min duration: 1 second
- Max resolution: 3840x2160 (4K)

**Response:** `200 OK`

```json
{
  "success": true,
  "video": {
    "id": "cm3abc123xyz",
    "filename": "my-video.mp4",
    "storageKey": "user-id/abc123.mp4",
    "thumbnailUrl": "/uploads/user-id/thumbnails/abc123.jpg",
    "duration": 45.5,
    "size": 12458752,
    "status": "READY",
    "createdAt": "2025-11-12T10:30:00.000Z"
  },
  "message": "Video uploaded successfully"
}
```

**Error Responses:**

- `401 Unauthorized` - No valid session
- `400 Bad Request` - Invalid file format, size exceeded, or validation failed
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error during upload

**Example (cURL):**

```bash
curl -X POST http://localhost:3000/api/videos/upload \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -F "video=@path/to/video.mp4"
```

**Example (JavaScript/Fetch):**

```javascript
const formData = new FormData();
formData.append('video', videoFile);

const response = await fetch('/api/videos/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include', // Include session cookies
});

const data = await response.json();
```

---

### 2. List Videos

Get a paginated list of user's videos with optional filtering and sorting.

**Endpoint:** `GET /api/videos`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (1-indexed) |
| limit | number | 10 | Items per page (max 100) |
| status | string | - | Filter by status (UPLOADING, PROCESSING, READY, FAILED, PUBLISHED) |
| search | string | - | Search in filename and original name |
| sortBy | string | createdAt | Field to sort by (createdAt, updatedAt, duration, size) |
| sortOrder | string | desc | Sort order (asc, desc) |

**Response:** `200 OK`

```json
{
  "success": true,
  "videos": [
    {
      "id": "cm3abc123xyz",
      "originalName": "my-video.mp4",
      "filename": "abc123.mp4",
      "storageKey": "user-id/abc123.mp4",
      "storageUrl": "/uploads/user-id/abc123.mp4",
      "thumbnailUrl": "/uploads/user-id/thumbnails/abc123.jpg",
      "duration": 45.5,
      "size": 12458752,
      "mimeType": "video/mp4",
      "status": "READY",
      "errorMessage": null,
      "createdAt": "2025-11-12T10:30:00.000Z",
      "updatedAt": "2025-11-12T10:30:15.000Z",
      "aiAnalysis": null,
      "metadata": {
        "width": 1920,
        "height": 1080,
        "fps": 30,
        "codec": "h264",
        "bitrate": 5000,
        "hasAudio": true
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasMore": true
  }
}
```

**Example:**

```bash
curl "http://localhost:3000/api/videos?page=1&limit=20&status=READY&sortBy=createdAt&sortOrder=desc" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

### 3. Get Video by ID

Fetch detailed information about a specific video, including AI strategies and published posts.

**Endpoint:** `GET /api/videos/[id]`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Video ID (UUID) |

**Response:** `200 OK`

```json
{
  "success": true,
  "video": {
    "id": "cm3abc123xyz",
    "userId": "user-id",
    "originalName": "my-video.mp4",
    "filename": "abc123.mp4",
    "storageKey": "user-id/abc123.mp4",
    "storageUrl": "/uploads/user-id/abc123.mp4",
    "thumbnailUrl": "/uploads/user-id/thumbnails/abc123.jpg",
    "duration": 45.5,
    "size": 12458752,
    "mimeType": "video/mp4",
    "status": "READY",
    "errorMessage": null,
    "aiAnalysis": { /* AI analysis data */ },
    "transcription": "Video transcription text...",
    "metadata": { /* Video metadata */ },
    "createdAt": "2025-11-12T10:30:00.000Z",
    "updatedAt": "2025-11-12T10:30:15.000Z",
    "aiStrategies": [
      {
        "id": "strategy-id",
        "hooks": [...],
        "captions": [...],
        "hashtags": [...],
        "viralScore": 8.5
      }
    ],
    "publishedPosts": [
      {
        "id": "post-id",
        "platform": "TIKTOK",
        "status": "PUBLISHED",
        "views": 10000,
        "likes": 500
      }
    ]
  }
}
```

**Error Responses:**

- `401 Unauthorized` - No valid session
- `403 Forbidden` - Video belongs to another user
- `404 Not Found` - Video not found

**Example:**

```bash
curl "http://localhost:3000/api/videos/cm3abc123xyz" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

### 4. Update Video

Update video status, AI analysis, transcription, or metadata.

**Endpoint:** `PATCH /api/videos/[id]`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Video ID (UUID) |

**Request Body:**

```json
{
  "status": "PROCESSING",
  "aiAnalysis": { /* AI analysis data */ },
  "transcription": "Updated transcription...",
  "metadata": { /* Updated metadata */ },
  "errorMessage": "Processing failed: ..."
}
```

All fields are optional. Only include fields you want to update.

**Allowed Status Values:**
- `UPLOADING`
- `PROCESSING`
- `READY`
- `FAILED`
- `PUBLISHED`

**Response:** `200 OK`

```json
{
  "success": true,
  "video": { /* Updated video object */ },
  "message": "Video updated successfully"
}
```

**Error Responses:**

- `401 Unauthorized` - No valid session
- `403 Forbidden` - Video belongs to another user
- `404 Not Found` - Video not found
- `400 Bad Request` - No valid fields to update

**Example:**

```bash
curl -X PATCH "http://localhost:3000/api/videos/cm3abc123xyz" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "READY", "transcription": "New transcription text"}'
```

---

### 5. Delete Video

Delete a video and all associated files (video file, thumbnail).

**Endpoint:** `DELETE /api/videos/[id]`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Video ID (UUID) |

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

**Error Responses:**

- `401 Unauthorized` - No valid session
- `403 Forbidden` - Video belongs to another user
- `404 Not Found` - Video not found

**Note:** Deleting a video will cascade delete all related records (AI strategies, published posts) due to Prisma schema configuration.

**Example:**

```bash
curl -X DELETE "http://localhost:3000/api/videos/cm3abc123xyz" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## Video Status Lifecycle

```
UPLOADING → PROCESSING → READY
                ↓
             FAILED
```

- **UPLOADING**: File is being uploaded and validated
- **PROCESSING**: Video is being analyzed (transcription, AI analysis)
- **READY**: Video is ready for publishing
- **FAILED**: Processing failed (see errorMessage)
- **PUBLISHED**: Video has been published to at least one platform

---

## File Storage

Videos are stored locally in development:

```
/uploads/
  └── {userId}/
      ├── {videoId}.mp4          # Video file
      └── thumbnails/
          └── {videoId}.jpg      # Thumbnail
```

In production, files should be moved to cloud storage (e.g., Cloudflare R2, AWS S3).

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Human-readable error message",
  "details": "Technical error details (in development)"
}
```

Common HTTP status codes:
- `200 OK` - Success
- `400 Bad Request` - Validation error or invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Rate limiting is not currently implemented but should be added in production based on subscription tier:

- **Free**: 10 uploads/day, 100 API calls/hour
- **Pro**: 50 uploads/day, 500 API calls/hour
- **Enterprise**: Unlimited

---

## Testing

### Development Environment

In development mode, a mock authentication session is automatically provided with:
- User ID: `dev-user-id`
- Email: `dev@viralmommy.com`

### Test with cURL

```bash
# Upload a video
curl -X POST http://localhost:3000/api/videos/upload \
  -F "video=@test-video.mp4"

# List videos
curl "http://localhost:3000/api/videos?limit=5"

# Get specific video
curl "http://localhost:3000/api/videos/{video-id}"

# Update video status
curl -X PATCH "http://localhost:3000/api/videos/{video-id}" \
  -H "Content-Type: application/json" \
  -d '{"status": "PROCESSING"}'

# Delete video
curl -X DELETE "http://localhost:3000/api/videos/{video-id}"
```

### Test with Postman

1. Import the endpoint collection
2. Set base URL to `http://localhost:3000`
3. In development, authentication is automatic
4. For production, include session cookies

---

## Next Steps

1. **Configure NextAuth**: Set up proper authentication with providers
2. **Add Cloud Storage**: Migrate from local storage to Cloudflare R2 or AWS S3
3. **Implement Rate Limiting**: Add rate limiting middleware
4. **Add Webhooks**: Notify clients when video processing completes
5. **Add Analytics**: Track upload success rates and processing times
6. **Optimize Thumbnails**: Implement multiple thumbnail sizes for different devices

---

## Support

For issues or questions, please contact the development team or create an issue in the project repository.
