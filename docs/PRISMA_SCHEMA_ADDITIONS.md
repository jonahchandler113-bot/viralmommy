# Prisma Schema Additions for Platform Integration

## Overview

This document contains the Prisma schema additions needed for the ViralMommy platform integration system. Add these models to your `schema.prisma` file.

---

## Complete Schema Additions

```prisma
// Platform OAuth Connections
model PlatformConnection {
  id              String           @id @default(cuid())
  userId          String
  platform        Platform
  accessToken     String           @db.Text // Encrypted
  refreshToken    String?          @db.Text // Encrypted
  expiresAt       DateTime?
  platformUserId  String
  platformUsername String
  status          ConnectionStatus
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, platform])
  @@index([userId])
  @@index([status])
}

// Published Posts
model PublishedPost {
  id              String   @id @default(cuid())
  userId          String
  videoId         String
  platform        Platform
  platformPostId  String   // TikTok video ID, Instagram media ID, YouTube video ID
  caption         String   @db.Text
  hashtags        String[]
  publishedAt     DateTime @default(now())

  // Engagement metrics (updated periodically)
  views           Int      @default(0)
  likes           Int      @default(0)
  comments        Int      @default(0)
  shares          Int      @default(0)
  lastSyncedAt    DateTime?

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  video           Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([platform, platformPostId])
  @@index([userId])
  @@index([videoId])
  @@index([platform])
  @@index([publishedAt])
}

// Videos
model Video {
  id              String   @id @default(cuid())
  userId          String

  // Storage
  r2Key           String   @unique // Cloudflare R2 object key
  r2Url           String   @db.Text // Public or signed URL

  // Metadata
  title           String
  duration        Int      // seconds
  fileSize        Int      // bytes
  format          String   // mp4, mov
  resolution      String   // 1080x1920
  aspectRatio     String   // 9:16

  // Processing status
  status          VideoStatus @default(PROCESSING)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  publishedPosts  PublishedPost[]

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

// YouTube Quota Tracking
model YouTubeQuota {
  id              String   @id @default(cuid())
  date            String   @unique // YYYY-MM-DD
  used            Int      @default(0)
  limit           Int      @default(10000)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([date])
}

// Publishing Queue Jobs (optional - BullMQ handles this, but useful for history)
model PublishJob {
  id              String      @id @default(cuid())
  jobId           String      @unique // BullMQ job ID
  userId          String
  videoId         String
  platform        Platform
  status          JobStatus   @default(PENDING)
  caption         String      @db.Text
  hashtags        String[]
  scheduledFor    DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  failedAt        DateTime?
  errorMessage    String?     @db.Text
  attemptNumber   Int         @default(0)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([scheduledFor])
  @@index([createdAt])
}

// Enums
enum Platform {
  TIKTOK
  INSTAGRAM
  YOUTUBE
}

enum ConnectionStatus {
  ACTIVE
  EXPIRED
  REVOKED
}

enum VideoStatus {
  PROCESSING
  READY
  FAILED
}

enum JobStatus {
  PENDING
  ACTIVE
  COMPLETED
  FAILED
  DELAYED
}
```

---

## User Model Updates

Update your existing `User` model to include the new relations:

```prisma
model User {
  id                  String              @id @default(cuid())
  email               String              @unique
  name                String?

  // ... existing fields ...

  // New relations
  platformConnections PlatformConnection[]
  publishedPosts      PublishedPost[]
  videos              Video[]
  publishJobs         PublishJob[]

  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
}
```

---

## Migration Commands

After adding the schema updates, run:

```bash
# Create migration
npx prisma migrate dev --name add_platform_integration

# Generate Prisma Client
npx prisma generate

# (Optional) Seed database with test data
npx prisma db seed
```

---

## Seed Data (Optional)

