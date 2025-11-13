# Platform Video Specifications

## Overview

This document outlines the technical video specifications for TikTok, Instagram Reels, and YouTube Shorts. Use this as a reference when implementing video processing and optimization in ViralMommy.

---

## Quick Reference Table

| Platform | Aspect Ratio | Max Duration | Max File Size | Recommended Resolution | Formats | Frame Rate |
|----------|-------------|--------------|---------------|----------------------|---------|-----------|
| **TikTok** | 9:16 (vertical) | 10 minutes | 287.6 MB | 1080x1920 | MP4, MOV | 23-60fps |
| **Instagram Reels** | 9:16 (vertical) | 90 seconds | 1 GB | 1080x1920 | MP4, MOV | 23-60fps |
| **YouTube Shorts** | 9:16 or 1:1 | 60 seconds | 256 GB | 1080x1920 | MP4, MOV, AVI, FLV, 3GPP, WebM | 24-60fps |

---

## TikTok Specifications

### Video Format

- **Accepted Formats**: MP4, MOV, MPEG, 3GP, AVI
- **Recommended Format**: MP4 (H.264 codec)
- **Audio Codec**: AAC

### Dimensions

- **Aspect Ratio**: 9:16 (vertical)
- **Recommended Resolution**: 1080x1920 (Full HD vertical)
- **Minimum Resolution**: 540x960
- **Maximum Resolution**: 1080x1920

### Duration

- **Minimum**: 3 seconds
- **Maximum**: 10 minutes
- **Optimal**: 21-34 seconds (best engagement)

### File Size

- **Maximum**: 287.6 MB (via API)
- **Recommended**: < 100 MB for faster processing

### Frame Rate

- **Recommended**: 30fps
- **Accepted**: 23-60fps

### Bitrate

- **Video Bitrate**: 4,000-8,000 Kbps
- **Audio Bitrate**: 128-192 Kbps

### Special Considerations

- **Orientation**: Vertical (portrait) performs best
- **Thumbnail**: Auto-generated at 1000ms by default (customizable via API)
- **Captions**: Max 2,200 characters (including hashtags)
- **Hashtags**: Recommended 3-5 relevant hashtags
- **Privacy**: API uploads default to `SELF_ONLY` for unaudited apps

---

## Instagram Reels Specifications

### Video Format

- **Accepted Formats**: MP4, MOV
- **Recommended Format**: MP4 (H.264 codec)
- **Audio Codec**: AAC

### Dimensions

- **Aspect Ratio**: 9:16 (vertical) **required**
- **Recommended Resolution**: 1080x1920 (Full HD vertical)
- **Minimum Resolution**: 540x960

### Duration

- **Minimum**: 3 seconds
- **Maximum**: 90 seconds (as of 2025)
- **Optimal**: 15-30 seconds (best engagement)

### File Size

- **Maximum**: 1 GB
- **Recommended**: < 100 MB for faster processing

### Frame Rate

- **Recommended**: 30fps
- **Accepted**: 23-60fps

### Bitrate

- **Video Bitrate**: 5,000-10,000 Kbps
- **Audio Bitrate**: 128-192 Kbps

### Special Considerations

- **Account Type**: Requires Instagram Business or Creator account
- **Video URL**: Must be direct, public URL (no redirects, no authentication)
- **Processing Time**: 30 seconds to 5 minutes (poll status before publishing)
- **Cover Image**: Auto-generated or specify `thumb_offset` in milliseconds
- **Captions**: Max 2,200 characters
- **Hashtags**: Recommended 3-5 relevant hashtags
- **Share to Feed**: Set `share_to_feed: true` to show in main feed

---

## YouTube Shorts Specifications

### Video Format

- **Accepted Formats**: MP4, MOV, AVI, FLV, 3GPP, WebM, MPEG-PS
- **Recommended Format**: MP4 (H.264 codec)
- **Audio Codec**: AAC, MP3

### Dimensions

- **Aspect Ratio**: 9:16 (vertical) or 1:1 (square)
- **Recommended Resolution**: 1080x1920 (Full HD vertical)
- **Minimum Resolution**: 720x1280
- **Maximum Resolution**: 8K (but 1080x1920 recommended)

### Duration

