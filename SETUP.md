# ViralMommy - Setup Guide for Developers

## Quick Start

This document is for developers joining the project. The backend architecture is complete and ready for frontend/AI integration.

## What's Been Done (Week 1, Days 1-2)

### Backend Architecture - 100% Complete

1. **Next.js 16 with App Router** - Modern React framework
2. **TypeScript (strict mode)** - Type safety enabled
3. **Prisma ORM** - Complete database schema
4. **NextAuth.js** - Google OAuth authentication
5. **API Routes** - All stubs created
6. **Project Structure** - Organized and ready

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

**Note**: If you encounter Windows permission errors with `node_modules`, close all editors/terminals and try:
```bash
npm install --force
```

### 2. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

#### Required Variables (Minimum for Local Development)
```env
# Database (required)
DATABASE_URL="postgresql://postgres:password@localhost:5432/viralmommy"

# NextAuth (required)
NEXTAUTH_SECRET="run-this: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (required for auth)
GOOGLE_CLIENT_ID="get-from-google-cloud-console"
GOOGLE_CLIENT_SECRET="get-from-google-cloud-console"
```

#### Optional (Add as needed)
```env
# AI APIs
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-proj-..."

# Storage
R2_ACCESS_KEY_ID="your-key"
R2_SECRET_ACCESS_KEY="your-secret"
```

### 3. Set Up Database

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL locally
# Then create database:
createdb viralmommy

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

#### Option B: Railway PostgreSQL (Recommended)
1. Create account at railway.app
2. Create PostgreSQL service
3. Copy DATABASE_URL from Railway
4. Update .env.local
5. Run migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth Client ID
5. Application type: Web application
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure Overview

```
src/
├── app/
│   ├── (auth)/              # Authentication pages (login, signup)
│   ├── (dashboard)/         # Protected pages (dashboard, videos)
│   ├── api/                 # API routes
│   │   ├── auth/[...nextauth]/  # NextAuth handlers
│   │   ├── health/          # Health check
│   │   ├── upload/          # Video upload (stub)
│   │   └── video/           # Video CRUD (functional)
│   ├── layout.tsx           # Root layout with fonts
│   ├── page.tsx             # Landing page
│   └── globals.css          # Tailwind styles
├── lib/
│   ├── db.ts                # Prisma client (use this!)
│   ├── auth.ts              # NextAuth config
│   ├── video/               # Video processing utilities
│   └── ai/                  # AI integration utilities
├── types/
│   └── next-auth.d.ts       # NextAuth type extensions
└── middleware.ts            # Route protection
```

## Database Schema

Access via Prisma Client:
```typescript
import { prisma } from '@/lib/db';

// Example: Get all videos for user
const videos = await prisma.video.findMany({
  where: { userId: session.user.id },
  include: { aiStrategies: true }
});
```

### Main Models

- **User** - Authentication, subscriptions
- **Video** - Uploaded videos with AI analysis
- **AiStrategy** - AI-generated content strategies
- **PlatformConnection** - Social media OAuth tokens
- **PublishedPost** - Published content tracking
- **BrandKit** - User branding assets

### View Schema
```bash
npx prisma studio
```

## API Routes

All routes are in `src/app/api/`:

### Implemented
- `GET /api/health` - Health check with DB status
- `GET /api/video` - List user's videos (paginated)
- `GET /api/video/[id]` - Get video details
- `PATCH /api/video/[id]` - Update video
- `DELETE /api/video/[id]` - Delete video

### Stubs (Need Implementation)
- `POST /api/upload` - Upload video files

### How to Use Protected Routes
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Your code here
}
```

## Common Tasks

### Add a New API Route
1. Create file in `src/app/api/your-route/route.ts`
2. Export GET, POST, PATCH, DELETE functions
3. Use `getServerSession` for auth
4. Return `NextResponse.json(data)`

### Add a New Page
1. Create file in `src/app/your-page/page.tsx`
2. Use `'use client'` if you need client features
3. Protected routes go in `(dashboard)/`
4. Public routes go directly in `app/`

### Add Database Model
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_model_name`
3. Run `npx prisma generate`
4. Import from `@/lib/db`

### Test Authentication
1. Start dev server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click "Continue with Google"
4. After auth, should redirect to `/dashboard`

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npx prisma studio        # Visual database editor
npx prisma migrate dev   # Create migration
npx prisma generate      # Generate Prisma Client
npx prisma db push       # Push schema (no migration)
npx prisma migrate reset # Reset database (CAREFUL!)

# Testing
curl http://localhost:3000/api/health  # Test health endpoint
```

## Troubleshooting

### "Can't reach database server"
- Check PostgreSQL is running
- Verify DATABASE_URL in .env.local
- Try: `npx prisma db push`

### "Prisma Client not found"
```bash
npx prisma generate
```

### "NextAuth error: No secret provided"
```bash
# Generate secret
openssl rand -base64 32
# Add to .env.local as NEXTAUTH_SECRET
```

### npm install fails on Windows
```bash
# Close all terminals/editors
rm -rf node_modules
npm install --force
```

### Type errors in VSCode
```bash
# Restart TypeScript server
# Command Palette: TypeScript: Restart TS Server
```

## Next Steps for Development

### Frontend Team (Days 3-5)
- [ ] Build video upload UI with drag-and-drop
- [ ] Create dashboard analytics components
- [ ] Implement video gallery with filters
- [ ] Design responsive navigation

### AI Team (Days 6-7)
- [ ] Implement R2 storage upload
- [ ] Build transcription pipeline (Whisper)
- [ ] Create AI strategy generator (Claude)
- [ ] Add viral score calculation

### Backend Team (Ongoing)
- [ ] Implement file upload handling
- [ ] Add job queue (BullMQ/Redis)
- [ ] Create webhook handlers
- [ ] Build analytics aggregation

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Need Help?

- Check existing code in `src/app/api/video/[id]/route.ts` for examples
- Review Prisma schema in `prisma/schema.prisma`
- See `.env.example` for all available config options
- Read main README.md for architecture overview

## Project Status

**Current Phase**: Week 1, Day 3
**Status**: Backend Complete, Ready for Frontend & AI Integration
**Next Milestone**: Video Upload UI + AI Processing Pipeline

---

Built with Next.js 16, Prisma, and NextAuth
