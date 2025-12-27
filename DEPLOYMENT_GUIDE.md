# 🚀 Deployment Guide - MCQ Exam SaaS Platform

## Overview
This guide will help you deploy your fully-functional exam platform to production.

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or hosted)
- Vercel account (recommended) or any Node.js hosting
- Git repository

---

## Step 1: Database Setup

### Option A: Using Supabase (Recommended - Free Tier Available)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy your database connection string

2. **Get Connection String**
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Option B: Using Railway

1. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - Create new project → Add PostgreSQL
   - Copy connection string from variables

### Option C: Local PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu
   sudo apt install postgresql
   sudo service postgresql start
   ```

2. **Create Database**
   ```bash
   psql postgres
   CREATE DATABASE exam_platform;
   ```

---

## Step 2: Environment Configuration

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file**
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:5432/database"
   
   # JWT Secret (generate a random string)
   JWT_SECRET="your-super-secret-random-string-here"
   
   # Optional: Stripe (for payments)
   STRIPE_SECRET_KEY="sk_test_..." # Test key
   STRIPE_PUBLISHABLE_KEY="pk_test_..." # Test key
   
   # Node Environment
   NODE_ENV="production"
   ```

3. **Generate JWT Secret**
   ```bash
   # Generate a secure random string
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

---

## Step 3: Apply Database Migrations

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run Prisma migrations**
   ```bash
   # This applies all schema changes
   npx prisma migrate deploy
   ```

3. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Verify migration**
   ```bash
   # Open Prisma Studio to check tables
   npx prisma studio
   ```

   **Expected tables:**
   - User
   - Exam
   - Question
   - StudentAttempt (with all new fields)
   - Payment

5. **(Optional) Seed initial data**
   ```bash
   npx prisma db seed
   ```

---

## Step 4: Local Testing

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

3. **Test locally**
   - Open http://localhost:3000
   - Register a new account
   - Create an exam
   - Test student flow

---

## Step 5: Deploy to Vercel (Recommended)

### Why Vercel?
- ✅ Built for Next.js
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Easy environment variables
- ✅ Free hobby plan

### Deployment Steps

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # First deployment (follow prompts)
   vercel
   
   # Production deployment
   vercel --prod
   ```

4. **Configure Environment Variables**
   
   Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   
   Add:
   - `DATABASE_URL` = Your PostgreSQL connection string
   - `JWT_SECRET` = Your JWT secret
   - `NODE_ENV` = production

5. **Redeploy after adding variables**
   ```bash
   vercel --prod
   ```

---

## Step 6: Alternative Deployment (Railway)

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login and initialize**
   ```bash
   railway login
   railway init
   ```

3. **Add environment variables**
   ```bash
   railway variables set DATABASE_URL="your-connection-string"
   railway variables set JWT_SECRET="your-jwt-secret"
   ```

4. **Deploy**
   ```bash
   railway up
   ```

---

## Step 7: Alternative Deployment (Docker)

1. **Create Dockerfile** (if not exists)
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npx prisma generate
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         DATABASE_URL: ${DATABASE_URL}
         JWT_SECRET: ${JWT_SECRET}
       depends_on:
         - db
     
     db:
       image: postgres:15
       environment:
         POSTGRES_DB: exam_platform
         POSTGRES_PASSWORD: password
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

3. **Build and run**
   ```bash
   docker-compose up -d
   ```

---

## Step 8: Post-Deployment Checklist

### Immediate Testing
- [ ] Visit your deployed URL
- [ ] Register a new teacher account
- [ ] Login successfully
- [ ] Create a new exam
- [ ] Add questions
- [ ] Try to publish (should show credit requirement)
- [ ] Buy credits or upgrade to Pro
- [ ] Publish exam
- [ ] Copy exam link
- [ ] Open in incognito/private window
- [ ] Complete exam as student
- [ ] Verify results display
- [ ] Check leaderboard
- [ ] Check analytics

### Security Check
- [ ] HTTPS enabled (should be automatic with Vercel)
- [ ] Environment variables not exposed
- [ ] Database credentials secure
- [ ] JWT secret is random and secret
- [ ] No sensitive data in logs