- **Maximum**: 60 seconds (anything longer isn't a Short)
- **Optimal**: 15-45 seconds (best engagement)

### File Size

- **Maximum**: 256 GB (practically unlimited)
- **Recommended**: < 100 MB for faster upload

### Frame Rate

- **Recommended**: 24-30fps
- **Accepted**: Up to 60fps

### Bitrate

- **Video Bitrate**: 5,000-15,000 Kbps (for 1080p)
- **Audio Bitrate**: 128-192 Kbps

### Special Considerations

- **Shorts Detection**: Automatic based on duration (≤60s) and aspect ratio
- **Title**: Include `#Shorts` hashtag (recommended, not required)
- **Description**: Include `#Shorts` hashtag for better discovery
- **Thumbnail**: Custom thumbnails supported
- **Orientation**: Vertical (9:16) performs best, but square (1:1) also supported
- **Quota**: Each upload costs 1,600 API quota units

---

## Optimal Export Settings for ViralMommy

To support all three platforms simultaneously, use these **universal settings**:

### Recommended Export Format

```
Format: MP4
Video Codec: H.264 (x264)
Audio Codec: AAC
Container: MP4 (.mp4)
```

### Dimensions

```
Aspect Ratio: 9:16 (vertical)
Resolution: 1080x1920 (Full HD)
```

### Video Settings

```
Frame Rate: 30fps
Bitrate Mode: Variable Bitrate (VBR)
Target Bitrate: 6,000 Kbps
Max Bitrate: 8,000 Kbps
Encoding: 2-pass (for better quality)
```

### Audio Settings

```
Sample Rate: 48 kHz
Bitrate: 128 Kbps
Channels: Stereo (2 channels)
```

### File Size Target

```
Target: < 50 MB (ideal for fast uploads)
Maximum: 100 MB (before compression)
```

### Duration

```
Target: 15-60 seconds
Maximum: 60 seconds (for cross-platform compatibility)
```

---

## Video Compression Strategy

### When to Compress

- Video file size > 100 MB
- Video bitrate > 8,000 Kbps
- Video resolution > 1080x1920

### Compression Tools

#### FFmpeg Command (Recommended)

```bash
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1" \
  -r 30 \
  -c:a aac \
  -b:a 128k \
  -ar 48000 \
  -movflags +faststart \
  output.mp4
```

**Explanation:**
- `-c:v libx264`: Use H.264 codec
- `-preset medium`: Balance between speed and compression
- `-crf 23`: Constant rate factor (18-28, lower = better quality)
- `-vf scale`: Scale to 1080x1920 with padding if needed
- `-r 30`: 30fps
- `-c:a aac`: AAC audio codec
- `-b:a 128k`: 128 Kbps audio bitrate
- `-movflags +faststart`: Enable streaming

#### Node.js Implementation (Week 3)

```typescript
// /lib/video/compress.ts
import ffmpeg from 'fluent-ffmpeg';

export async function compressVideo(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size('1080x1920')
      .fps(30)
      .videoBitrate('6000k')
      .audioBitrate('128k')
      .outputOptions(['-preset medium', '-crf 23', '-movflags +faststart'])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}
```

---

## Aspect Ratio Handling

### Converting Horizontal to Vertical

If user uploads horizontal video (16:9), you have three options:

#### Option 1: Add Blurred Background

```bash
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]scale=1080:-1,boxblur=20[bg];[bg][0:v]overlay=(W-w)/2:(H-h)/2" \
  -aspect 9:16 \
  output.mp4
```

#### Option 2: Crop Center

```bash
ffmpeg -i input.mp4 \
  -vf "crop=ih*9/16:ih" \
  output.mp4
```

#### Option 3: Add Padding (Black Bars)

```bash
ffmpeg -i input.mp4 \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" \
  output.mp4
```

**Recommendation**: Use Option 1 (blurred background) for best aesthetic.

---

## Caption and Metadata Best Practices

### Caption Structure

```
[Hook/Question] + [Description] + [Call-to-Action] + [Hashtags]

Example:
"Ever struggle with picky eaters? 🥦 Try this simple trick that works every time! Let me know if it works for you! #ParentingHacks #MomLife #KidsEating #HealthyKids"
```

### Hashtag Strategy

- **Total Hashtags**: 3-5 (don't overdo it)
- **Mix**: 2 broad + 2 niche + 1 trending
- **Placement**: End of caption (or within for context)

**Examples for Mom Content:**
- Broad: `#MomLife`, `#ParentingTips`, `#MomHack`
- Niche: `#ToddlerMom`, `#NewbornCare`, `#WorkingMom`
- Trending: Check platform trends daily

### Platform-Specific Tags

- **TikTok**: Max 100 characters for hashtags
- **Instagram**: Max 30 hashtags (but use 3-5 for authenticity)
- **YouTube Shorts**: Include `#Shorts` in title or description

---

## Quality Checklist

Before uploading to any platform, verify:

- [ ] Aspect ratio is 9:16 (1080x1920)
- [ ] Duration is ≤ 60 seconds (for cross-platform)
- [ ] File size is < 100 MB
- [ ] Format is MP4 (H.264 + AAC)
- [ ] Frame rate is 30fps
- [ ] Video is sharp and well-lit
- [ ] Audio is clear (no distortion)
- [ ] Captions are under 2,200 characters
- [ ] Hashtags are relevant (3-5 tags)
- [ ] Video meets platform-specific requirements

---

## Platform-Specific Upload Requirements

### TikTok

- **Video must be accessible via direct URL** (for PULL_FROM_URL method)
- **Domain must be verified** (for PULL_FROM_URL method)
- **File upload preferred** (FILE_UPLOAD method)

### Instagram

- **Video URL must be direct, public, and permanent** (no redirects)
- **Signed URLs from CDN recommended** (expires in 1 hour)
- **Video must be processed before publishing** (poll status)

### YouTube

- **Use resumable upload protocol** for files > 5 MB
- **Chunked upload recommended** for reliability
- **Include `selfDeclaredMadeForKids` flag** per COPPA

---

## Testing Videos

For testing during development, use these sample videos:

### Sample Video 1: Short (15s)

```
Resolution: 1080x1920
Duration: 15 seconds
Size: ~5 MB
Use Case: Quick testing
```

### Sample Video 2: Medium (30s)

```
Resolution: 1080x1920
Duration: 30 seconds
Size: ~15 MB
Use Case: Standard content
```

### Sample Video 3: Long (60s)

```
Resolution: 1080x1920
Duration: 60 seconds
Size: ~30 MB
Use Case: Maximum Shorts length
```

### Generate Test Video with FFmpeg

```bash
# Generate a 30-second test video (color bars with timer)
ffmpeg -f lavfi -i testsrc=duration=30:size=1080x1920:rate=30 \
  -f lavfi -i sine=frequency=1000:duration=30 \
  -pix_fmt yuv420p test_video.mp4
```

---

## Resources

### FFmpeg

- [FFmpeg Official Docs](https://ffmpeg.org/documentation.html)
- [FFmpeg Filters](https://ffmpeg.org/ffmpeg-filters.html)
- Install: `npm install fluent-ffmpeg`

### Video Processing Libraries (Node.js)

- **fluent-ffmpeg**: High-level FFmpeg wrapper
- **@ffmpeg-installer/ffmpeg**: FFmpeg binaries for Node.js
- **sharp**: Image processing (for thumbnails)

### Cloud Video Processing

- **Cloudflare Stream**: Video hosting + processing
- **Mux**: Video API platform
- **AWS MediaConvert**: Serverless video transcoding

---

## Implementation Checklist (Week 3)

- [ ] Install FFmpeg on server
- [ ] Install `fluent-ffmpeg` npm package
- [ ] Create video compression service
- [ ] Create aspect ratio converter
- [ ] Implement file size validator
- [ ] Create video metadata extractor (duration, resolution, etc.)
- [ ] Build thumbnail generator
- [ ] Test uploads to all three platforms
- [ ] Optimize compression settings for quality vs. speed
- [ ] Monitor CDN bandwidth usage

---

## Summary

**ViralMommy Optimal Video Profile:**

```
Format:         MP4 (H.264 + AAC)
Resolution:     1080x1920 (9:16)
Frame Rate:     30fps
Duration:       15-60 seconds
File Size:      < 100 MB
Video Bitrate:  6,000 Kbps
Audio Bitrate:  128 Kbps
```

This profile ensures compatibility with TikTok, Instagram Reels, and YouTube Shorts while maintaining high quality and fast upload speeds.
