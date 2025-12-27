# Deployment Guide for MCQ App

## Environment Variables Required

### Vercel Environment Variables

You need to add these environment variables in your Vercel project settings:

1. **DATABASE_URL** (Required)
   - Your PostgreSQL database connection string
   - Example: `postgresql://user:password@host:5432/database?sslmode=require`
   - Get this from your database provider (Neon, Supabase, etc.)

2. **SESSION_SECRET** (Required for Production)
   - A secure random string for JWT session encryption
   - Generate one using: `openssl rand -base64 32`
   - Or use any random string generator
   - Example: `3f8b5c9d2a1e4f7b8c0d3e6f9a2b5c8d`

### Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `DATABASE_URL` → Your database connection string
   - `SESSION_SECRET` → Your secure random string
4. Make sure to add them for all environments (Production, Preview, Development)

## Build Configuration

The app now includes:
- ✅ `postinstall` script that runs `prisma generate` automatically
- ✅ Build script that includes `prisma generate && next build`
- ✅ `vercel.json` with proper build configuration

## Database Setup

Before deploying, make sure your database is set up:

1. **Run Prisma Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

2. **Optional: Seed the Database**:
   ```bash
   npm run seed
   ```

## Troubleshooting

### Build Fails with "Cannot find module '@prisma/client'"
- Solution: The `postinstall` script should handle this automatically now
- Manual fix: Add `prisma generate` to your build command

### Database Connection Issues
- Check that `DATABASE_URL` is set correctly in Vercel
- Ensure your database allows connections from Vercel's IP ranges
- For Neon/Supabase: Make sure connection pooling is enabled

### Session/Authentication Issues
- Verify `SESSION_SECRET` is set in production
- Check that cookies are working (secure flag is set in production)

## Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` with your local database URL and session secret

3. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Production Checklist

- [ ] Environment variables set in Vercel
- [ ] Database migrations applied
- [ ] SESSION_SECRET is a strong random string
- [ ] Database connection string includes SSL mode
- [ ] Test authentication flow after deployment
- [ ] Verify exam creation and management works
- [ ] Check that file uploads work (if applicable)

## Architecture

- **Framework**: Next.js 16.1.1 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based sessions with `jose`
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel

## Support

If you encounter issues during deployment, check:
1. Vercel build logs for specific error messages
2. Database connection status
3. Environment variables are correctly set
4. Prisma schema matches your database
