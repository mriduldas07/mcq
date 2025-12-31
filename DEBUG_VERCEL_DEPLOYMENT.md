# 🔍 Debug Vercel Deployment: mcqchoice.vercel.app

## Issue
The site at https://mcqchoice.vercel.app/ is not working properly.

---

## Common Problems & Solutions

### Problem 1: Site Loads but OAuth Fails ❌

**Symptoms:**
- Site loads fine
- Can see homepage
- Login button exists
- But clicking "Continue with Google" fails
- Error: "redirect_uri_mismatch" or "Error 400"

**Solution:**
You need to add `https://mcqchoice.vercel.app` to Google Console.

**Fix Steps:**

1. Go to: https://console.cloud.google.com/apis/credentials

2. Click on your OAuth 2.0 Client ID

3. Add to **Authorized JavaScript origins:**
   ```
   https://mcqchoice.vercel.app
   ```

4. Add to **Authorized redirect URIs:**
   ```
   https://mcqchoice.vercel.app/api/auth/callback/google
   ```

5. Click **Save**

6. Update Vercel environment variable:
   - `NEXTAUTH_URL` = `https://mcqchoice.vercel.app`

7. Redeploy on Vercel

---

### Problem 2: Build Failed 🔴

**Symptoms:**
- Vercel shows "Deployment failed"
- Site shows Vercel error page
- Build logs show errors

**Check Vercel Build Logs:**

1. Go to: https://vercel.com/dashboard
2. Click on your project
3. Go to "Deployments" tab
4. Click on the failed deployment
5. Check the build logs

**Common Build Errors:**

#### Error: "Module not found: next-auth"
**Solution:** Package.json updated but dependencies not installed
```bash
# Run locally to verify
npm install
npm run build

# If successful, commit and push
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

#### Error: "Prisma Client not generated"
**Solution:** Add build command in Vercel
1. Go to Project Settings → General → Build & Development Settings
2. Build Command: `npx prisma generate && npm run build`
3. Redeploy

#### Error: "Type errors"
**Solution:** TypeScript compilation failed
- Check local build: `npm run build`
- Fix any TypeScript errors
- Push fixes

---

### Problem 3: Environment Variables Missing ⚠️

**Symptoms:**
- Site loads
- White screen or error page
- Console shows: "NEXTAUTH_SECRET not defined"

**Solution:**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**

```env
DATABASE_URL = postgresql://neondb_owner:npg_r8Gumwv6MVxQ@ep-round-hall-adqrf37m-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

NEXTAUTH_URL = https://mcqchoice.vercel.app

NEXTAUTH_SECRET = eOGHjWLkqbYnAkpepNIxqHqeQnC3BPA+30DS3hlR0HQ=

GOOGLE_CLIENT_ID = your-google-client-id.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET = your-google-client-secret
```

**After adding variables:**
- Click "Redeploy" button

---

### Problem 4: Database Connection Failed 🔌

**Symptoms:**
- Site loads
- Error: "Can't reach database server"
- Prisma connection errors

**Solution:**

1. **Verify DATABASE_URL in Vercel:**
   - Go to Environment Variables
   - Check DATABASE_URL is correct
   - Should be your Neon PostgreSQL URL

2. **Check Neon Database:**
   - Go to: https://console.neon.tech/
   - Verify database is running
   - Check connection string hasn't changed

3. **Run Migrations on Production:**
   
   Option 1 - Via Vercel CLI:
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

   Option 2 - Via package.json:
   Add to `package.json`:
   ```json
   {
     "scripts": {
       "build": "prisma generate && prisma migrate deploy && next build"
     }
   }
   ```

---

### Problem 5: Page Not Found (404) 🔍

**Symptoms:**
- Homepage loads
- Specific routes return 404
- `/login` shows 404

**Solution:**

1. **Check if files exist:**
   - Verify `src/app/(auth)/login/page.tsx` exists in repo
   - Check file was committed and pushed

2. **Check build output:**
   - Look at Vercel deployment logs
   - See if route was generated

3. **Verify folder structure:**
   ```
   src/
   ├── app/
   │   ├── (auth)/
   │   │   └── login/
   │   │       └── page.tsx  ← Must exist
   ```

---

### Problem 6: Infinite Redirect Loop 🔄

**Symptoms:**
- Page keeps redirecting
- Never loads content
- Console shows multiple redirects

**Solution:**

Check middleware configuration:
- Middleware is redirecting incorrectly
- Session check failing
- Fix in `src/middleware.ts`

---

## 🔧 How to Debug Your Specific Issue

### Step 1: Check Vercel Deployment Status

1. Go to: https://vercel.com/dashboard
2. Find your project
3. Check latest deployment status:
   - ✅ Green = Success
   - 🔴 Red = Failed
   - 🟡 Yellow = Building

### Step 2: Check Build Logs

If deployment failed:
1. Click on the failed deployment
2. Read the error message
3. Look for:
   - Module not found errors
   - TypeScript errors
   - Build command failures

### Step 3: Check Runtime Logs

If deployment succeeded but site doesn't work:
1. Go to your Vercel project
2. Click "Functions" tab
3. Check for runtime errors
4. Look for:
   - Database connection errors
   - Auth errors
   - Missing environment variables

### Step 4: Test Locally First

Always test locally before deploying:
```bash
# Pull environment variables from Vercel
vercel env pull .env.local

