# ViralMommy - Quick Start Guide

Get the backend running in 5 minutes.

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Google OAuth credentials

## 1. Install Dependencies

```bash
npm install
```

If you encounter Windows errors:
```bash
npm install --force
```

## 2. Set Up Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with minimum required values:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/viralmommy"

# NextAuth
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (get from console.cloud.google.com)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

## 3. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

## 4. Start Development Server

```bash
npm run dev
```

Open: http://localhost:3000

## 5. Test It Works

### Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Test Authentication
1. Go to http://localhost:3000/login
2. Click "Continue with Google"
3. Sign in with Google
4. Should redirect to dashboard

## Common Issues

### "Can't reach database"
- Make sure PostgreSQL is running
- Check DATABASE_URL is correct

### "Module not found: @prisma/client"
```bash
npx prisma generate
```

### "No secret provided"
- Generate secret: `openssl rand -base64 32`
- Add to .env.local as NEXTAUTH_SECRET

## Next Steps

- See `SETUP.md` for detailed setup
- See `README.md` for full documentation
- See `BACKEND_COMPLETE.md` for architecture details

## Project Structure

```
src/
├── app/              # Pages and API routes
├── lib/              # Utilities (db, auth)
├── types/            # TypeScript definitions
└── middleware.ts     # Route protection

prisma/
└── schema.prisma     # Database schema
```

## Useful Commands

```bash
npm run dev          # Start dev server
npx prisma studio    # Visual database editor
npx prisma migrate   # Create migration
npm run build        # Build for production
```

## Getting Help

- Check error messages in terminal
- Review `.env.local` configuration
- See SETUP.md for troubleshooting
- Read code comments in src/lib/

---

**Backend Ready!** Start building frontend or AI features.
