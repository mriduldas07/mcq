# 🚀 Fix Google OAuth on Vercel

## Problem
Google OAuth works on `localhost:3000` but fails on Vercel deployment.

## Root Cause
Your Google OAuth credentials are only configured for localhost. Vercel has a different domain, so Google rejects the authentication.

---

## ✅ Solution: Add Production URLs to Google Console

### Step 1: Get Your Vercel Domain

Your Vercel URL will be something like:
```
https://your-app-name.vercel.app
```

Or if you have a custom domain:
```
https://your-custom-domain.com
```

---

### Step 2: Update Google Cloud Console

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/apis/credentials

2. **Select your OAuth 2.0 Client ID** (the one you created)

3. **Add Authorized JavaScript Origins:**
   
   Click "Add URI" and add:
   ```
   https://your-app-name.vercel.app
   ```
   
   If you have a custom domain, also add:
   ```
   https://your-custom-domain.com
   ```

4. **Add Authorized Redirect URIs:**
   
   Click "Add URI" and add:
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```
   
   If you have a custom domain, also add:
   ```
   https://your-custom-domain.com/api/auth/callback/google
   ```

5. **Save Changes**

---

### Step 3: Update Vercel Environment Variables

1. **Go to your Vercel Dashboard:**
   https://vercel.com/dashboard

2. **Select your project**

3. **Go to Settings → Environment Variables**

4. **Add these variables:**

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Your Neon PostgreSQL URL |
   | `NEXTAUTH_URL` | `https://your-app-name.vercel.app` |
   | `NEXTAUTH_SECRET` | Your secret (same as local) |
   | `GOOGLE_CLIENT_ID` | Your Google Client ID |
   | `GOOGLE_CLIENT_SECRET` | Your Google Client Secret |

   **Important:** Make sure `NEXTAUTH_URL` matches your actual Vercel domain!

5. **Save all variables**

---

### Step 4: Redeploy

1. Go to "Deployments" tab
2. Click on the latest deployment
3. Click "Redeploy" button

OR just push a new commit:
```bash
git add .
git commit -m "Update environment variables"
git push
```

Vercel will automatically deploy with the new environment variables.

---

## 🔍 Common Issues & Solutions

### Issue 1: "Redirect URI Mismatch"

**Error:**
```
Error 400: redirect_uri_mismatch
```

**Solution:**
Double-check the redirect URI in Google Console exactly matches:
```
https://your-exact-domain.vercel.app/api/auth/callback/google
```

No trailing slashes, exact match!

---

### Issue 2: "NEXTAUTH_URL not set"

**Error:**
```
[auth][error] MissingSecret
```

**Solution:**
Make sure you added `NEXTAUTH_URL` to Vercel environment variables with your production URL.

---

### Issue 3: "Cannot connect to database"

**Error:**
```
P1001: Can't reach database server
```

**Solution:**
1. Check `DATABASE_URL` is set in Vercel
2. Make sure your Neon database allows connections from Vercel IPs
3. Neon should work automatically, but verify the connection string

---

### Issue 4: Multiple Domains (Preview URLs)

Vercel creates preview URLs for each branch:
- `https://your-app-git-main.vercel.app`
- `https://your-app-git-dev.vercel.app`
- etc.

**Solution:**

**Option 1: Add wildcard (Recommended for development)**
In Google Console, you can't use wildcards directly, but you can:
1. Use a custom domain for production only
2. Test OAuth on localhost and production only
3. Accept that preview branches won't have OAuth (they'll redirect to login but fail)

**Option 2: Use environment-specific OAuth clients**
Create separate OAuth clients:
- One for localhost
- One for production
- Use different `GOOGLE_CLIENT_ID` per environment

**Option 3: Just use production domain**
Only enable OAuth on your main production URL, not preview branches.

---

## 📋 Complete Checklist

- [ ] Get your Vercel deployment URL
- [ ] Add production URL to Google Console authorized origins
- [ ] Add production callback URL to Google Console redirect URIs
- [ ] Add `NEXTAUTH_URL` to Vercel environment variables
- [ ] Add `NEXTAUTH_SECRET` to Vercel environment variables
- [ ] Add `GOOGLE_CLIENT_ID` to Vercel environment variables
- [ ] Add `GOOGLE_CLIENT_SECRET` to Vercel environment variables
- [ ] Add `DATABASE_URL` to Vercel environment variables
- [ ] Redeploy on Vercel
- [ ] Test login on production URL
- [ ] Verify redirect works
- [ ] Check database connection

---

## 🎯 Example Configuration

### Google Console Settings:

**Authorized JavaScript origins:**
```
http://localhost:3000
https://mcq-platform.vercel.app
https://mcqplatform.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
https://mcq-platform.vercel.app/api/auth/callback/google
https://mcqplatform.com/api/auth/callback/google
```

### Vercel Environment Variables:

```env
DATABASE_URL=postgresql://neondb_owner:password@host/neondb?sslmode=require
NEXTAUTH_URL=https://mcq-platform.vercel.app
NEXTAUTH_SECRET=eOGHjWLkqbYnAkpepNIxqHqeQnC3BPA+30DS3hlR0HQ=
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
```

---

## 🔐 Security Notes

1. **Never commit `.env.local` to Git** - It's in `.gitignore` (good!)
2. **Different secrets per environment** - Consider using different `NEXTAUTH_SECRET` for production
3. **Rotate secrets periodically** - Google secrets can be regenerated
4. **Use custom domain** - Looks more professional and stable URLs

---

## 🚀 After Setup

Once configured, your production flow will be:

1. User visits: `https://your-app.vercel.app`
2. Clicks "Get Started"
3. Goes to: `https://your-app.vercel.app/login`
4. Clicks "Continue with Google"
5. Redirected to Google OAuth
6. Google redirects back to: `https://your-app.vercel.app/api/auth/callback/google`
7. Account created/logged in
8. Redirected to: `https://your-app.vercel.app/dashboard`

✅ Works perfectly!

---

## 💡 Pro Tips

### Use Vercel Environment Variable Groups

For multiple environments:
```
Production: NEXTAUTH_URL=https://mcqplatform.com
Preview: NEXTAUTH_URL=https://your-app.vercel.app
Development: (use .env.local)
```

### Custom Domain Setup

If you have a custom domain:
1. Add it in Vercel Dashboard
2. Update `NEXTAUTH_URL` to your custom domain
3. Update Google Console URLs to custom domain
4. Users will see your branded domain!

---

## Need Help?

Common places to check:
1. **Vercel Logs** - See deployment errors
2. **Browser Console** - Check redirect errors
3. **Google Console** - Verify URI settings
4. **Environment Variables** - Double-check all are set

---

## Summary

The fix is simple:
1. ✅ Add your Vercel URL to Google Console
2. ✅ Add environment variables to Vercel
3. ✅ Redeploy

**Time to fix: ~5 minutes**

Then OAuth will work perfectly on production! 🎉