# Run production build locally
npm run build

# Start production server
npm start

# Test at http://localhost:3000
```

If it works locally but not on Vercel, it's likely:
- Environment variables missing
- Database not accessible
- OAuth URLs not configured

---

## ✅ Complete Deployment Checklist

### Pre-Deployment:
- [ ] Local build succeeds: `npm run build`
- [ ] Local site works: `npm run dev`
- [ ] All tests pass (if any)
- [ ] Git repo up to date
- [ ] No sensitive data in code

### Vercel Configuration:
- [ ] Project connected to Git repo
- [ ] Build command: `npm run build` or custom
- [ ] Environment variables set:
  - [ ] DATABASE_URL
  - [ ] NEXTAUTH_URL (production URL)
  - [ ] NEXTAUTH_SECRET
  - [ ] GOOGLE_CLIENT_ID
  - [ ] GOOGLE_CLIENT_SECRET

### Google Console Configuration:
- [ ] OAuth Client ID created
- [ ] Production URL in authorized origins
- [ ] Callback URL in authorized redirect URIs
  - [ ] `https://mcqchoice.vercel.app/api/auth/callback/google`

### Database:
- [ ] Neon database running
- [ ] Migrations applied
- [ ] Connection string correct

### Post-Deployment:
- [ ] Deployment succeeded (green checkmark)
- [ ] Site loads: https://mcqchoice.vercel.app/
- [ ] Login page accessible: https://mcqchoice.vercel.app/login
- [ ] Google OAuth works
- [ ] Dashboard accessible after login

---

## 🚨 Quick Diagnosis

### Tell me what you see when you visit https://mcqchoice.vercel.app/

**Option A: Vercel Error Page**
- Issue: Build failed or app crashed
- Check: Vercel build logs and runtime logs

**Option B: Blank White Screen**
- Issue: JavaScript error or missing environment variables
- Check: Browser console for errors

**Option C: Site loads but login fails**
- Issue: OAuth not configured
- Check: Google Console settings and NEXTAUTH_URL

**Option D: Database/Prisma error**
- Issue: Can't connect to database
- Check: DATABASE_URL and Neon status

**Option E: 404 on login page**
- Issue: Route not built
- Check: File structure and build logs

---

## 🆘 Need Help?

To help debug, please share:

1. **What you see:** Describe the error/issue
2. **Vercel logs:** Copy error messages from Vercel
3. **Browser console:** Any JavaScript errors
4. **Environment variables:** Confirm they're set (don't share values!)
5. **Google Console:** Confirm URLs are added

---

## 📞 Resources

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Logs:** Project → Deployments → Click deployment → View logs
- **Google Console:** https://console.cloud.google.com/apis/credentials
- **Neon Console:** https://console.neon.tech/

---

Let me know what specific error you're seeing and I can help you fix it! 🚀