### Performance Check
- [ ] Page load times < 3 seconds
- [ ] Database queries optimized
- [ ] Images loading properly
- [ ] Mobile responsive

---

## Step 9: Domain Setup (Optional)

### Using Vercel

1. **Buy domain** (Namecheap, GoDaddy, etc.)

2. **Add domain in Vercel**
   - Go to Project → Settings → Domains
   - Add your domain
   - Follow DNS configuration instructions

3. **Update DNS records**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. **Wait for DNS propagation** (5-30 minutes)

---

## Step 10: Monitoring & Maintenance

### Error Monitoring (Optional)

1. **Sentry Setup**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

2. **Environment variable**
   ```env
   SENTRY_DSN="your-sentry-dsn"
   ```

### Database Backups

**Supabase:**
- Automatic daily backups on paid plans
- Manual backup: Database → Backups

**Railway:**
- Automatic backups on Pro plan
- Manual: Export via pgAdmin

**Self-hosted:**
```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Monitoring Tools

1. **Vercel Analytics** (built-in)
   - Go to Project → Analytics

2. **Uptime monitoring**
   - [UptimeRobot](https://uptimerobot.com) (free)
   - Set up HTTP monitor for your URL

---

## Common Issues & Solutions

### Issue: "Can't reach database"
**Solution:**
- Check DATABASE_URL is correct
- Ensure database allows connections from Vercel IPs
- For Supabase, use direct connection string (not pooling URL)

### Issue: "Prisma Client not generated"
**Solution:**
```bash
npx prisma generate
vercel --prod
```

### Issue: "Module not found" errors
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: "Session errors"
**Solution:**
- Ensure JWT_SECRET is set in production
- Clear browser cookies
- Check that it's the same secret across deployments

### Issue: "Payment not working"
**Solution:**
- Verify Stripe keys are set
- Use test keys for testing
- Check Stripe dashboard for errors

---

## Performance Optimization

### 1. Database Connection Pooling
Add to DATABASE_URL:
```
?connection_limit=10&pool_timeout=20
```

### 2. Enable Caching
Vercel automatically caches static assets.

### 3. Image Optimization
Images already optimized via Next.js Image component.

---

## Scaling Considerations

### When you need to scale:

**100-1000 users:**
- ✅ Current setup is fine
- Free/Hobby plans sufficient

**1000-10,000 users:**
- Upgrade to Vercel Pro ($20/mo)
- Database: Supabase Pro or Railway Pro
- Consider Redis for sessions

**10,000+ users:**
- Enterprise hosting
- Dedicated database
- CDN for static assets
- Load balancer
- Redis caching

---

## Security Best Practices

### Ongoing Security

1. **Keep dependencies updated**
   ```bash
   npm audit
   npm update
   ```

2. **Monitor for vulnerabilities**
   - GitHub Dependabot (automatic)
   - Snyk.io (optional)

3. **Rate limiting** (recommended)
   - Add middleware for API rate limiting
   - Prevent brute force attacks

4. **Database security**
   - Use connection string with SSL
   - Restrict database access by IP (if possible)
   - Regular backups

---

## Marketing & Launch

### Pre-Launch
- [ ] Test with 5-10 beta users
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Prepare marketing materials

### Launch Day
- [ ] Post on Product Hunt
- [ ] Share on Twitter/LinkedIn
- [ ] Post in relevant communities
- [ ] Email your network

### Post-Launch
- [ ] Monitor error logs daily
- [ ] Respond to user feedback
- [ ] Track key metrics (signups, exams created)
- [ ] Iterate based on usage

---

## Support & Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Vercel Docs](https://vercel.com/docs)

### Community
- Next.js Discord
- Prisma Slack
- r/nextjs subreddit

### Need Help?
- Check PRODUCTION_CHECKLIST.md
- Review error logs in Vercel dashboard
- Search GitHub issues
- Stack Overflow with tags: next.js, prisma

---

## 🎉 Congratulations!

Your exam platform is now live and ready to serve users!

**Next Steps:**
1. Share your platform link
2. Onboard your first users
3. Collect feedback
4. Iterate and improve
5. **Start making money!** 💰

---

**Remember:** This platform is production-ready with all essential features. Focus on getting users and gathering feedback rather than adding more features initially.

Good luck with your SaaS! 🚀