Create `/prisma/seed.ts` for testing:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test@viralmommy.com' },
    update: {},
    create: {
      email: 'test@viralmommy.com',
      name: 'Test Mom Creator',
    },
  });

  console.log('Created test user:', user);

  // Create test platform connection
  const connection = await prisma.platformConnection.create({
    data: {
      userId: user.id,
      platform: 'TIKTOK',
      accessToken: 'encrypted_test_token',
      refreshToken: 'encrypted_refresh_token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      platformUserId: 'tiktok_user_123',
      platformUsername: 'testmomcreator',
      status: 'ACTIVE',
    },
  });

  console.log('Created test platform connection:', connection);

  // Create test video
  const video = await prisma.video.create({
    data: {
      userId: user.id,
      r2Key: 'videos/test-video-123.mp4',
      r2Url: 'https://r2.viralmommy.com/videos/test-video-123.mp4',
      title: 'Test Parenting Hack',
      duration: 30,
      fileSize: 15000000, // 15MB
      format: 'mp4',
      resolution: '1080x1920',
      aspectRatio: '9:16',
      status: 'READY',
    },
  });

  console.log('Created test video:', video);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Update `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

---

## Database Indexes

The schema includes these indexes for performance:

### PlatformConnection
- `userId` - Fast lookup of user's connections
- `status` - Filter active/expired connections
- `(userId, platform)` - Unique constraint + fast lookup

### PublishedPost
- `userId` - User's published posts
- `videoId` - Posts for a specific video
- `platform` - Filter by platform
- `publishedAt` - Sort by publish date
- `(platform, platformPostId)` - Unique constraint

### Video
- `userId` - User's videos
- `status` - Filter by processing status
- `createdAt` - Sort by upload date
- `r2Key` - Unique constraint

### PublishJob
- `userId` - User's jobs
- `status` - Filter by job status
- `scheduledFor` - Find scheduled jobs
- `createdAt` - Sort by creation date
- `jobId` - Unique constraint for BullMQ job ID

---

## Relationships

```
User
├── PlatformConnection[] (1-to-many)
├── Video[] (1-to-many)
├── PublishedPost[] (1-to-many)
└── PublishJob[] (1-to-many)

Video
└── PublishedPost[] (1-to-many)
```

---

## Query Examples

### Get user's platform connections

```typescript
const connections = await prisma.platformConnection.findMany({
  where: {
    userId: user.id,
    status: 'ACTIVE',
  },
});
```

### Get published posts with video details

```typescript
const posts = await prisma.publishedPost.findMany({
  where: { userId: user.id },
  include: {
    video: true,
  },
  orderBy: { publishedAt: 'desc' },
});
```

### Get videos ready for publishing

```typescript
const readyVideos = await prisma.video.findMany({
  where: {
    userId: user.id,
    status: 'READY',
    publishedPosts: {
      none: {}, // Not published yet
    },
  },
});
```

### Track YouTube quota usage

```typescript
const today = new Date().toISOString().split('T')[0];

const quota = await prisma.youTubeQuota.findUnique({
  where: { date: today },
});

if (!quota || quota.used + 1600 <= quota.limit) {
  // Can upload video (1600 units)
  await prisma.youTubeQuota.upsert({
    where: { date: today },
    update: { used: { increment: 1600 } },
    create: { date: today, used: 1600, limit: 10000 },
  });
}
```

---

## Backup & Restore

Before running migrations in production:

```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Run migration
npx prisma migrate deploy

# If issues occur, restore
psql $DATABASE_URL < backup.sql
```

---

## Security Considerations

1. **Token Encryption**
   - Always encrypt `accessToken` and `refreshToken` before storing
   - Use AES-256-GCM encryption
   - Store encryption key in environment variable

2. **Soft Deletes**
   - Consider adding `deletedAt` field for soft deletes
   - Preserve data for analytics/debugging

3. **Data Retention**
   - Implement cleanup job for old completed jobs
   - Archive old published posts periodically

---

## Next Steps

1. Add schema to `/prisma/schema.prisma`
2. Run migration: `npx prisma migrate dev`
3. Update token-manager.ts to use real encryption
4. Test CRUD operations with Prisma Studio: `npx prisma studio`
5. Implement API routes using these models

---

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Client API](https://www.prisma.io/docs/concepts/components/prisma-client)
